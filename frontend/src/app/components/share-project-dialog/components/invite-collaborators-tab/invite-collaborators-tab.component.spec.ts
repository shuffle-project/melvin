import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InviteCollaboratorsTabComponent } from './invite-collaborators-tab.component';

describe('InviteCollaboratorsTabComponent', () => {
  let component: InviteCollaboratorsTabComponent;
  let fixture: ComponentFixture<InviteCollaboratorsTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InviteCollaboratorsTabComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InviteCollaboratorsTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
