import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharePlayerTabComponent } from './share-player-tab.component';

describe('SharePlayerTabComponent', () => {
  let component: SharePlayerTabComponent;
  let fixture: ComponentFixture<SharePlayerTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharePlayerTabComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SharePlayerTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
