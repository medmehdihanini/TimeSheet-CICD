import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddProjectModalComponent } from './add-project-modal.component';

describe('AddProjectModalComponent', () => {
  let component: AddProjectModalComponent;
  let fixture: ComponentFixture<AddProjectModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AddProjectModalComponent]
    });
    fixture = TestBed.createComponent(AddProjectModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
