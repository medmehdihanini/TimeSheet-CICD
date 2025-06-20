import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgaramBillComponent } from './program-bill.component';

describe('ProgaramBillComponent', () => {
  let component: ProgaramBillComponent;
  let fixture: ComponentFixture<ProgaramBillComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ProgaramBillComponent]
    });
    fixture = TestBed.createComponent(ProgaramBillComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
