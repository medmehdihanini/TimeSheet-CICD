import { Injectable } from '@angular/core';
import { default as Swal } from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private customTheme = {
    background: '#1a1a1a',
    text: '#ffffff',
    confirmButton: '#ffe600',
    cancelButton: '#666666',
    border: 'rgba(255, 255, 255, 0.1)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
  };

  constructor() {
    // Set default configuration
    Swal.mixin({
      toast: true,
      position: 'bottom-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      customClass: {
        popup: 'custom-swal-popup',
        title: 'custom-swal-title',
        confirmButton: 'custom-swal-confirm-button',
        cancelButton: 'custom-swal-cancel-button',
        actions: 'custom-swal-actions'
      },
      buttonsStyling: false,
      background: this.customTheme.background,
      color: this.customTheme.text
    });
  }

  success(title: string, text: string = '') {
    return Swal.fire({
      title,
      text,
      icon: 'success',
      toast: true,
      position: 'bottom-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true
    });
  }

  error(title: string, text: string = '') {
    return Swal.fire({
      title,
      text,
      icon: 'error',
      toast: true,
      position: 'bottom-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true
    });
  }

  warning(title: string, text: string = '') {
    return Swal.fire({
      title,
      text,
      icon: 'warning',
      toast: true,
      position: 'bottom-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true
    });
  }

  confirm(title: string, text: string = '') {
    return Swal.fire({
      title,
      text,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Confirmer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: this.customTheme.confirmButton,
      cancelButtonColor: this.customTheme.cancelButton,
      background: this.customTheme.background,
      color: this.customTheme.text,
      toast: false,
      position: 'center'
    });
  }

  custom(options: any) {
    return Swal.fire({
      ...options,
      background: this.customTheme.background,
      color: this.customTheme.text,
      confirmButtonColor: this.customTheme.confirmButton,
      cancelButtonColor: this.customTheme.cancelButton
    });
  }
}
