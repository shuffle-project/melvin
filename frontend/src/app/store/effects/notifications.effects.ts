import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of, tap } from 'rxjs';
import { ApiService } from 'src/app/services/api/api.service';
import { NotificationListEntity } from 'src/app/services/api/entities/notification-list.entity';
import { NotificationEntity } from 'src/app/services/api/entities/notification.entity';
import { AlertService } from '../../services/alert/alert.service';
import * as notificationsActions from '../actions/notifications.actions';

@Injectable({
  providedIn: 'root',
})
export class NotificationsEffects {
  constructor(
    private actions$: Actions,
    private api: ApiService,
    private alert: AlertService
  ) {}

  fetchNotifications$ = createEffect(() =>
    this.actions$.pipe(
      ofType(notificationsActions.findAll),
      mergeMap((action) =>
        this.api.findAllNotifications(action.userId).pipe(
          map((notificationList: NotificationListEntity) => {
            return notificationsActions.findAllSuccess({ notificationList });
          }),
          catchError((error) => {
            return of(notificationsActions.findAllFail({ error }));
          })
        )
      )
    )
  );

  prepareFetchRecentNotifications$ = createEffect(() =>
    this.actions$.pipe(
      ofType(notificationsActions.updateFromWS),
      map((action) => {
        return notificationsActions.findRecentFromEffect({
          userId: action.notifications[0].user,
          limit: 3,
        });
      })
    )
  );

  fetchRecentNotifications$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        notificationsActions.findRecent,
        notificationsActions.findRecentFromEffect
      ),
      mergeMap((action) =>
        this.api.findRecentNotifications(action.userId, action.limit).pipe(
          map((notificationList: NotificationListEntity) => {
            return notificationsActions.findRecentSuccess({ notificationList });
          }),

          catchError((error) => {
            return of(notificationsActions.findRecentFail({ error }));
          })
        )
      )
    )
  );

  updateNotification$ = createEffect(() =>
    this.actions$.pipe(
      ofType(notificationsActions.updateFromHeader),
      mergeMap((action) =>
        this.api.updateNotification(action.idToUpdate, action.updateDto).pipe(
          map((notification: NotificationEntity) => {
            return notificationsActions.updateSuccess({ notification });
          }),
          catchError((error) => {
            return of(notificationsActions.updateFail({ error }));
          })
        )
      )
    )
  );

  updateManyNotifications$ = createEffect(() =>
    this.actions$.pipe(
      ofType(notificationsActions.updateManyFromNotificationList),
      mergeMap((action) =>
        this.api.updateMayNotifications(action.updateManyNotificationsDto).pipe(
          map((notifications: NotificationEntity[]) => {
            return notificationsActions.updateManySuccess({ notifications });
          }),
          catchError((error) => {
            return of(notificationsActions.updateFail({ error }));
          })
        )
      )
    )
  );

  removeNotification$ = createEffect(() =>
    this.actions$.pipe(
      ofType(notificationsActions.remove),
      mergeMap((action) =>
        this.api.removeNotification(action.removeNotificationId).pipe(
          map(() => {
            return notificationsActions.removeSuccess({
              removedNotificationId: action.removeNotificationId,
            });
          }),
          catchError((error) => {
            return of(notificationsActions.removeFail(error));
          })
        )
      )
    )
  );

  bulkRemoveNotifications$ = createEffect(() =>
    this.actions$.pipe(
      ofType(notificationsActions.bulkRemove),
      mergeMap((action) =>
        this.api
          .bulkRemoveNotifications({
            notificationIds: action.removeNotificationIds,
          })
          .pipe(
            map(() => {
              return notificationsActions.bulkRemoveSuccess({
                removedNotificationIds: action.removeNotificationIds,
              });
            }),
            catchError((error) => {
              return of(notificationsActions.removeFail(error));
            })
          )
      )
    )
  );

  notifyOnError$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          notificationsActions.findAllFail,
          notificationsActions.removeFail,
          notificationsActions.updateFail
        ),
        tap((action) =>
          this.alert.error(action.error.error?.message || action.error.message)
        )
      ),
    { dispatch: false }
  );
}
