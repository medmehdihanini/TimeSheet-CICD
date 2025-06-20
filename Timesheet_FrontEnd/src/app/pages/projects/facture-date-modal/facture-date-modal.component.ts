import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-facture-date-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './facture-date-modal.component.html',
  styleUrls: ['./facture-date-modal.component.css']
})
export class FactureDateModalComponent implements OnInit {
  selectionForm: FormGroup;

  months = [
    { value: 1, name: 'Janvier' },
    { value: 2, name: 'Février' },
    { value: 3, name: 'Mars' },
    { value: 4, name: 'Avril' },
    { value: 5, name: 'Mai' },
    { value: 6, name: 'Juin' },
    { value: 7, name: 'Juillet' },
    { value: 8, name: 'Août' },
    { value: 9, name: 'Septembre' },
    { value: 10, name: 'Octobre' },
    { value: 11, name: 'Novembre' },
    { value: 12, name: 'Décembre' }
  ];

  years: number[] = [];
  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth() + 1;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<FactureDateModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { projectName: string }
  ) {
    this.selectionForm = this.fb.group({
      month: [this.currentMonth, [Validators.required]],
      year: [this.currentYear, [Validators.required]]
    });
  }

  ngOnInit(): void {
    // Generate years from 2020 to current year + 2
    for (let year = 2020; year <= this.currentYear + 2; year++) {
      this.years.push(year);
    }
  }

  onSubmit(): void {
    if (this.selectionForm.valid) {
      const formValue = this.selectionForm.value;
      this.dialogRef.close({
        month: formValue.month,
        year: formValue.year
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
