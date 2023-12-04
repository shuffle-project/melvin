import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JoinLivestreamModalComponent } from './join-livestream-modal.component';

describe('JoinLivestreamModalComponent', () => {
  let component: JoinLivestreamModalComponent;
  let fixture: ComponentFixture<JoinLivestreamModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [JoinLivestreamModalComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(JoinLivestreamModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
