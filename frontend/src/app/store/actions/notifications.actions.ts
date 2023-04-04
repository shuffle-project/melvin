import { HttpErrorResponse } from '@angular/common/http';
import { createAction, props } from '@ngrx/store';
import {
  UpdateManyNotificationsDto,
  UpdateNotificationDto,
} from 'src/app/services/api/dto/update-notification.dto';
import { NotificationListEntity } from 'src/app/services/api/entities/notification-list.entity';
import { NotificationEntity } from 'src/app/services/api/entities/notification.entity';

export const createFromWS = createAction(
  '[NOTIFICATION WS] Create notification from ws',
  props<{ notification: NotificationEntity }>()
);

export const findAll = createAction(
  '[NOTIFICATION LIST COMPONENT] Find all notifications',
  props<{ userId: string }>()
);

export const findAllSuccess = createAction(
  '[NOTIFICATION API] Find all notifications success',
  props<{ notificationList: NotificationListEntity }>()
);

export const findAllFail = createAction(
  '[NOTIFICATION API] Find all notifications fail',
  props<{ error: HttpErrorResponse }>()
);

export const findRecent = createAction(
  '[HEADER COMPONENT] Find recent notifications',
  props<{ userId: string; limit: number }>()
);

export const findRecentFromEffect = createAction(
  '[NOTIFICATION API] Find recent notifications from effect',
  props<{ userId: string; limit: number }>()
);

export const findRecentSuccess = createAction(
  '[NOTIFICATION API] Find recent notifications success',
  props<{ notificationList: NotificationListEntity }>()
);

export const findRecentFail = createAction(
  '[NOTIFICATION API] Find recent notifications fail',
  props<{ error: HttpErrorResponse }>()
);

export const updateManyFromNotificationList = createAction(
  '[NOTIFICATION LIST COMPONENT] Update many notifications',
  props<{
    updateManyNotificationsDto: UpdateManyNotificationsDto;
  }>()
);

export const updateFromHeader = createAction(
  '[NOTIFICATION HEADER COMPONENT] Update notification',
  props<{ idToUpdate: string; updateDto: UpdateNotificationDto }>()
);

export const updateSuccess = createAction(
  '[NOTIFICATION API] Update notification success',
  props<{ notification: NotificationEntity }>()
);

export const updateManySuccess = createAction(
  '[NOTIFICATION API] Update many notifications success',
  props<{ notifications: NotificationEntity[] }>()
);

export const updateFail = createAction(
  '[NOTIFICATION API] Update notification fail',
  props<{ error: HttpErrorResponse }>()
);

export const updateFromWS = createAction(
  '[NOTIFICATION WS] Update notification from ws',
  props<{ notifications: NotificationEntity[] }>()
);

export const remove = createAction(
  '[NOTIFICATION LIST COMPONENT] Remove notification',
  props<{ removeNotificationId: string }>()
);

export const bulkRemove = createAction(
  '[NOTIFICATION LIST COMPONENT] Remove many notification',
  props<{ removeNotificationIds: string[] }>()
);

export const removeSuccess = createAction(
  '[NOTIFICATION API] Remove notification success',
  props<{ removedNotificationId: string }>()
);

export const bulkRemoveSuccess = createAction(
  '[NOTIFICATION API] Remove bulk notification success',
  props<{ removedNotificationIds: string[] }>()
);

export const removeFail = createAction(
  '[NOTIFICATION API] Remove notification fail',
  props<{ error: HttpErrorResponse }>()
);

export const removeFromWS = createAction(
  '[NOTIFICATION WS] Remove notifications from WS',
  props<{ removedNotificationIds: string[] }>()
);
