import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatusModalComponent } from './status-modal.component';

describe('StatusModalComponent', () => {
  let component: StatusModalComponent;
  let fixture: ComponentFixture<StatusModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [StatusModalComponent]
    });
    fixture = TestBed.createComponent(StatusModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
