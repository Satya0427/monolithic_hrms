import {
  AfterViewInit,
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output
} from '@angular/core';


export interface PaginationResponse<T> {
  data: T[];
  pageIndex: number;
  pageSize: number;
  hasMore: boolean;
}


@Directive({
  selector: '[appInfiniteScroll]'
})
export class InfiniteScrollDirective {

  @Input() disabled = false;
  @Input() threshold: number = 0.1;
  @Output() loadMore = new EventEmitter<void>();
  
  private observer!: IntersectionObserver;
  constructor(private el: ElementRef) { }

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !this.disabled) {
          this.loadMore.emit();
        }
      },
      { threshold: this.threshold }
    );

    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

}
