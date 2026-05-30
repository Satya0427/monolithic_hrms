import { CanDeactivateFn } from '@angular/router';
export interface CanComponentDeactivate {
  canDeactivate: () => boolean | Promise<boolean>;
}

export const pendingChangesGuard: CanDeactivateFn<CanComponentDeactivate> = (component, currentRoute, currentState, nextState) => {
   if (component && typeof component.canDeactivate === 'function') {
    return component.canDeactivate();
  }
  return false;
};
