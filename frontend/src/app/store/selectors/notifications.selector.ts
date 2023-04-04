import { createFeatureSelector, createSelector } from '@ngrx/store';
import dayjs from 'dayjs';
import { DateSortedNotifications } from 'src/app/services/api/entities/notification-list.entity';
import { NotificationsState } from '../reducers/notifications.reducer';

export const selectNotificationState =
  createFeatureSelector<NotificationsState>('notification');

export const selectRecentNotifications = createSelector(
  selectNotificationState,
  (state: NotificationsState) => state.recent
);

export const selectTotalUnreadNotifications = createSelector(
  selectNotificationState,
  (state: NotificationsState) => state.unread
);

export const selectNotificationList = createSelector(
  selectNotificationState,
  (state: NotificationsState) => {
    let dateSortedNotifications: DateSortedNotifications[] = [];

    let unsortedNotifications = [...state.notificationList];

    unsortedNotifications
      .sort((a, b) => {
        let keyA = new Date(a.createdAt);
        let keyB = new Date(b.createdAt);
        if (keyA < keyB) return 1;
        if (keyA > keyB) return -1;
        return 0;
      })
      .forEach((notification) => {
        // sort notifications by date
        // if date exists already, push notification in this date array
        // if not, create new date entry with notification
        let noMatchingDateFound = true;
        let notificationDate = dayjs(notification.createdAt).format(
          'DD/MM/YYYY'
        );

        dateSortedNotifications.forEach((sortedNotification, index) => {
          let date = dayjs(sortedNotification.date).format('DD/MM/YYYY');

          if (date === notificationDate) {
            dateSortedNotifications[index].notifications.push(notification);
            noMatchingDateFound = false;
          }
        });

        if (noMatchingDateFound) {
          dateSortedNotifications.push({
            date: notification.createdAt,
            notifications: [notification],
          });
        }
        noMatchingDateFound = true;
      });

    return dateSortedNotifications;
  }
);
