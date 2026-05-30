import { ChangeDetectionStrategy, Component, inject, TemplateRef, Type } from '@angular/core';
import { MATERIAL } from '../../material/materials';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DialogAction, DialogConfig } from '../../../core/models/dialog.model';



@Component({
  selector: 'app-generic-dialog',
  imports: [
    MATERIAL,
    CommonModule,
  ],
  templateUrl: './generic-dialog.html',
  styleUrl: './generic-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GenericDialog {
  config = inject(MAT_DIALOG_DATA) as DialogConfig;
  dialogRef = inject(MatDialogRef<GenericDialog>);

  // child injector for component outlet if needed
  childInjector = this.dialogRef.componentInstance ? undefined : undefined;

  ngOnInit(): void {
    // If you need to set up something before content renders
  }

  close(result?: any) {
    this.dialogRef.close(result);
  }

  actionClick(a: DialogAction) {
    this.dialogRef.close(a.value ?? true);
  }
}
