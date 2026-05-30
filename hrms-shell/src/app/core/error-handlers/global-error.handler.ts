import { Injectable, NgZone } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { LoaderService } from '../services/loader.service';

@Injectable({
  providedIn: 'root',
})
export class GlobalErrorHandler {
  constructor(
    private zone: NgZone,
    private toastr: ToastrService,
    private loader: LoaderService
  ) { }

  handleError(error: any): void {
    console.group('🔥 Global Error');
    console.error('Message:',error);
    console.groupEnd();
    this.loader.hide();
    // this.zone.run(() => {
    //   // this.toastr.error
    // });
  }
}
