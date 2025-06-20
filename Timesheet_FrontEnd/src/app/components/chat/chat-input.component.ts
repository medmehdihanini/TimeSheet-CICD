import { Component, EventEmitter, Output, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat/chat.service';

@Component({
  selector: 'app-chat-input',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  template: `
    <div class="chat-input-container">
      <div class="file-upload">
        <input
          type="file"
          #fileInput
          (change)="handleFileUpload($event)"
          style="display: none;"
        >
        <button
          class="icon-button"
          title="Attach file"
          (click)="fileInput.click()">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
            <path fill="none" d="M0 0h24v24H0z"/>
            <path fill="currentColor" d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
          </svg>
        </button>
      </div>
        <div class="message-input">        <textarea
          #messageTextArea
          placeholder="Type a message..."
          [(ngModel)]="messageText"
          (input)="onTyping()"
          (keydown.enter)="onKeyPress($event)"
          rows="1"
        ></textarea>
      </div>

      <div class="send-button">
        <button
          class="icon-button send"
          title="Send message"
          [disabled]="!messageText.trim()"
          (click)="onSendMessage()">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
            <path fill="none" d="M0 0h24v24H0z"/>
            <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </div>
  `,  styles: [`
    :host {
      --ey-dark: #333333;
      --ey-yellow: #ffe600;
      --ey-white: #ffffff;
      --ey-light-gray: #cccccc;
      --ey-medium-gray: #999999;
    }

    .chat-input-container {
      display: flex;
      align-items: center;
      background-color: #f0f0f0;
      padding: 8px;
      border-top: 1px solid var(--ey-light-gray);
    }

    .file-upload {
      margin-right: 8px;
    }

    .icon-button {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: transparent;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #666666;
      transition: background-color 0.2s;
      padding: 0;

      &:hover {
        background-color: rgba(0, 0, 0, 0.05);
      }

      &.send {
        color: var(--ey-dark);

        &:disabled {
          color: var(--ey-light-gray);
          cursor: not-allowed;
        }
      }
    }

    .message-input {
      flex: 1;
      position: relative;

      textarea {
        width: 100%;
        border-radius: 18px;
        border: 1px solid var(--ey-light-gray);
        padding: 8px 12px;
        font-size: 14px;
        resize: none;
        outline: none;
        font-family: inherit;
        background: var(--ey-white);

        &:focus {
          border-color: var(--ey-yellow);
        }
      }
    }
  `]
})
export class ChatInputComponent implements OnDestroy {
  @Output() sendMessage = new EventEmitter<string>();
  @Output() typingStatus = new EventEmitter<boolean>();
  @Output() fileUpload = new EventEmitter<File>();

  @ViewChild('messageTextArea') messageTextArea!: ElementRef;

  messageText = '';

  private typingTimeout: any;

  constructor(private chatService: ChatService) {}

  ngOnDestroy(): void {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
  }

  onSendMessage(): void {
    if (!this.messageText.trim()) return;

    this.sendMessage.emit(this.messageText);
    this.messageText = '';
    this.typingStatus.emit(false);

    // Focus back on the textarea
    setTimeout(() => {
      this.messageTextArea.nativeElement.focus();
    }, 0);
  }
    onKeyPress(event: Event): void {
    const keyEvent = event as KeyboardEvent;
    if (!keyEvent.shiftKey && !keyEvent.ctrlKey && !keyEvent.altKey) {
      event.preventDefault();
      this.onSendMessage();
    }
  }
    onTyping(): void {
    // Adjust textarea height
    this.adjustTextareaHeight();

    // Send typing status and clear previous timeout
    if (this.messageText.trim().length > 0) {
      console.log('User is typing...');
      this.typingStatus.emit(true);

      clearTimeout(this.typingTimeout);

      // Set a new timeout to stop typing indicator after 2 seconds of inactivity
      this.typingTimeout = setTimeout(() => {
        console.log('User stopped typing');
        this.typingStatus.emit(false);
      }, 2000);
    } else {
      // If the message is empty, stop the typing indicator
      console.log('Message empty, stopping typing indicator');
      clearTimeout(this.typingTimeout);
      this.typingStatus.emit(false);
    }
  }

  handleFileUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      const file = input.files[0];
      this.fileUpload.emit(file);

      // Reset the input to allow selecting the same file again
      input.value = '';
    }
  }

  private adjustTextareaHeight(): void {
    const textarea = this.messageTextArea.nativeElement;
    textarea.style.height = 'auto';

    // Calculate the scroll height and set it, with a max height
    const newHeight = Math.min(textarea.scrollHeight, 100);
    textarea.style.height = `${newHeight}px`;
  }
}
