import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProgramService } from 'src/app/services/programs/program.service';
import { ProjectService } from 'src/app/services/project/project.service';
import { UserserviceService } from 'src/app/services/user/userservice.service';
import { HttpClient } from '@angular/common/http';
import { MaterialModule } from 'src/app/MaterialModule';
import { AlertService } from 'src/app/services/alert.service';
import { ExcelParserService, TimesheetData } from 'src/app/services/excel/excel-parser.service';
import { TimesheetVerificationComponent } from './timesheet-verification/timesheet-verification.component';

@Component({
  selector: 'app-timesheet-upload',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    TimesheetVerificationComponent
  ],
  templateUrl: './timesheet-upload.component.html',
  styleUrls: ['./timesheet-upload.component.css']
})
export class TimesheetUploadComponent implements OnInit {
  @ViewChild('stepper') stepper!: MatStepper;

  // User information
  connectedUser: any;
  userRole: string = '';

  // Data collections
  programs: any[] = [];
  projects: any[] = [];
  profiles: any[] = [];

  // Selected values
  selectedProgram: any = null;
  selectedProject: any = null;
  selectedProfile: any = null;

  // File handling
  selectedFile: File | null = null;
  uploadSuccess: boolean = false;
  uploadError: string | null = null;
  isUploading: boolean = false;

  // Timesheet verification
  extractedTimesheetData: TimesheetData | null = null;
  showVerification: boolean = false;

  // Form groups for the stepper
  programFormGroup: FormGroup;
  projectFormGroup: FormGroup;
  profileFormGroup: FormGroup;
  uploadFormGroup: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private programService: ProgramService,
    private projectService: ProjectService,
    private userService: UserserviceService,
    private http: HttpClient,
    private alertService: AlertService,
    private excelParserService: ExcelParserService
  ) {
    this.programFormGroup = this.formBuilder.group({
      programCtrl: ['', Validators.required]
    });
    this.projectFormGroup = this.formBuilder.group({
      projectCtrl: ['', Validators.required]
    });
    this.profileFormGroup = this.formBuilder.group({
      profileCtrl: ['', Validators.required]
    });
    this.uploadFormGroup = this.formBuilder.group({
      fileCtrl: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadUserInfo();

    // Subscribe to program selection changes
    this.programFormGroup.get('programCtrl')?.valueChanges.subscribe(selectedProgram => {
      if (selectedProgram) {
        this.selectedProgram = selectedProgram;
        this.loadProjectsForProgram(selectedProgram);
      }
    });

    // Subscribe to project selection changes
    this.projectFormGroup.get('projectCtrl')?.valueChanges.subscribe(selectedProject => {
      if (selectedProject) {
        this.selectedProject = selectedProject;
        this.loadProfilesForProject(selectedProject);
      }
    });

    // Subscribe to profile selection changes
    this.profileFormGroup.get('profileCtrl')?.valueChanges.subscribe(selectedProfileId => {
      if (selectedProfileId) {
        // Find the profile using idp instead of idProfile
        this.selectedProfile = this.profiles.find(p => p.idp === selectedProfileId);
        console.log('Selected profile:', this.selectedProfile);
      }
    });
  }

  loadUserInfo(): void {
    this.connectedUser = this.userService.getUserConnected();
    if (this.connectedUser) {
      this.userRole = this.connectedUser.role;

      if (this.userRole === 'PROGRAM_MANAGER') {
        this.loadProgramManagerData();
      } else if (this.userRole === 'PROJECT_MANAGER') {
        this.loadProjectManagerData();
      }
    }
  }

  loadProgramManagerData(): void {
    this.programService.getProgramsWhereImChief(this.connectedUser.id)
      .subscribe({
        next: (data) => {
          this.programs = data;
        },
        error: (err) => {
          this.alertService.error('Error', 'Failed to load programs. Please try again later.');
        }
      });
  }

  loadProjectManagerData(): void {
    this.projectService.getProjectsForChief(this.connectedUser.id)
      .subscribe({
        next: (data) => {
          this.projects = data;
        },
        error: (err) => {
          this.alertService.error('Error', 'Failed to load projects. Please try again later.');
        }
      });
  }

  loadProjectsForProgram(program: any): void {
    // Check if program is actually a valid object
    if (!program) {
      this.alertService.error('Error', 'No program selected');
      return;
    }

    // Get the program ID, using idprog which is the correct field name
    let programId = program.idprog;

    if (!programId) {
      this.alertService.error('Error', 'Selected program has no valid ID');
      return;
    }

    this.projectService.getProjectsProgram(programId)
      .subscribe({
        next: (data) => {
          this.projects = data;

          // Reset project and profile selection
          this.selectedProject = null;
          this.selectedProfile = null;
          this.profiles = [];

          // Reset form controls
          this.projectFormGroup.get('projectCtrl')?.setValue(null);
          this.profileFormGroup.get('profileCtrl')?.setValue(null);
        },
        error: (err) => {
          this.alertService.error('Error', 'Failed to load projects for the selected program.');
        }
      });
  }

  loadProfilesForProject(project: any): void {
    // If project is an object, extract its ID
    const projectId = typeof project === 'object' ?
                      (project.idproject || project.id) :
                      project;

    if (!projectId) {
      this.alertService.error('Error', 'No valid project ID available');
      return;
    }

    this.projectService.getProjectProfiles(projectId)
      .subscribe({
        next: (data) => {
          // Transform the data, keeping the original idp property instead of mapping to idProfile
          this.profiles = data.map((item: any) => ({
            idp: item[0].idp,  // Keep the original property name
            firstName: item[0].firstname,
            lastName: item[0].lastname,
            image: item[0].image,
            function: item[4],
            dailyRate: item[5],
            mandayBudget: item[1],
            progress: item[2],
            id: item[3]
          }));

          // Reset profile selection
          this.selectedProfile = null;
          this.profileFormGroup.get('profileCtrl')?.setValue(null);
        },
        error: (err) => {
          this.alertService.error('Error', 'Failed to load profiles for the selected project.');
        }
      });
  }

  onFileSelect(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Check if the file is an Excel file
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        this.selectedFile = file;
        this.uploadFormGroup.get('fileCtrl')?.setValue(file.name);
      } else {
        this.uploadError = 'Please select an Excel file (.xlsx or .xls)';
        this.selectedFile = null;
        this.uploadFormGroup.get('fileCtrl')?.setValue('');
        this.alertService.warning('Invalid File', 'Please select an Excel file (.xlsx or .xls)');
      }
    }
  }

  parseTimesheet(): void {
    if (!this.selectedFile) {
      this.uploadError = 'Please select a file to upload';
      this.alertService.warning('Missing File', 'Please select a file to upload');
      return;
    }

    if (!this.selectedProject || !this.selectedProfile) {
      this.uploadError = 'Please select a project and profile';
      this.alertService.warning('Missing Selection', 'Please select a project and profile');
      return;
    }

    this.isUploading = true;
    this.uploadError = null;

    // Parse the Excel file to extract timesheet data
    this.excelParserService.parseTimesheet(this.selectedFile)
      .then(data => {
        this.isUploading = false;
        this.extractedTimesheetData = data;

        // Validate the extracted data
        const validationResult = this.excelParserService.validateTimesheetData(data);

        if (!validationResult.isValid) {
          // Show validation errors but still proceed to verification so user can fix them
          this.alertService.warning('Validation Issues',
            `Found ${validationResult.errors.length} issues with the timesheet. Please review and correct in the next step.`);
        }

        // Show the verification component
        this.showVerification = true;
      })
      .catch(error => {
        this.isUploading = false;
        this.uploadError = `Failed to parse timesheet: ${error}`;
        this.alertService.error('Parsing Failed', 'Failed to parse timesheet. Please check the file format.');
      });
  }

  uploadTimesheet(): void {
    // This method is now only called after verification
    if (!this.extractedTimesheetData) {
      this.alertService.error('Error', 'No timesheet data available to upload');
      return;
    }

    this.isUploading = true;
    this.uploadError = null;

    // Create form data for the file upload
    const formData = new FormData();
    formData.append('file', this.selectedFile!);
    formData.append('projectId', this.selectedProject.idproject);
    formData.append('profileId', this.selectedProfile.idProfile);

    // Add extracted data as JSON
    formData.append('timesheetData', JSON.stringify(this.extractedTimesheetData));

    // You'll need to implement this endpoint in your backend
    const uploadUrl = `http://localhost:8083/api/v1/timesheet/upload`;

    // This is a placeholder for the actual implementation
    // You would need to create this endpoint in your backend
    this.http.post(uploadUrl, formData).subscribe({
      next: (response) => {
        this.isUploading = false;
        this.uploadSuccess = true;
        this.uploadError = null;
        this.showVerification = false;
        this.alertService.success('Success', 'Timesheet uploaded successfully!');
      },
      error: (error) => {
        this.isUploading = false;
        this.uploadSuccess = false;
        this.uploadError = 'Failed to upload timesheet. Please try again.';
        this.alertService.error('Upload Failed', 'Failed to upload timesheet. Please try again.');
      }
    });
  }

  onVerificationConfirm(verifiedData: TimesheetData): void {
    this.extractedTimesheetData = verifiedData;
    this.uploadTimesheet();
  }

  onVerificationCancel(): void {
    this.showVerification = false;
    this.extractedTimesheetData = null;
  }

  resetForm(): void {
    // Reset selected values
    this.selectedProgram = null;
    this.selectedProject = null;
    this.selectedProfile = null;
    this.selectedFile = null;
    this.uploadSuccess = false;
    this.uploadError = null;
    this.showVerification = false;
    this.extractedTimesheetData = null;

    // Reset form controls
    this.programFormGroup.get('programCtrl')?.setValue('');
    this.projectFormGroup.get('projectCtrl')?.setValue('');
    this.profileFormGroup.get('profileCtrl')?.setValue('');
    this.uploadFormGroup.get('fileCtrl')?.setValue('');

    // If user is PROGRAM_MANAGER, reload programs
    if (this.userRole === 'PROGRAM_MANAGER') {
      this.loadProgramManagerData();
      this.projects = [];
      this.profiles = [];
    }
    // If user is PROJECT_MANAGER, reload projects
    else if (this.userRole === 'PROJECT_MANAGER') {
      this.loadProjectManagerData();
      this.profiles = [];
    }

    // Reset stepper to first step
    if (this.stepper) {
      this.stepper.reset();
    }

    this.alertService.success('Reset', 'Form has been reset successfully');
  }

  // Helper function to get the profile image URL
  getProfileImageUrl(profile: any): string {
    return profile && profile.image
      ? 'data:image/jpg;base64,' + profile.image
      : '/assets/imgholder.jpg';
  }
}
