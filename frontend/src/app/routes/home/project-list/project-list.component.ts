import { LiveAnnouncer } from '@angular/cdk/a11y';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatButtonToggleGroup, MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatSort, Sort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import {
  ProjectFilter,
  ProjectSetEnum,
} from 'src/app/interfaces/project-filter.interface';
import { AppState } from 'src/app/store/app.state';
import { ShareProjectDialogComponent } from '../../../components/share-project-dialog/share-project-dialog.component';
import {
  ProjectDetailComponent,
  ProjectDetailDialogData,
  ProjectDetailDialogTab,
} from '../../../modules/project-detail/project-detail.component';
import {
  ProjectEntity,
  ProjectStatus,
} from '../../../services/api/entities/project.entity';
import * as projectsActions from '../../../store/actions/projects.actions';
import * as authSelectors from '../../../store/selectors/auth.selector';
import * as projectsSelectors from '../../../store/selectors/projects.selector';
import { DialogCreateProjectComponent } from './dialog-create-project/dialog-create-project.component';
import { FeatureEnabledPipe } from '../../../pipes/feature-enabled-pipe/feature-enabled.pipe';
import { ProjectStatusPipe } from '../../../pipes/project-status-pipe/project-status.pipe';
import { LanguageCodePipe } from '../../../pipes/language-code-pipe/language-code.pipe';
import { DurationPipe } from '../../../pipes/duration-pipe/duration.pipe';
import { FormatDatePipe } from '../../../pipes/format-date-pipe/format-date.pipe';
import { FooterComponent } from '../../../components/footer/footer.component';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { AvatarGroupComponent } from '../../../components/avatar-group/avatar-group.component';
import { MatChipsModule } from '@angular/material/chips';
import { MatOptionModule } from '@angular/material/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { LetDirective, PushPipe } from '@ngrx/component';
import { HeaderComponent } from '../../../components/header/header.component';

@Component({
    selector: 'app-project-list',
    templateUrl: './project-list.component.html',
    styleUrls: ['./project-list.component.scss'],
    standalone: true,
    imports: [
        HeaderComponent,
        LetDirective,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatTooltipModule,
        MatIconModule,
        MatButtonToggleModule,
        MatSelectModule,
        NgFor,
        MatOptionModule,
        NgIf,
        MatTableModule,
        MatSortModule,
        MatChipsModule,
        NgClass,
        AvatarGroupComponent,
        MatMenuModule,
        MatDividerModule,
        FooterComponent,
        PushPipe,
        FormatDatePipe,
        DurationPipe,
        LanguageCodePipe,
        ProjectStatusPipe,
        FeatureEnabledPipe,
    ],
})
export class ProjectListComponent implements OnInit, AfterViewInit, OnDestroy {
  ProjectSetEnum = ProjectSetEnum;

  public displayedColumns: string[] = [
    'title',
    'language',
    'status',
    'duration',
    'updatedAt',
    'createdAt',
    'members',
    'more',
  ];

  // Table data
  public filteredProjects$: Observable<ProjectEntity[]>;
  public projectsSubscription!: Subscription;

  // Table filter
  public projectFilter$: Observable<ProjectFilter>;
  public currentProjectCount!: number;

  public projectStatus = [
    'all',
    ProjectStatus.WAITING,
    ProjectStatus.PROCESSING,
    ProjectStatus.DRAFT,
    ProjectStatus.LIVE,
    ProjectStatus.FINISHED,
  ];

  // User filter changes
  @ViewChild('searchTitle') searchedTitle!: ElementRef;
  @ViewChild('projectSetGroup') selectedProjectSet!: MatButtonToggleGroup;
  @ViewChild('projectStatusSelect') selectedProjectStatus!: MatSelect;

  // Table sort
  @ViewChild(MatSort) sort!: MatSort;
  public tableDataSource = new MatTableDataSource<ProjectEntity>();

  public userId$: Observable<string | null>;

  constructor(
    private _liveAnnouncer: LiveAnnouncer,
    private store: Store<AppState>,
    private dialog: MatDialog,
    private router: Router
  ) {
    this.projectFilter$ = this.store.select(
      projectsSelectors.selectProjectFilter
    );
    this.filteredProjects$ = this.store.select(
      projectsSelectors.selectFilteredProjects
    );
    this.userId$ = this.store.select(authSelectors.selectUserId);
  }

  ngOnInit(): void {
    this.store.dispatch(projectsActions.findAll());
    this.projectsSubscription = this.filteredProjects$.subscribe((projects) => {
      this.tableDataSource.data = projects;
      this.currentProjectCount = projects.length;
    });
  }

  ngAfterViewInit() {
    this.tableDataSource.sort = this.sort;
  }

  filterProjects() {
    this.store.dispatch(
      projectsActions.updateFilter({
        updateProjectFilter: {
          searchString: this.searchedTitle.nativeElement.value.trim(),
          selectedProjectSet: this.selectedProjectSet.value,
          selectedProjectStatus: this.selectedProjectStatus.value,
        },
      })
    );
  }

  getProjectLanguages(project: ProjectEntity) {
    //SET will filter duplicates
    return [
      ...new Set(project.transcriptions.map((transc) => transc.language)),
    ];
  }

  onClickTitle(project: ProjectEntity) {
    if (this.isClickable(project)) {
      this.router.navigate(['/home/editor', project.id]);
    }
  }

  onClickProjectDetail(project: ProjectEntity, tab: ProjectDetailDialogTab) {
    const data: ProjectDetailDialogData = {
      projectId: project.id,
      tab,
    };
    this.dialog.open(ProjectDetailComponent, {
      data,
      width: '70%',
      height: '70vh',
    });
  }

  onOpenDialogCreateProject() {
    this.dialog.open(DialogCreateProjectComponent, { disableClose: true });
  }

  onDeleteProject(projectId: string) {
    this.store.dispatch(projectsActions.remove({ removeProjectId: projectId }));
  }

  ngOnDestroy(): void {
    this.projectsSubscription.unsubscribe();
  }

  /** Announce the change in sort state for assistive technology. */
  announceSortChange(sortState: Sort) {
    // This example uses English messages. If your application supports
    // multiple language, you would internationalize these strings.
    // Furthermore, you can customize the message to add additional
    // details about the values being sorted.
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }

  onClickShare(project: ProjectEntity) {
    this.dialog.open(ShareProjectDialogComponent, {
      data: {
        project,
      },
    });
  }

  onOpenViewer(project: ProjectEntity) {
    this.router.navigate(['/home/viewer', project.id]);
  }

  onGetCorrectIcon(status: string) {
    switch (status) {
      case ProjectStatus.FINISHED:
        return 'check-all';
      case ProjectStatus.DRAFT:
        return 'edit';
      case ProjectStatus.LIVE:
        return 'record';
      case ProjectStatus.WAITING:
        return 'pause';
      case ProjectStatus.PROCESSING:
        return 'setting';
      case ProjectStatus.ERROR:
        return 'warning';
      default:
        return 'error';
    }
  }

  isClickable(project: ProjectEntity) {
    return [
      ProjectStatus.DRAFT,
      ProjectStatus.FINISHED,
      ProjectStatus.LIVE,
    ].includes(project.status);
  }
}
