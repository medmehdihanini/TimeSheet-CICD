import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddUpdateprogramComponent } from './add-updateprogram.component';

describe('AddUpdateprogramComponent', () => {
  let component: AddUpdateprogramComponent;
  let fixture: ComponentFixture<AddUpdateprogramComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AddUpdateprogramComponent]
    });
    fixture = TestBed.createComponent(AddUpdateprogramComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
