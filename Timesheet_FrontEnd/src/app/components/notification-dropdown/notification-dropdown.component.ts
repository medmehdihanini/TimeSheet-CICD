import { Component, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notification/notification.service';
import { Notification, NotificationStatus } from '../../models/Notification';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-container" [class.open]="isDropdownOpen">
      <!-- Notification Button -->
      <button
        class="notification-btn"
        (click)="toggleDropdown()"
        [attr.aria-label]="'You have ' + ((notifications$ | async)?.length || 0) + ' notifications'"
        [attr.aria-expanded]="isDropdownOpen">

        <!-- Bell Icon -->
        <svg class="notification-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C13.1 2 14 2.9 14 4V5.1C16.2 5.6 17.9 7.3 18.4 9.5L19 12V16L21 18V19H3V18L5 16V12L5.6 9.5C6.1 7.3 7.8 5.6 10 5.1V4C10 2.9 10.9 2 12 2ZM12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22Z" fill="currentColor"/>
          <circle cx="18" cy="8" r="6" fill="#ffe600" *ngIf="(notifications$ | async)?.length">
            <animate attributeName="r" values="6;8;6" dur="2s" repeatCount="indefinite"/>
          </circle>
        </svg>

        <!-- Notification Count Badge -->
        <span
          class="notification-badge"
          *ngIf="(notifications$ | async)?.length"
          [class.pulse]="(notifications$ | async)?.length">
          {{(notifications$ | async)?.length}}
        </span>
      </button>

      <!-- Dropdown Panel -->
      <div class="notification-dropdown" [class.show]="isDropdownOpen">
        <!-- Header -->
        <div class="dropdown-header">
          <div class="header-content">
            <svg class="header-icon" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C13.1 2 14 2.9 14 4V5.1C16.2 5.6 17.9 7.3 18.4 9.5L19 12V16L21 18V19H3V18L5 16V12L5.6 9.5C6.1 7.3 7.8 5.6 10 5.1V4C10 2.9 10.9 2 12 2Z" fill="currentColor"/>
            </svg>
            <h3 class="header-title">Notifications</h3>
            <span class="header-count">{{(notifications$ | async)?.length || 0}}</span>
          </div>
          <button
            class="clear-btn"
            (click)="clearNotifications()"
            *ngIf="(notifications$ | async)?.length"
            title="Clear all notifications">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M19 7L18.1 20.9C18 21.5 17.5 22 16.9 22H7.1C6.5 22 6 21.5 5.9 20.9L5 7M10 11V17M14 11V17M15 7V4C15 3.4 14.6 3 14 3H10C9.4 3 9 3.4 9 4V7M4 7H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Clear All
          </button>
        </div>

        <!-- Notifications List -->
        <div class="notifications-list" *ngIf="(notifications$ | async)?.length; else emptyState">
          <div
            *ngFor="let notification of notifications$ | async; trackBy: trackByNotification; let i = index"
            class="notification-item"
            [class]="'notification-' + getNotificationClass(notification.status)"
            [style.animation-delay]="i * 50 + 'ms'"
            (click)="markAsRead(i)">

            <!-- Notification Icon -->
            <div class="notification-icon-wrapper">
              <svg class="status-icon" viewBox="0 0 24 24" fill="none">
                <!-- Success Icon -->
                <path *ngIf="notification.status === 'SUCCESS'"
                  d="M12 2C17.5 2 22 6.5 22 12S17.5 22 12 22 2 17.5 2 12 6.5 2 12 2M10 17L18 9L16.6 7.6L10 14.2L7.4 11.6L6 13L10 17Z"
                  fill="currentColor"/>

                <!-- Error Icon -->
                <path *ngIf="notification.status === 'ERROR'"
                  d="M12 2C17.5 2 22 6.5 22 12S17.5 22 12 22 2 17.5 2 12 6.5 2 12 2M15.5 16.9L16.9 15.5L13.4 12L16.9 8.5L15.5 7.1L12 10.6L8.5 7.1L7.1 8.5L10.6 12L7.1 15.5L8.5 16.9L12 13.4L15.5 16.9Z"
                  fill="currentColor"/>

                <!-- Warning Icon -->
                <path *ngIf="notification.status === 'WARNING'"
                  d="M13 14H11V10H13M13 18H11V16H13M1 21H23L12 2L1 21Z"
                  fill="currentColor"/>

                <!-- Info Icon -->
                <path *ngIf="notification.status === 'INFO' || !notification.status"
                  d="M12 2C17.5 2 22 6.5 22 12S17.5 22 12 22 2 17.5 2 12 6.5 2 12 2M13 17V11H11V17H13M13 9V7H11V9H13Z"
                  fill="currentColor"/>
              </svg>
            </div>

            <!-- Notification Content -->
            <div class="notification-content">
              <h4 class="notification-title">{{notification.title || 'Notification'}}</h4>
              <p class="notification-message">{{notification.message}}</p>
              <div class="notification-meta">
                <span class="notification-time">Just now</span>
                <span class="notification-status-label">{{getStatusLabel(notification.status)}}</span>
              </div>
            </div>

            <!-- Close Button -->
            <button class="close-btn" (click)="removeNotification(i, $event)" title="Dismiss">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M19 6.4L17.6 5L12 10.6L6.4 5L5 6.4L10.6 12L5 17.6L6.4 19L12 13.4L17.6 19L19 17.6L13.4 12L19 6.4Z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <ng-template #emptyState>
          <div class="empty-state">
            <svg class="empty-icon" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C13.1 2 14 2.9 14 4V5.1C16.2 5.6 17.9 7.3 18.4 9.5L19 12V16L21 18V19H3V18L5 16V12L5.6 9.5C6.1 7.3 7.8 5.6 10 5.1V4C10 2.9 10.9 2 12 2Z" fill="currentColor" opacity="0.3"/>
            </svg>
            <h4>No notifications</h4>
            <p>You're all caught up! We'll notify you when something new happens.</p>
          </div>
        </ng-template>
      </div>

      <!-- Backdrop -->
      <div class="dropdown-backdrop"
        *ngIf="isDropdownOpen"
        (click)="closeDropdown()">
      </div>
    </div>
  `,
  styles: [`
    /* Container */
    .notification-container {
      position: relative;
      display: inline-block;
    }

    /* Notification Button */
    .notification-btn {
      position: relative;
      background: transparent;
      border: none;
      padding: 8px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #333333;
    }

    .notification-btn:hover {
      background-color: rgba(255, 230, 0, 0.1);
      transform: translateY(-1px);
    }

    .notification-btn:focus {
      outline: 2px solid #ffe600;
      outline-offset: 2px;
    }

    /* Bell Icon */
    .notification-icon {
      width: 24px;
      height: 24px;
      transition: all 0.3s ease;
    }

    .notification-btn:hover .notification-icon {
      transform: rotate(15deg);
    }

    /* Notification Badge */
    .notification-badge {
      position: absolute;
      top: 2px;
      right: 2px;
      background: #ffe600;
      color: #333333;
      font-size: 11px;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 10px;
      min-width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .notification-badge.pulse {
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }

    /* Dropdown Panel */
    .notification-dropdown {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      width: 380px;
      max-width: 90vw;
      max-height: 500px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
      border: 1px solid rgba(51, 51, 51, 0.1);
      z-index: 1000;
      opacity: 0;
      visibility: hidden;
      transform: translateY(-10px) scale(0.95);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
    }

    .notification-dropdown.show {
      opacity: 1;
      visibility: visible;
      transform: translateY(0) scale(1);
    }

    /* Dropdown Header */
    .dropdown-header {
      padding: 16px 20px;
      border-bottom: 1px solid rgba(51, 51, 51, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: linear-gradient(135deg, #ffe600 0%, #f5d800 100%);
      border-radius: 12px 12px 0 0;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .header-icon {
      width: 20px;
      height: 20px;
      color: #333333;
    }

    .header-title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #333333;
    }

    .header-count {
      background: #333333;
      color: #ffe600;
      font-size: 12px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 12px;
      margin-left: 8px;
    }

    .clear-btn {
      background: transparent;
      border: 1px solid #333333;
      color: #333333;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: all 0.2s ease;
    }

    .clear-btn:hover {
      background: #333333;
      color: #ffe600;
    }

    .clear-btn svg {
      width: 14px;
      height: 14px;
    }

    /* Notifications List */
    .notifications-list {
      max-height: 360px;
      overflow-y: auto;
      padding: 8px 0;
    }

    .notifications-list::-webkit-scrollbar {
      width: 6px;
    }

    .notifications-list::-webkit-scrollbar-track {
      background: #f5f5f5;
    }

    .notifications-list::-webkit-scrollbar-thumb {
      background: #ddd;
      border-radius: 3px;
    }

    .notifications-list::-webkit-scrollbar-thumb:hover {
      background: #bbb;
    }

    /* Notification Item */
    .notification-item {
      padding: 16px 20px;
      border-bottom: 1px solid rgba(51, 51, 51, 0.05);
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      position: relative;
      animation: slideIn 0.3s ease forwards;
      opacity: 0;
      transform: translateX(20px);
      min-height: 70px;
      overflow: hidden;
    }

    @keyframes slideIn {
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    .notification-item:hover {
      background-color: rgba(255, 230, 0, 0.05);
    }

    .notification-item:last-child {
      border-bottom: none;
    }

    /* Notification Icon Wrapper */
    .notification-icon-wrapper {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 2px;
    }

    .notification-success .notification-icon-wrapper {
      background: rgba(76, 175, 80, 0.1);
      color: #4CAF50;
    }

    .notification-error .notification-icon-wrapper {
      background: rgba(244, 67, 54, 0.1);
      color: #f44336;
    }

    .notification-warning .notification-icon-wrapper {
      background: rgba(255, 152, 0, 0.1);
      color: #ff9800;
    }

    .notification-info .notification-icon-wrapper {
      background: rgba(33, 150, 243, 0.1);
      color: #2196f3;
    }

    .notification-default .notification-icon-wrapper {
      background: rgba(51, 51, 51, 0.1);
      color: #333333;
    }

    .status-icon {
      width: 16px;
      height: 16px;
    }

    /* Notification Content */
    .notification-content {
      flex-grow: 1;
      min-width: 0;
      overflow: hidden;
    }

    .notification-title {
      margin: 0 0 4px 0;
      font-size: 14px;
      font-weight: 600;
      color: #333333;
      line-height: 1.3;
      word-wrap: break-word;
      overflow-wrap: break-word;
      hyphens: auto;
      white-space: normal;
    }

    .notification-message {
      margin: 0 0 8px 0;
      font-size: 13px;
      color: #666666;
      line-height: 1.4;
      word-wrap: break-word;
      overflow-wrap: break-word;
      hyphens: auto;
      white-space: normal;
    }

    .notification-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
    }

    .notification-time {
      color: #999999;
    }

    .notification-status-label {
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 500;
      font-size: 10px;
      text-transform: uppercase;
    }

    .notification-success .notification-status-label {
      background: rgba(76, 175, 80, 0.1);
      color: #4CAF50;
    }

    .notification-error .notification-status-label {
      background: rgba(244, 67, 54, 0.1);
      color: #f44336;
    }

    .notification-warning .notification-status-label {
      background: rgba(255, 152, 0, 0.1);
      color: #ff9800;
    }

    .notification-info .notification-status-label {
      background: rgba(33, 150, 243, 0.1);
      color: #2196f3;
    }

    .notification-default .notification-status-label {
      background: rgba(51, 51, 51, 0.1);
      color: #333333;
    }

    /* Close Button */
    .close-btn {
      background: transparent;
      border: none;
      padding: 4px;
      border-radius: 4px;
      cursor: pointer;
      color: #999999;
      transition: all 0.2s ease;
      flex-shrink: 0;
      opacity: 0;
      transform: scale(0.8);
    }

    .notification-item:hover .close-btn {
      opacity: 1;
      transform: scale(1);
    }

    .close-btn:hover {
      background: rgba(244, 67, 54, 0.1);
      color: #f44336;
    }

    .close-btn svg {
      width: 16px;
      height: 16px;
    }

    /* Empty State */
    .empty-state {
      padding: 40px 20px;
      text-align: center;
      color: #666666;
    }

    .empty-icon {
      width: 48px;
      height: 48px;
      margin: 0 auto 16px;
      color: #cccccc;
    }

    .empty-state h4 {
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: 600;
      color: #333333;
    }

    .empty-state p {
      margin: 0;
      font-size: 14px;
      color: #999999;
      line-height: 1.5;
    }

    /* Backdrop */
    .dropdown-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 999;
      background: transparent;
    }

    /* Responsive Design */
    @media (max-width: 480px) {
      .notification-dropdown {
        width: 320px;
        right: -20px;
      }

      .notification-item {
        padding: 12px 16px;
      }

      .dropdown-header {
        padding: 12px 16px;
      }
    }

    /* Accessibility */
    @media (prefers-reduced-motion: reduce) {
      .notification-btn,
      .notification-dropdown,
      .notification-item,
      .close-btn {
        animation: none;
        transition: none;
      }

      .notification-badge.pulse {
        animation: none;
      }
    }

    /* Focus Management */
    .notification-btn:focus-visible {
      outline: 2px solid #ffe600;
      outline-offset: 2px;
    }

    .close-btn:focus-visible {
      outline: 2px solid #ffe600;
      outline-offset: 1px;
    }

    .clear-btn:focus-visible {
      outline: 2px solid #333333;
      outline-offset: 1px;
    }
  `]
})
export class NotificationDropdownComponent implements OnInit {
  notifications$: Observable<Notification[]>;
  isDropdownOpen = false;

  constructor(
    private notificationService: NotificationService,
    private elementRef: ElementRef
  ) {
    this.notifications$ = this.notificationService.notifications$;
  }

  ngOnInit(): void {}

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  clearNotifications(): void {
    this.notificationService.clearNotifications();
    this.closeDropdown();
  }

  removeNotification(index: number, event: Event): void {
    event.stopPropagation();
    this.notificationService.removeNotification(index);
  }

  markAsRead(index: number): void {
    // Mark as read functionality can be implemented later
    console.log('Mark as read:', index);
  }

  trackByNotification(index: number, notification: Notification): any {
    return `${index}-${notification.message}-${notification.title}`;
  }

  getStatusLabel(status: NotificationStatus | null): string {
    switch (status) {
      case NotificationStatus.SUCCESS:
        return 'Success';
      case NotificationStatus.ERROR:
        return 'Error';
      case NotificationStatus.WARNING:
        return 'Warning';
      case NotificationStatus.INFO:
        return 'Info';
      default:
        return 'Notification';
    }
  }

  getNotificationClass(status: NotificationStatus | null): string {
    switch (status) {
      case NotificationStatus.SUCCESS:
        return 'success';
      case NotificationStatus.ERROR:
        return 'error';
      case NotificationStatus.WARNING:
        return 'warning';
      case NotificationStatus.INFO:
        return 'info';
      default:
        return 'default';
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(): void {
    this.closeDropdown();
  }
}
