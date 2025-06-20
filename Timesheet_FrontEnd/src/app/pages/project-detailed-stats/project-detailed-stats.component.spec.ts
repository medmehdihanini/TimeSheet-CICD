import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectDetailedStatsComponent } from './project-detailed-stats.component';

describe('ProjectDetailedStatsComponent', () => {
  let component: ProjectDetailedStatsComponent;
  let fixture: ComponentFixture<ProjectDetailedStatsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ProjectDetailedStatsComponent]
    });
    fixture = TestBed.createComponent(ProjectDetailedStatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
