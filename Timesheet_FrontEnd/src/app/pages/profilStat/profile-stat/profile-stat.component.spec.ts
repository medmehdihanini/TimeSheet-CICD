import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileStatComponent } from './profile-stat.component';

describe('ProfileStatComponent', () => {
  let component: ProfileStatComponent;
  let fixture: ComponentFixture<ProfileStatComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ProfileStatComponent]
    });
    fixture = TestBed.createComponent(ProfileStatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
