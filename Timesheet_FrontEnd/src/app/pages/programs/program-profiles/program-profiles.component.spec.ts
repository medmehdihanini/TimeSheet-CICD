import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgramProfilesComponent } from './program-profiles.component';

describe('ProgramProfilesComponent', () => {
  let component: ProgramProfilesComponent;
  let fixture: ComponentFixture<ProgramProfilesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ProgramProfilesComponent]
    });
    fixture = TestBed.createComponent(ProgramProfilesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
