import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgramProfileTasksComponent } from './program-profile-tasks.component';

describe('ProgramProfileTasksComponent', () => {
  let component: ProgramProfileTasksComponent;
  let fixture: ComponentFixture<ProgramProfileTasksComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ProgramProfileTasksComponent]
    });
    fixture = TestBed.createComponent(ProgramProfileTasksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
