import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModifyProfileModalComponent } from './modify-profile-modal.component';

describe('ModifyProfileModalComponent', () => {
  let component: ModifyProfileModalComponent;
  let fixture: ComponentFixture<ModifyProfileModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ModifyProfileModalComponent]
    });
    fixture = TestBed.createComponent(ModifyProfileModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
