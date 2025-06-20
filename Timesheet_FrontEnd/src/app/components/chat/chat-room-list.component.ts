import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatRoom } from '../../models/chat/ChatRoom';
import { ChatService } from '../../services/chat/chat.service';

@Component({
  selector: 'app-chat-room-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  template: `
    <div class="room-list-container">
      <div class="search-container">
        <div class="search-field">
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (input)="filterRooms()"
            placeholder="Search conversations">
          <div class="search-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
              <path fill="none" d="M0 0h24v24H0z"/>
              <path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
          </div>
        </div>
      </div>

      <div class="rooms-container">
        <ng-container *ngIf="filteredRooms.length > 0; else noRooms">
          <div
            class="room-item"
            *ngFor="let room of filteredRooms"
            [class.active]="room.id === activeRoomId"
            (click)="selectRoom(room)">
            <div class="room-avatar">
              <div class="avatar-initials">
                {{ getInitials(room.name) }}
              </div>
            </div>
            <div class="room-details">
              <div class="room-header">
                <span class="room-name">{{ room.name }}</span>
                <span class="unread-badge" *ngIf="room.unreadCount && room.unreadCount > 0">
                  {{ room.unreadCount > 99 ? '99+' : room.unreadCount }}
                </span>
              </div>
              <div class="room-subtext">
                <span class="project-name" *ngIf="room.project">{{ room.project.name }}</span>
                <span class="members-count" *ngIf="room.members">
                  {{ room.members.length }} member{{ room.members.length !== 1 ? 's' : '' }}
                </span>
              </div>
            </div>
          </div>
        </ng-container>
        <ng-template #noRooms>
          <div class="no-rooms">
            <div class="icon-forum">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48">
                <path fill="none" d="M0 0h24v24H0z"/>
                <path fill="currentColor" d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
              </svg>
            </div>
            <p>No conversations found</p>

          </div>
        </ng-template>
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

    .room-list-container {
      height: 100%;
      display: flex;
      flex-direction: column;
      background-color: var(--ey-white);
    }

    .search-container {
      padding: 8px 16px;
      border-bottom: 1px solid var(--ey-light-gray);
    }

    .search-field {
      position: relative;
      width: 100%;

      input {
        width: 100%;
        font-size: 14px;
        padding: 10px 36px 10px 12px;
        border-radius: 4px;
        border: 1px solid var(--ey-light-gray);
        background-color: #f5f5f5;
        outline: none;

        &:focus {
          border-color: var(--ey-yellow);
        }
      }

      .search-icon {
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--ey-medium-gray);
        pointer-events: none;
      }
    }

    .rooms-container {
      flex: 1;
      overflow-y: auto;
      padding: 8px 0;
    }

    .room-item {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      cursor: pointer;
      transition: background-color 0.2s ease;

      &:hover {
        background-color: #f5f5f5;
      }

      &.active {
        background-color: rgba(255, 230, 0, 0.15);
      }
    }

    .room-avatar {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background-color: var(--ey-dark);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;
      flex-shrink: 0;

      .avatar-initials {
        color: var(--ey-white);
        font-size: 16px;
        font-weight: bold;
      }
    }

    .room-details {
      flex: 1;
      min-width: 0;
    }

    .room-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }

    .room-name {
      font-weight: 500;
      font-size: 15px;
      color: var(--ey-dark);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .unread-badge {
      background-color: var(--ey-yellow);
      color: var(--ey-dark);
      font-size: 11px;
      font-weight: bold;
      min-width: 18px;
      height: 18px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 5px;
    }

    .room-subtext {
      font-size: 12px;
      color: var(--ey-medium-gray);
      display: flex;
      justify-content: space-between;
    }

    .project-name {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 70%;
    }

    .members-count {
      font-size: 11px;
    }

    .no-rooms {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--ey-medium-gray);
      padding: 20px;
      text-align: center;

      .icon-forum {
        margin-bottom: 16px;
        color: var(--ey-light-gray);
      }

      p {
        margin-bottom: 16px;
      }

      .create-button {
        background-color: var(--ey-yellow);
        color: var(--ey-dark);
        border: none;
        border-radius: 4px;
        padding: 8px 16px;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s;

        &:hover {
          background-color: #e6cf00;
        }
      }
    }
  `]
})
export class ChatRoomListComponent implements OnInit, OnChanges {
  @Input() rooms: (ChatRoom & { unreadCount?: number })[] = [];
  @Input() activeRoomId: number | undefined;
  @Output() roomSelected = new EventEmitter<ChatRoom>();
  @Output() createRoom = new EventEmitter<void>();

  searchQuery = '';
  filteredRooms: (ChatRoom & { unreadCount?: number })[] = [];

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    this.filteredRooms = [...this.rooms];

    // Subscribe to unread message counts to keep badges updated
    this.chatService.getUnreadMessageCounts().subscribe(countMap => {
      if (countMap && this.rooms.length > 0) {
        this.updateUnreadCounts(countMap);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rooms'] && changes['rooms'].currentValue) {
      this.filteredRooms = [...this.rooms];
      this.filterRooms();

      // When rooms change, update unread counts
      this.chatService.getUnreadMessageCounts().subscribe(countMap => {
        if (countMap) {
          this.updateUnreadCounts(countMap);
        }
      });
    }
  }

  private updateUnreadCounts(countMap: Map<number, number>): void {
    this.filteredRooms = this.filteredRooms.map(room => ({
      ...room,
      unreadCount: countMap.get(room.id) || 0
    }));

    // Apply the same updates to the source rooms array
    this.rooms = this.rooms.map(room => ({
      ...room,
      unreadCount: countMap.get(room.id) || 0
    }));
  }

  filterRooms(): void {
    if (!this.searchQuery || this.searchQuery.trim() === '') {
      this.filteredRooms = [...this.rooms];
      return;
    }

    const query = this.searchQuery.toLowerCase().trim();
    this.filteredRooms = this.rooms.filter(room => {
      return (
        room.name.toLowerCase().includes(query) ||
        (room.project && room.project.name.toLowerCase().includes(query)) ||
        (room.description && room.description.toLowerCase().includes(query))
      );
    });
  }

  selectRoom(room: ChatRoom): void {
    this.roomSelected.emit(room);
  }

  createNewRoom(): void {
    this.createRoom.emit();
  }

  getInitials(name: string): string {
    if (!name) return '?';

    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    } else {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
  }
}
