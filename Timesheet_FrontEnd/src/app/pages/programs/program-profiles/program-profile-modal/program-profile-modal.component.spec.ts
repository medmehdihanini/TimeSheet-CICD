import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgramProfileModalComponent } from './program-profile-modal.component';

describe('ProgramProfileModalComponent', () => {
  let component: ProgramProfileModalComponent;
  let fixture: ComponentFixture<ProgramProfileModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ProgramProfileModalComponent]
    });
    fixture = TestBed.createComponent(ProgramProfileModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
