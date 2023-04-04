export interface UpdateNotificationDto {
  read: boolean;
}

export interface UpdateNotificationDtoWithId extends UpdateNotificationDto {
  id: string;
}

export interface UpdateManyNotificationsDto {
  notifications: UpdateNotificationDtoWithId[];
}
