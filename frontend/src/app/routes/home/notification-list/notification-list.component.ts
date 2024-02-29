import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Store } from '@ngrx/store';
import dayjs from 'dayjs';
import { Observable, Subject, lastValueFrom, take, takeUntil } from 'rxjs';
import { NotificationComponent } from '../../../components/notification/notification.component';
import { UpdateNotificationDtoWithId } from '../../../services/api/dto/update-notification.dto';
import { DateSortedNotifications } from '../../../services/api/entities/notification-list.entity';
import * as notificationsActions from '../../../store/actions/notifications.actions';
import * as authSelectors from '../../../store/selectors/auth.selector';
import * as notificationsSelectors from '../../../store/selectors/notifications.selector';

import { HeaderComponent } from '../../../components/header/header.component';

@Component({
  selector: 'app-notification-list',
  templateUrl: './notification-list.component.html',
  styleUrls: ['./notification-list.component.scss'],
  standalone: true,
  imports: [
    HeaderComponent,
    MatButtonModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatDividerModule,
    NotificationComponent,
  ],
})
export class NotificationListComponent implements OnDestroy, OnInit {
  private destroy$$ = new Subject<void>();
  dateSortedNotifications$: Observable<DateSortedNotifications[]>;
  dateSortedNotifications!: DateSortedNotifications[];

  selectedNotifications: string[] = [];
  allNotificationsSelected: boolean = false;

  constructor(private store: Store) {
    this.dateSortedNotifications$ = this.store.select(
      notificationsSelectors.selectNotificationList
    );

    this.dateSortedNotifications$
      .pipe(takeUntil(this.destroy$$))
      .subscribe((dateSortedNotifications) => {
        this.dateSortedNotifications = dateSortedNotifications;
      });
  }

  async ngOnInit() {
    const userId = await lastValueFrom(
      this.store.select(authSelectors.selectUserId).pipe(take(1))
    );

    if (userId) {
      this.store.dispatch(notificationsActions.findAll({ userId: userId }));
    }
  }

  ngOnDestroy() {
    this.destroy$$.next();
  }

  onFormatDate(date: string) {
    return dayjs(date).calendar(null, {
      sameDay: $localize`:@@notificationListTodayLabel:[Today]`,
      lastDay: $localize`:@@notificationListYesterdayLabel:[Yesterday]`,
      lastWeek: 'DD. MMMM YYYY',
      sameElse: 'DD. MMMM YYYY',
    });
  }

  onNotificationRead() {
    const notifications: UpdateNotificationDtoWithId[] =
      this.selectedNotifications.map((id) => ({
        id,
        read: true,
      }));

    this.store.dispatch(
      notificationsActions.updateManyFromNotificationList({
        updateManyNotificationsDto: { notifications },
      })
    );
    this.handleNotificationsChange();
  }

  onNotificationDelete() {
    this.store.dispatch(
      notificationsActions.bulkRemove({
        removeNotificationIds: this.selectedNotifications,
      })
    );

    this.handleNotificationsChange();
  }

  handleNotificationsChange() {
    this.selectedNotifications = [];
    this.allNotificationsSelected = false;
  }

  onSelectAllNotifications(allSelected: boolean) {
    this.allNotificationsSelected = allSelected;
    this.selectedNotifications = [];

    if (allSelected) {
      this.dateSortedNotifications.forEach((day) => {
        day.notifications.forEach((notification) => {
          this.selectedNotifications.push(notification.id);
        });
      });
    } else {
      return;
    }
  }
  // for the top checkbox, checks if some notifications are selected to show intermediate state
  onSomeNotificationsSelected() {
    return (
      this.selectedNotifications.length > 0 && !this.allNotificationsSelected
    );
  }

  onCheckIfSelected(notificationId: string) {
    return this.selectedNotifications.includes(notificationId);
  }

  onToggleNotificationSelection(id: string) {
    // checks if the notification is already in the selectedNotifications array and therefore
    // already active. Then it removes it from the array to deactivate the checkbox
    // Vice versa, if the notification is not already selected
    if (this.selectedNotifications.includes(id)) {
      this.selectedNotifications = this.selectedNotifications.filter(
        (selectedId) => selectedId !== id
      );
    } else {
      this.selectedNotifications.push(id);
    }

    // checks, if every checkbox is selected to visualize that with the top checkbox (where ...
    // you can select/ deselect every checkbox)
    this.allNotificationsSelected = this.dateSortedNotifications.every(
      (day) => {
        return day.notifications.every((notification) => {
          return this.selectedNotifications.includes(notification.id);
        });
      }
    );
  }
}
