import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatRoom } from '../../models/chat/ChatRoom';

@Component({
  selector: 'app-chat-header',
  standalone: true,
  imports: [
    CommonModule
  ],
  template: `
    <div class="chat-header" [class.minimized]="minimized">
      <div class="header-content">
        <!-- Left side - Title and badges -->
        <div class="header-left">
          <div class="chat-icon" (click)="minimize.emit()">
            <div class="icon-chat">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                <path fill="none" d="M0 0h24v24H0z"/>
                <path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
              </svg>
            </div>
            <div class="badge" *ngIf="unreadCount > 0">{{ unreadCount > 99 ? '99+' : unreadCount }}</div>
          </div>
          <ng-container *ngIf="!minimized">
            <span class="chat-label">
              {{ activeRoom ? activeRoom.name : 'Messages' }}
            </span>
          </ng-container>
        </div>

        <!-- Right side - Action buttons -->
        <div class="header-actions">
          <button
            class="header-button"
            *ngIf="!minimized"
            title="Chat rooms"
            (click)="showRooms.emit()">
            <div class="icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
                <path fill="none" d="M0 0h24v24H0z"/>
                <path fill="currentColor" d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
              </svg>
            </div>
          </button>

          <button
            class="header-button"
            *ngIf="!minimized"
            [title]="expanded ? 'Shrink' : 'Expand'"
            (click)="expand.emit()">
            <div class="icon">
              <svg *ngIf="!expanded" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
                <path fill="none" d="M0 0h24v24H0z"/>
                <path fill="currentColor" d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
              </svg>
              <svg *ngIf="expanded" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
                <path fill="none" d="M0 0h24v24H0z"/>
                <path fill="currentColor" d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
              </svg>
            </div>
          </button>

          <button
            class="header-button"
            [title]="minimized ? 'Open chat' : 'Minimize'"
            (click)="minimize.emit()">
            <div class="icon">
              <svg *ngIf="minimized" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
                <path fill="none" d="M0 0h24v24H0z"/>
                <path fill="currentColor" d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z"/>
              </svg>
              <svg *ngIf="!minimized" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
                <path fill="none" d="M0 0h24v24H0z"/>
                <path fill="currentColor" d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/>
              </svg>
            </div>
          </button>
        </div>
      </div>

      <!-- Typing indicator -->
      <div class="typing-indicator" *ngIf="!minimized && typingUsers.length > 0">
        <div class="typing-dots">
          <span></span><span></span><span></span>
        </div>
        <div class="typing-text">
          <ng-container *ngIf="typingUsers.length === 1">
            {{ typingUsers[0] }} is typing...
          </ng-container>
          <ng-container *ngIf="typingUsers.length === 2">
            {{ typingUsers[0] }} and {{ typingUsers[1] }} are typing...
          </ng-container>
          <ng-container *ngIf="typingUsers.length > 2">
            {{ typingUsers.length }} people are typing...
          </ng-container>
        </div>
      </div>
    </div>
  `,
  styles: [`    :host {
      --ey-dark: #333333;
      --ey-yellow: #ffe600;
      --ey-white: #ffffff;
      --ey-light-gray: #cccccc;
      --ey-medium-gray: #999999;
    }

    .chat-header {
      background-color: var(--ey-dark);
      color: var(--ey-white);
      border-radius: 12px 12px 0 0;
      user-select: none;
      cursor: pointer;

      &.minimized {
        .header-content {
          padding: 12px 16px;
        }
      }
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      height: 48px;
    }

    .header-left {
      display: flex;
      align-items: center;
      font-weight: 500;
      font-size: 16px;
    }

    .chat-icon {
      margin-right: 8px;
      position: relative;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .icon-chat {
      color: var(--ey-white);
    }

    .badge {
      position: absolute;
      top: -5px;
      right: -7px;
      background-color: var(--ey-yellow);
      color: var(--ey-dark);
      font-weight: bold;
      min-width: 16px;
      height: 16px;
      border-radius: 8px;
      font-size: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
    }

    .chat-label {
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 180px;
    }

    .header-actions {
      display: flex;
    }

    .header-button {
      width: 28px;
      height: 28px;
      margin-left: 4px;
      background: transparent;
      border: none;
      border-radius: 4px;
      color: var(--ey-white);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background-color 0.2s;
      padding: 0;

      &:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }

      .icon {
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    .typing-indicator {
      display: flex;
      align-items: center;
      font-size: 11px;
      padding: 4px 16px;
      background-color: rgba(255, 255, 255, 0.1);
      height: 24px;
      border-radius: 0 0 12px 12px;

      .typing-dots {
        display: flex;
        align-items: center;
        margin-right: 4px;

        span {
          display: inline-block;
          width: 6px;
          height: 6px;
          margin-right: 2px;
          border-radius: 50%;
          background-color: var(--ey-yellow);
          animation: blink 1.4s infinite both;

          &:nth-child(2) {
            animation-delay: 0.2s;
          }

          &:nth-child(3) {
            animation-delay: 0.4s;
          }
        }
      }

      .typing-text {
        color: rgba(255, 255, 255, 0.7);
        font-style: italic;
      }
    }

    @keyframes blink {
      0%, 20%, 100% {
        transform: scale(1);
      }
      10% {
        transform: scale(1.2);
      }
    }
  `]
})
export class ChatHeaderComponent {
  @Input() unreadCount = 0;
  @Input() minimized = true;
  @Input() expanded = false;
  @Input() activeRoom: ChatRoom | null = null;
  @Input() typingUsers: string[] = [];

  @Output() minimize = new EventEmitter<void>();
  @Output() expand = new EventEmitter<void>();
  @Output() showRooms = new EventEmitter<void>();
}
