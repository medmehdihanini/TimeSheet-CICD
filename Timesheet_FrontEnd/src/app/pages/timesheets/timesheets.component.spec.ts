import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimesheetsComponent } from './timesheets.component';

describe('TimesheetsComponent', () => {
  let component: TimesheetsComponent;
  let fixture: ComponentFixture<TimesheetsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TimesheetsComponent]
    });
    fixture = TestBed.createComponent(TimesheetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
