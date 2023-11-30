import { Component, Input, OnInit } from '@angular/core';
import dayjs from 'dayjs';
import { ApiService } from '../../../../services/api/api.service';
import { ActivityEntity } from '../../../../services/api/entities/activity.entity';
import { ActivityComponent } from '../../../../components/activity/activity.component';


interface GroupedActivities {
  date: string;
  activities: ActivityEntity[];
}

@Component({
    selector: 'app-project-activity',
    templateUrl: './project-activity.component.html',
    styleUrls: ['./project-activity.component.scss'],
    standalone: true,
    imports: [
    ActivityComponent
],
})
export class ProjectActivityComponent implements OnInit {
  @Input() projectId!: string;

  public blocks: GroupedActivities[] = [];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.findAllActivities(this.projectId).subscribe((result) => {
      let previousDate: dayjs.Dayjs | null = null;

      for (const activity of result.activities) {
        const date = dayjs(activity.createdAt);

        if (!previousDate || !previousDate.isSame(date, 'day')) {
          this.blocks.push({
            date: date.format('DD.MM.YYYY'),
            activities: [],
          });
        }

        previousDate = date;

        this.blocks[this.blocks.length - 1].activities.push(activity);
      }
    });
  }
}
