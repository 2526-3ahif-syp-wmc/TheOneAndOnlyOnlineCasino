import { Injectable, signal } from '@angular/core';

type AlertType = 'success' | 'error' | 'info';

type AppAlert = {
  message: string;
  type: AlertType;
};

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private alertSignal = signal<AppAlert | null>(null);

  public alert = this.alertSignal.asReadonly();

  private timeoutId?: number;

  public show(message: string, type: AlertType = 'info') {
    this.alertSignal.set({ message, type });

    clearTimeout(this.timeoutId);

    this.timeoutId = window.setTimeout(() => {
      this.clear();
    }, 3000);
  }

  public success(message: string) {
    this.show(message, 'success');
  }

  public error(message: string) {
    this.show(message, 'error');
  }

  public info(message: string) {
    this.show(message, 'info');
  }

  public clear() {
    this.alertSignal.set(null);
  }
}