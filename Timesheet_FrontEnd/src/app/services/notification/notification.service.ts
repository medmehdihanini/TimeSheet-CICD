import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Notification, NotificationStatus } from '../../models/Notification';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications = new BehaviorSubject<Notification[]>([]);
  notifications$ = this.notifications.asObservable();
  private toastContainer: HTMLElement | null = null;

  constructor() {
    this.createToastContainer();
  }

  addNotification(notification: Notification) {
    const currentNotifications = this.notifications.value;
    this.notifications.next([notification, ...currentNotifications]);
    this.showToast(notification);
  }

  clearNotifications() {
    this.notifications.next([]);
  }

  removeNotification(index: number) {
    const currentNotifications = this.notifications.value;
    const updatedNotifications = currentNotifications.filter((_, i) => i !== index);
    this.notifications.next(updatedNotifications);
  }

  private createToastContainer() {
    if (!this.toastContainer) {
      this.toastContainer = document.createElement('div');
      this.toastContainer.className = 'toast-container';
      this.toastContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        pointer-events: none;
      `;
      document.body.appendChild(this.toastContainer);
    }
  }

  private showToast(notification: Notification) {
    if (!this.toastContainer) {
      this.createToastContainer();
    }

    const toast = document.createElement('div');
    const statusClass = this.getToastClass(notification.status);

    toast.className = `custom-toast ${statusClass}`;
    toast.style.cssText = `
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      padding: 16px;
      margin-bottom: 12px;
      max-width: 350px;
      border-left: 4px solid ${this.getStatusColor(notification.status)};
      animation: slideInRight 0.3s ease-out;
      pointer-events: auto;
      cursor: pointer;
    `;

    toast.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 12px;">
        <div style="color: ${this.getStatusColor(notification.status)}; font-size: 18px;">
          ${this.getStatusIcon(notification.status)}
        </div>
        <div style="flex: 1;">
          <div style="font-weight: 600; color: #333; margin-bottom: 4px;">
            ${notification.title || 'Notification'}
          </div>
          <div style="color: #666; font-size: 14px;">
            ${notification.message}
          </div>
        </div>
        <button style="background: none; border: none; color: #999; cursor: pointer; font-size: 18px; padding: 0; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;" onclick="this.parentElement.parentElement.remove()">
          ×
        </button>
      </div>
    `;

    this.toastContainer!.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
          if (toast.parentElement) {
            toast.remove();
          }
        }, 300);
      }
    }, 5000);

    // Add click to dismiss
    toast.addEventListener('click', () => {
      toast.style.animation = 'slideOutRight 0.3s ease-in';
      setTimeout(() => {
        if (toast.parentElement) {
          toast.remove();
        }
      }, 300);
    });
  }

  private getToastClass(status: NotificationStatus | null): string {
    switch (status) {
      case NotificationStatus.SUCCESS:
        return 'success-toast';
      case NotificationStatus.ERROR:
        return 'error-toast';
      case NotificationStatus.WARNING:
        return 'warning-toast';
      case NotificationStatus.INFO:
        return 'info-toast';
      default:
        return 'default-toast';
    }
  }

  private getStatusColor(status: NotificationStatus | null): string {
    switch (status) {
      case NotificationStatus.SUCCESS:
        return '#4CAF50';
      case NotificationStatus.ERROR:
        return '#f44336';
      case NotificationStatus.WARNING:
        return '#ff9800';
      case NotificationStatus.INFO:
        return '#2196f3';
      default:
        return '#666';
    }
  }

  private getStatusIcon(status: NotificationStatus | null): string {
    switch (status) {
      case NotificationStatus.SUCCESS:
        return '✓';
      case NotificationStatus.ERROR:
        return '✕';
      case NotificationStatus.WARNING:
        return '⚠';
      case NotificationStatus.INFO:
        return 'ℹ';
      default:
        return '📢';
    }
  }
}
