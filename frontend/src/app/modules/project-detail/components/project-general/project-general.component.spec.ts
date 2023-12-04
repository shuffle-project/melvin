import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectGeneralComponent } from './project-general.component';

describe('ProjectGeneralComponent', () => {
  let component: ProjectGeneralComponent;
  let fixture: ComponentFixture<ProjectGeneralComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [ProjectGeneralComponent]
})
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectGeneralComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
