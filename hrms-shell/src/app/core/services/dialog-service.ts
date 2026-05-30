import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { GenericDialog } from '../../shared/components/generic-dialog/generic-dialog';
import { DialogConfig } from '../models/dialog.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  private dialog = inject(MatDialog);

  open<T = any, R = any>(config: DialogConfig<T, R>): Observable<R | undefined> {
    const dialogRef = this.dialog.open(GenericDialog, {
      data: config,
      width: config.width ?? '600px',
      maxWidth: config.maxWidth ?? '80vw',
      panelClass: config.panelClass,
      disableClose: config.disableClose ?? false,
    });

    return dialogRef.afterClosed();
  }

  // convenience helpers
  confirm(message: string, title = 'Confirm') {
    return this.open({
      title,
      data: { message },
      actions: [
        { label: 'Cancel', value: false },
        { label: 'Confirm', value: true, color: 'primary' }
      ]
    });
  }
}
