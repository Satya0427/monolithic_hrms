import {Type, TemplateRef} from '@angular/core';

export interface DialogAction {
  label: string;
  value?: any;
  color?: 'primary' | 'accent' | 'warn' | undefined;
  disabled?: boolean;
}

export interface DialogConfig<T = any, R = any> {
  title?: string;
  data?: T;                           // data passed to content component
  width?: string;                     // e.g. '600px'
  height?: string;
  maxWidth?: string;                  // default: '80vw'
  disableClose?: boolean;
  showCloseIcon?: boolean;            // top-right X
  actions?: DialogAction[];           // buttons footer
  contentTemplate?: TemplateRef<any>;// prefer TemplateRef OR contentComponent
  contentComponent?: Type<any>;       // component to render inside dialog
  panelClass?: string;
  ariaLabel?: string;
}