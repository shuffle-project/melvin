import { createReducer, on } from '@ngrx/store';
import { NotificationEntity } from 'src/app/services/api/entities/notification.entity';
import * as notificationsActions from '../actions/notifications.actions';

export interface NotificationsState {
  unread: number;
  recent: ReadonlyArray<NotificationEntity>;
  notificationList: ReadonlyArray<NotificationEntity>;
}

export const initialState: NotificationsState = {
  unread: 0,
  recent: [],
  notificationList: [],
};

export const notificationReducer = createReducer(
  initialState,
  on(notificationsActions.findAllSuccess, (state, action) => {
    return {
      ...state,
      notificationList: action.notificationList.notifications,
    };
  }),
  //update single
  on(notificationsActions.updateSuccess, (state, action) => ({
    ...state,
    notificationList: state.notificationList.map((item) => {
      if (item.id !== action.notification.id) {
        return item;
      }
      return {
        ...item,
        ...action.notification,
      };
    }),
    recent: state.recent.map((item) => {
      if (item.id !== action.notification.id) {
        return item;
      }
      return {
        ...item,
        ...action.notification,
      };
    }),
  })),
  //update multiple
  on(
    notificationsActions.updateManySuccess,
    notificationsActions.updateFromWS,
    (state, action) => ({
      ...state,
      notificationList: state.notificationList.map((item) => {
        if (!action.notifications.some((obj) => obj.id === item.id)) {
          return item;
        }
        return {
          ...item,
          ...action.notifications.find((obj) => obj.id === item.id),
        };
      }),
      recent: state.recent.map((item) => {
        if (!action.notifications.some((obj) => obj.id === item.id)) {
          return item;
        }
        return {
          ...item,
          ...action.notifications.find((obj) => obj.id === item.id),
        };
      }),
    })
  ),
  // remove single
  on(notificationsActions.removeSuccess, (state, action) => {
    let removedNotification = state.notificationList.filter(
      (item) => item.id === action.removedNotificationId
    );

    let newUnreadCount = state.unread;

    if (removedNotification[0] !== undefined) {
      if (!removedNotification[0].read) {
        newUnreadCount = state.unread - 1;
      }
    }

    return {
      ...state,
      unread: newUnreadCount,
      recent: state.recent.filter(
        (item) => item.id !== action.removedNotificationId
      ),
      notificationList: state.notificationList.filter(
        (item) => item.id !== action.removedNotificationId
      ),
    };
  }),
  //remove multiple
  on(
    notificationsActions.removeFromWS,
    notificationsActions.bulkRemoveSuccess,
    (state, action) => {
      const notificationList = state.notificationList.filter(
        (item) => !action.removedNotificationIds.includes(item.id)
      );

      const unread = notificationList.filter(
        (notification) => !notification.read
      ).length;

      const recent = state.recent.filter(
        (item) => !action.removedNotificationIds.includes(item.id)
      );

      return {
        ...state,
        unread,
        recent,
        notificationList,
      };
    }
  ),
  on(notificationsActions.createFromWS, (state, action) => {
    return {
      ...state,
      notificationList: [action.notification, ...state.notificationList],
      unread: state.unread + 1,
      recent: [action.notification, state.recent[0], state.recent[1]],
    };
  }),
  on(notificationsActions.findRecentSuccess, (state, action) => ({
    ...state,
    recent: action.notificationList.notifications,
    unread: action.notificationList.total,
  }))
);
