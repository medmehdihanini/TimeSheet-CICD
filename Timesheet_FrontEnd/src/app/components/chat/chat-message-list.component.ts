import { Component, Input, OnInit, OnChanges, SimpleChanges, ViewChild, ElementRef, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { ChatService } from '../../services/chat/chat.service';
import { ChatStateService } from '../../services/chat/chat-state.service';
import { ChatWebSocketService } from '../../services/chat/chat-websocket.service';
import { ChatMessageService } from '../../services/chat/chat-message.service';
import { ChatMessage } from '../../models/chat/ChatMessage';
import { Profile } from '../../models/chat/ChatParticipant';

@Component({
  selector: 'app-chat-message-list',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="message-list-container">
      <div class="message-list-scrollable">
        <div class="message-list" #messageList>
          <!-- Empty state message when no messages -->
          <div class="messages-group" *ngIf="messages.length === 0">
            <div class="empty-messages">
              <p>No messages yet</p>
              <p>Start a conversation!</p>
            </div>
          </div>

          <!-- Messages by date groups -->
          <div class="messages-group" *ngFor="let group of messageGroups">
            <div class="date-separator">{{ group.date }}</div>

            <!-- Individual message -->
            <div
              class="message-item"
              *ngFor="let message of group.messages"
              [ngClass]="{'own-message': message.sender?.idp === currentUserId, 'system-message': message.systemMessage}">

              <!-- System Message -->
              <div class="system-message-content" *ngIf="message.systemMessage">
                {{ message.content }}
              </div>

              <!-- User Message -->
              <ng-container *ngIf="!message.systemMessage">
                <!-- Avatar for other users' messages -->
                <div class="message-avatar" *ngIf="message.sender?.idp !== currentUserId">
                  <div class="avatar-image" [style.backgroundImage]="getAvatarUrl(message.sender)"></div>
                </div>

                <div class="message-content-wrapper">
                  <!-- Sender name for other users' messages -->
                  <div class="message-sender" *ngIf="message.sender?.idp !== currentUserId">
                    {{ message.sender?.firstname }} {{ message.sender?.lastname }}
                  </div>

                  <!-- Message content based on type -->
                  <div class="message-content">
                    <ng-container [ngSwitch]="message.contentType">
                      <!-- Text message -->
                      <span *ngSwitchCase="'TEXT'">{{ message.content }}</span>

                      <!-- File message -->
                      <div *ngSwitchCase="'FILE'" class="file-attachment">
                        <div class="attachment-icon">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
                            <path fill="none" d="M0 0h24v24H0z"/>
                            <path fill="currentColor" d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
                          </svg>
                        </div>
                        <a [href]="message.fileUrl" target="_blank" download>{{ message.content }}</a>
                      </div>

                      <!-- Default case -->
                      <span *ngSwitchDefault>{{ message.content }}</span>
                    </ng-container>
                  </div>

                  <!-- Message timestamp -->
                  <div class="message-time">
                    {{ formatMessageTime(message.createdDate) }}
                  </div>
                </div>
              </ng-container>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --ey-dark: #333333;
      --ey-yellow: #ffe600;
      --ey-white: #ffffff;
      --ey-light-gray: #cccccc;
      --ey-medium-gray: #999999;
    }
    .message-list-container {
      display: flex;
      flex-direction: column;
      flex: 1;
      overflow: hidden;
      position: relative;
      height: 100%;
    }

    .message-list-scrollable {
      flex: 1;
      overflow-y: auto;
      height: 100%;
      position: relative;
    }

    .message-list {
      padding: 10px;
      display: flex;
      flex-direction: column;
      width: 100%;
    }

    .empty-messages {
      text-align: center;
      color: var(--ey-medium-gray);
      padding: 20px;
      font-style: italic;
    }

    .date-separator {
      text-align: center;
      font-size: 12px;
      color: var(--ey-medium-gray);
      margin: 10px 0;
      position: relative;
    }

    .message-item {
      display: flex;
      margin-bottom: 8px;
    }

    .message-item.own-message {
      flex-direction: row-reverse;
    }

    .message-item.own-message .message-content {
      background-color: var(--ey-yellow);
      color: var(--ey-dark);
      border-radius: 18px 4px 18px 18px;
    }

    .message-item.system-message {
      justify-content: center;
    }

    .system-message-content {
      font-style: italic;
      color: var(--ey-medium-gray);
      font-size: 12px;
      background-color: #f0f0f0;
      padding: 4px 10px;
      border-radius: 12px;
    }

    .message-avatar {
      width: 32px;
      height: 32px;
      margin-right: 8px;
      flex-shrink: 0;
    }

    .avatar-image {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background-size: cover;
      background-position: center;
      background-color: var(--ey-light-gray);
    }

    .message-content-wrapper {
      max-width: 70%;
    }

    .message-sender {
      font-size: 11px;
      color: var(--ey-medium-gray);
      margin-bottom: 2px;
    }

    .message-content {
      background-color: #f0f0f0;
      padding: 8px 12px;
      border-radius: 4px 18px 18px 18px;
      word-break: break-word;
      font-size: 14px;
    }

    .file-attachment {
      display: flex;
      align-items: center;
    }

    .attachment-icon {
      color: var(--ey-dark);
      margin-right: 6px;
      display: flex;
      align-items: center;
    }

    .message-time {
      font-size: 10px;
      color: var(--ey-medium-gray);
      text-align: right;
      margin-top: 2px;
    }
  `]
})
export class ChatMessageListComponent implements OnInit, OnChanges, OnDestroy {
  @Input() roomId: number = 0;
  @Input() currentUserId: number = 0;

  @ViewChild('messageList') messageListRef!: ElementRef;

  messages: ChatMessage[] = [];
  messageGroups: { date: string, messages: ChatMessage[] }[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private chatService: ChatService,
    private chatWebSocketService: ChatWebSocketService,
    private chatMessageService: ChatMessageService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.subscribeToMessages();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['roomId'] && changes['roomId'].currentValue) {
      this.loadInitialMessages();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  private subscribeToMessages(): void {
    // Subscribe ONLY to message updates from ChatMessageService
    // This is the single source of truth for messages
    this.chatMessageService.getMessages$(this.roomId).pipe(
      takeUntil(this.destroy$)
    ).subscribe(messages => {
      this.ngZone.run(() => {
        console.log(`[ChatMessageListComponent] Received ${messages.length} messages from ChatMessageService for room ${this.roomId}`);
        this.messages = [...messages];
        this.groupMessagesByDate();
        this.cdr.markForCheck();
        this.scrollToBottom();
      });
    });

    // We no longer subscribe directly to WebSocket messages here
    // Instead, we rely on ChatService to route messages to ChatMessageService
  }

  private loadInitialMessages(): void {
    console.log('Loading messages for room:', this.roomId);

    this.chatWebSocketService.getRecentMessages(this.roomId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (messages) => {
        console.log('Initial messages loaded:', messages.length);
        this.chatMessageService.setMessages(this.roomId, messages);
      },
      error: (error) => console.error('Error loading messages:', error)
    });
  }

  private handleNewMessage(message: ChatMessage): void {
    console.log('Processing new message:', message);
    this.chatMessageService.addMessage(this.roomId, message);
    this.scrollToBottom();
  }
  private groupMessagesByDate(): void {
    try {
      const groups: { [key: string]: ChatMessage[] } = {};

      console.log(`[ChatMessageList] Grouping ${this.messages.length} messages by date for room ${this.roomId}`);

      // Handle the case where messages are empty
      if (!this.messages || this.messages.length === 0) {
        this.messageGroups = [];
        this.cdr.markForCheck();
        return;
      }

      this.messages.forEach(message => {
        // Ensure message has a valid creation date
        if (!message.createdDate) {
          console.log(`[ChatMessageList] Message missing createdDate, setting to current time:`, message);
          message.createdDate = new Date().toISOString();
        }

        const date = new Date(message.createdDate);
        const dateKey = this.formatMessageDate(date);

        if (!groups[dateKey]) {
          groups[dateKey] = [];
        }

        groups[dateKey].push(message);
      });

      this.messageGroups = Object.keys(groups).map(key => ({
        date: key,
        messages: groups[key].sort((a, b) =>
          new Date(a.createdDate!).getTime() - new Date(b.createdDate!).getTime()
        )
      })).sort((a, b) =>
        new Date(a.messages[0].createdDate!).getTime() - new Date(b.messages[0].createdDate!).getTime()
      );

      console.log(`[ChatMessageList] Created ${this.messageGroups.length} message groups`);
      this.cdr.markForCheck();
    } catch (error) {
      console.error(`[ChatMessageList] Error grouping messages:`, error);
      // Ensure we have a valid state even after error
      this.messageGroups = [];
      this.cdr.markForCheck();
    }
  }

  private scrollToBottom(): void {
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        this.ngZone.run(() => {
          if (this.messageListRef) {
            const scrollable = this.messageListRef.nativeElement.closest('.message-list-scrollable');
            if (scrollable) {
              scrollable.scrollTop = scrollable.scrollHeight;
            }
          }
        });
      }, 0);
    });
  }

  getAvatarUrl(sender?: Profile): string {
    if (!sender) return 'url(/assets/imgholder.jpg)';
    return sender.image ? `url(data:image/png;base64,${sender.image})` : 'url(/assets/imgholder.jpg)';
  }

  formatMessageDate(date: Date): string {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  }

  formatMessageTime(dateStr?: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }
}
