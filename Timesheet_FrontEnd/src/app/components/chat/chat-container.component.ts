import { Component, OnInit, OnDestroy, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ChatService } from '../../services/chat/chat.service';
import { ChatStateService } from '../../services/chat/chat-state.service';
import { UserserviceService } from '../../services/user/userservice.service';
import { ChatRoom } from '../../models/chat/ChatRoom';
import { ChatMessage, ContentType } from '../../models/chat/ChatMessage';
import { Profile } from '../../models/chat/ChatParticipant';
import { TypingStatus } from '../../models/chat/TypingStatus';
import { ProfileId } from '../../models/chat/ProfileId';
import { ChatHeaderComponent } from './chat-header.component';
import { ChatMessageListComponent } from './chat-message-list.component';
import { ChatInputComponent } from './chat-input.component';
import { ChatRoomListComponent } from './chat-room-list.component';

@Component({
  selector: 'app-chat-container',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ChatHeaderComponent,
    ChatMessageListComponent,
    ChatInputComponent,
    ChatRoomListComponent
  ],
  templateUrl: './chat-container.component.html',
  styleUrls: ['./chat-container.component.scss']
})
export class ChatContainerComponent implements OnInit, OnDestroy {
  minimized = true;
  expanded = false;
  unreadCount = 0;
  chatRooms: ChatRoom[] = [];
  activeRoom: ChatRoom | null = null;
  currentUser: Profile | null = null;
  typingUsers: string[] = [];
  private destroy$ = new Subject<void>();
  showRoomList = false;
  // Use inject function for dependency injection
  private chatService = inject(ChatService);
  private chatStateService = inject(ChatStateService);
  private userService = inject(UserserviceService);

  constructor() {}

  ngOnInit(): void {
    // Get current user
    const user = this.userService.getUserConnected();

    if (user) {      // Get the matching profile ID for the connected user
      this.userService.getMatchingProfileId(user.id).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (profileData: ProfileId) => {
          // Store current user with the correct profile ID
          this.currentUser = {
            idp: profileData.idp, // Use the profile ID from the API response
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            image: user.image
          };

          // Initialize chat rooms for current user with the correct profile ID
          this.chatService.initializeUserChatRooms(profileData.idp).pipe(
            takeUntil(this.destroy$)
          ).subscribe({
            next: (rooms) => {
              console.log('Chat rooms loaded:', rooms);
              this.chatRooms = rooms;

              // If we have rooms but no active room, set the first one as active
              if (rooms.length > 0 && !this.activeRoom) {
                this.selectRoom(rooms[0]);
              }

              // Get unread counts for all rooms
              this.chatService.getUnreadMessageCounts().pipe(
                takeUntil(this.destroy$)
              ).subscribe(countMap => {
                // Calculate total unread messages
                let totalUnread = 0;
                countMap.forEach((count) => {
                  totalUnread += count;
                });
                this.unreadCount = totalUnread;
              });
            },
            error: (err) => console.error('Failed to load chat rooms:', err)
          });

          // Subscribe to active chat room changes
          this.chatService.getActiveChatRoom().pipe(
            takeUntil(this.destroy$)
          ).subscribe(room => {
            this.activeRoom = room;
          });

          // Subscribe to typing indicators
          this.chatService.getTypingUsers().pipe(
            takeUntil(this.destroy$)
          ).subscribe(typingProfiles => {
            // Convert typing profiles to names for display
            this.typingUsers = typingProfiles.map(p => p.firstname);          });
        },
        error: (err: Error) => console.error('Failed to get matching profile ID:', err)
      });
    } else {
      console.error('No user is logged in. Chat functionality disabled.');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Clean up properly - since the service is provided at root level,
    // it won't be destroyed, but we should let it know this component is gone
    if (this.activeRoom) {
      // Unsubscribe from active chat room's messages
      // The service will handle proper cleanup
      this.chatStateService.setActiveChatRoom(null);
    }
  }

  toggleMinimize(): void {
    this.minimized = !this.minimized;

    // If we're un-minimizing and there's no active room, show room list
    if (!this.minimized && !this.activeRoom) {
      this.showRoomList = true;
    }

    // When opening the chat, mark messages as read
    if (!this.minimized && this.activeRoom) {
      this.markMessagesAsRead();
    }

    // If minimizing, close expanded view
    if (this.minimized) {
      this.expanded = false;
      this.showRoomList = false;
    }
  }

  toggleExpand(): void {
    this.expanded = !this.expanded;
  }

  toggleRoomList(): void {
    this.showRoomList = !this.showRoomList;
  }
  selectRoom(room: ChatRoom): void {
    // Activate the selected chat room which will:
    // 1. Set it as active in the state
    // 2. Subscribe to its messages
    // 3. Load recent messages
    const projectId = room.project?.idproject;
    this.chatService.activateChatRoom(room.id, projectId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (messages) => {
        console.log(`Activated room ${room.name} with ${messages.length} messages`);
        this.activeRoom = room;
        this.showRoomList = false;
      },
      error: (err) => console.error(`Failed to activate chat room ${room.id}:`, err)
    });
  }

  sendMessage(messageText: string): void {
    if (!this.activeRoom || !messageText.trim() || !this.currentUser) return;

    this.chatService.sendMessage(messageText)
      .then(() => {
        console.log('Message sent successfully');
      })
      .catch(error => {
        console.error('Failed to send message:', error);
      });
  }

  sendTypingStatus(isTyping: boolean): void {
    if (!this.activeRoom || !this.currentUser) return;

    this.chatService.sendTypingStatus(isTyping);
  }

  uploadFile(file: File): void {
    if (!this.activeRoom || !this.currentUser) return;

    this.chatService.uploadFile(file)
      .subscribe({
        next: (message) => {
          console.log('File uploaded successfully:', message);
        },
        error: (error) => {
          console.error('Failed to upload file:', error);
        }

      });
  }

  // Helper method to mark messages as read when opening the chat
  markMessagesAsRead(): void {
    if (!this.activeRoom) return;

    // Get unread count for the active room
    this.chatService.getUnreadMessageCounts().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (countMap) => {
        const unreadCount = countMap.get(this.activeRoom!.id) || 0;

        if (unreadCount > 0) {
          // The message list component will handle marking messages as read
          // when it loads messages, but we update the count here
          console.log(`Chat room ${this.activeRoom!.id} has ${unreadCount} unread messages`);
          this.unreadCount = Math.max(0, this.unreadCount - unreadCount);
        }
      },
      error: (err) => console.error('Failed to get unread message counts:', err)
    });
  }
}
