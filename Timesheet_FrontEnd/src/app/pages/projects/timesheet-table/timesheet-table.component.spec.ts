import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimesheetTableComponent } from './timesheet-table.component';

describe('TimesheetTableComponent', () => {
  let component: TimesheetTableComponent;
  let fixture: ComponentFixture<TimesheetTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TimesheetTableComponent]
    });
    fixture = TestBed.createComponent(TimesheetTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
