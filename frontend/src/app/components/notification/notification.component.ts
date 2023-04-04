import { Component, Input } from '@angular/core';
import { NotificationEntity } from '../../services/api/entities/notification.entity';
import { ActivityViewType } from '../activity/activity.component';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss'],
})
export class NotificationComponent {
  @Input() notification!: NotificationEntity;
  @Input() viewType: ActivityViewType = 'list';

  constructor() {}
}
