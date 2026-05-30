import { Component, inject, OnInit } from '@angular/core';
import { LoaderService } from '../../../core/services/loader.service';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-loader',
  imports: [AsyncPipe],
  templateUrl: './loader.html',
  styleUrl: './loader.css',
})
export class Loader implements OnInit {
  private loaderService = inject(LoaderService);
  loading$ = this.loaderService.loading$;

  ngOnInit() {
  }
}
