import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Categorie, ActiviteDictionnaire } from '../../../models/Categorie';

@Component({
  selector: 'app-activity-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.isCategory ? (data.editMode ? 'Modifier une catégorie' : 'Ajouter une catégorie') : (data.editMode ? 'Modifier une activité' : 'Ajouter une activité') }}</h2>

    <mat-dialog-content>
      <form [formGroup]="form">
        <div *ngIf="data.isCategory">
          <mat-form-field appearance="fill" class="full-width">
            <mat-label>Nom de la catégorie</mat-label>
            <input matInput formControlName="name" placeholder="Nom de la catégorie">
            <mat-error *ngIf="form.get('name')?.hasError('required')">Le nom est requis</mat-error>
          </mat-form-field>
        </div>

        <div *ngIf="!data.isCategory">
          <mat-form-field appearance="fill" class="full-width" *ngIf="!data.editMode">
            <mat-label>Catégorie</mat-label>
            <mat-select formControlName="categoryId">
              <mat-option *ngFor="let category of data.categories" [value]="category.id">
                {{ category.name }}
              </mat-option>
            </mat-select>
            <mat-error *ngIf="form.get('categoryId')?.hasError('required')">La catégorie est requise</mat-error>
          </mat-form-field>

          <mat-form-field appearance="fill" class="full-width">
            <mat-label>Description</mat-label>
            <textarea matInput formControlName="description" rows="3" placeholder="Description de l'activité"></textarea>
            <mat-error *ngIf="form.get('description')?.hasError('required')">La description est requise</mat-error>
          </mat-form-field>
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Annuler</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid">
        {{ data.editMode ? 'Modifier' : 'Ajouter' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width {
      width: 100%;
    }
  `]
})
export class ActivityDialogComponent implements OnInit {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ActivityDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      isCategory: boolean;
      editMode: boolean;
      categories?: Categorie[];
      item?: Categorie | ActiviteDictionnaire;
    }
  ) {}

  ngOnInit(): void {
    if (this.data.isCategory) {
      this.form = this.fb.group({
        name: [this.data.editMode && this.data.item ? (this.data.item as Categorie).name : '', Validators.required]
      });
    } else {
      this.form = this.fb.group({
        description: [this.data.editMode && this.data.item ? (this.data.item as ActiviteDictionnaire).description : '', Validators.required],
        categoryId: [
          this.data.editMode && this.data.item && (this.data.item as ActiviteDictionnaire).categorie
            ? (this.data.item as ActiviteDictionnaire).categorie!.id
            : '',
          Validators.required
        ]
      });
    }
  }

  save(): void {
    if (this.form.valid) {
      this.dialogRef.close({
        ...this.form.value,
        id: this.data.editMode && this.data.item ? this.data.item.id : undefined
      });
    }
  }
}
