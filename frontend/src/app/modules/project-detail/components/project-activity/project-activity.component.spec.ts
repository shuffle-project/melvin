import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectActivityComponent } from './project-activity.component';

describe('ProjectActivityComponent', () => {
  let component: ProjectActivityComponent;
  let fixture: ComponentFixture<ProjectActivityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProjectActivityComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectActivityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
