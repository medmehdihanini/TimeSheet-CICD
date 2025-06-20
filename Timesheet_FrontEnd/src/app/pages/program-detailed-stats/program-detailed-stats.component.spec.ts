import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgramDetailedStatsComponent } from './program-detailed-stats.component';

describe('ProgramDetailedStatsComponent', () => {
  let component: ProgramDetailedStatsComponent;
  let fixture: ComponentFixture<ProgramDetailedStatsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ProgramDetailedStatsComponent]
    });
    fixture = TestBed.createComponent(ProgramDetailedStatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
