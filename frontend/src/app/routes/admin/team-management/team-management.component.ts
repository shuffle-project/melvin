import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { PushPipe } from '@ngrx/component';
import { Store } from '@ngrx/store';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';
import { DeleteConfirmationService } from 'src/app/components/delete-confirmation-dialog/delete-confirmation.service';
import { DurationPipe } from 'src/app/pipes/duration-pipe/duration.pipe';
import { FileSizePipe } from 'src/app/pipes/file-size-pipe/file-size.pipe';
import { AlertService } from 'src/app/services/alert/alert.service';
import { ApiService } from 'src/app/services/api/api.service';
import { TeamEntity } from 'src/app/services/api/entities/team.entity';
import { ConfigService } from 'src/app/services/config/config.service';
import { adminFindAllTeams } from 'src/app/store/actions/admin.actions';
import { AppState } from 'src/app/store/app.state';
import * as adminSelector from 'src/app/store/selectors/admin.selector';
import { LandingFooterComponent } from '../../landing/components/landing-footer/landing-footer.component';
import { LandingHeaderComponent } from '../../landing/components/landing-header/landing-header.component';
import { DialogAdminCreateTeamComponent } from './components/dialog-admin-create-team/dialog-admin-create-team.component';
import { DialogAdminEditTeamComponent } from './components/dialog-admin-edit-team/dialog-admin-edit-team.component';

@Component({
  selector: 'app-team-management',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    LandingFooterComponent,
    RouterLink,
    PushPipe,
    ReactiveFormsModule,
    MatTableModule,
    FileSizePipe,
    MatIconModule,
    LandingHeaderComponent,
    MatMenuModule,
    MatSortModule,
    DurationPipe,
  ],
  templateUrl: './team-management.component.html',
  styleUrl: './team-management.component.scss',
})
export class TeamManagementComponent implements OnInit, AfterViewInit {
  allTeams$ = this.store.select(adminSelector.selectAllTeams);

  private destroy$$ = new Subject<void>();

  displayedColumns: string[] = ['name', 'size', 'sizelimit', 'more'];

  dataSource: MatTableDataSource<TeamEntity> = new MatTableDataSource();
  @ViewChild(MatSort) sort!: MatSort;

  filteredTeamsCount = 0;
  filterControl = new FormControl('');

  constructor(
    private store: Store<AppState>,
    private configService: ConfigService,
    private deleteService: DeleteConfirmationService,
    private dialog: MatDialog,
    private api: ApiService,
    private alert: AlertService
  ) {}

  ngOnInit(): void {
    this.allTeams$.pipe(takeUntil(this.destroy$$)).subscribe((allTeams) => {
      console.log(allTeams);
      const teams = allTeams?.teams ?? [];
      this.dataSource = new MatTableDataSource([...teams]);
      this.dataSource.sort = this.sort;

      this.filterControl.reset();
      this.filteredTeamsCount = this.dataSource.filteredData.length;
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

  // onVerifyUserEmail(user: UserEntityForAdmin) {
  //   this.store.dispatch(adminVerifyUserEmail({ userId: user.id }));
  // }

  onApplyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    this.filteredTeamsCount = this.dataSource.filteredData.length;
  }

  onOpenCreateTeamDialog() {
    console.log('Open Create Team Dialog');

    this.dialog.open(DialogAdminCreateTeamComponent, {
      disableClose: true,
      width: '100%',
      maxWidth: '40rem',
      maxHeight: '90vh',
    });
  }

  onOpenDialogEditTeam(team: TeamEntity) {
    console.log('Open Edit Team Dialog', team);
    this.dialog.open(DialogAdminEditTeamComponent, {
      disableClose: true,
      width: '100%',
      maxWidth: '40rem',
      maxHeight: '90vh',
      data: { team },
    });
  }

  async onDeleteTeam(team: TeamEntity) {
    const isConfirmed = await this.deleteService.adminDeleteTeam(team.name);

    if (isConfirmed) {
      try {
        await firstValueFrom(this.api.adminRemoveTeam(team.id));
        this.store.dispatch(adminFindAllTeams());
      } catch (err) {
        this.alert.error((err as HttpErrorResponse).message);
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$$.next();
  }
}
