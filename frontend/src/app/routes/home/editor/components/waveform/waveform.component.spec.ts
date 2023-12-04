import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { WaveformComponent } from './waveform.component';
import { WaveformService } from './waveform.service';

describe('WaveformComponent', () => {
  let component: WaveformComponent;
  let fixture: ComponentFixture<WaveformComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [WaveformComponent],
    providers: [provideMockStore(), WaveformService],
}).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WaveformComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
