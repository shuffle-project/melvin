import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatMenuModule } from '@angular/material/menu';
import { ReactiveComponentModule } from '@ngrx/component';
import { provideMockStore } from '@ngrx/store/testing';
import { CaptionsComponent } from './captions.component';

describe('CaptionsComponent', () => {
  let component: CaptionsComponent;
  let fixture: ComponentFixture<CaptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatMenuModule, ReactiveComponentModule],
      declarations: [CaptionsComponent],
      providers: [provideMockStore()],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CaptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
