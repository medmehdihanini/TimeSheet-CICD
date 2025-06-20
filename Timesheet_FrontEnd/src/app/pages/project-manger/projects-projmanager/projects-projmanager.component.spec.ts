import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectsProjmanagerComponent } from './projects-projmanager.component';

describe('ProjectsProjmanagerComponent', () => {
  let component: ProjectsProjmanagerComponent;
  let fixture: ComponentFixture<ProjectsProjmanagerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ProjectsProjmanagerComponent]
    });
    fixture = TestBed.createComponent(ProjectsProjmanagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
