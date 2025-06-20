import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { ChatRoom } from '../../models/chat/ChatRoom';
import { ChatMessage } from '../../models/chat/ChatMessage';
import { TypingStatus } from '../../models/chat/TypingStatus';
import { Profile } from '../../models/chat/ChatParticipant';

/**
 * Types of chat-related errors
 */
export enum ChatErrorType {
  CONNECTION = 'CONNECTION',
  MESSAGE_SEND = 'MESSAGE_SEND',
  FILE_UPLOAD = 'FILE_UPLOAD',
  MESSAGE_FETCH = 'MESSAGE_FETCH',
  ROOM_FETCH = 'ROOM_FETCH',
}

/**
 * Structure for chat errors
 */
export interface ChatError {
  type: ChatErrorType;
  message: string;
  timestamp: Date;
  details?: any;
}

/**
 * Service for managing chat UI state and handling error logging
 * This complements the ChatWebSocketService by handling UI-specific logic
 */
@Injectable({
  providedIn: 'root'
})
export class ChatStateService {
  // Active chat room tracking
  private activeChatRoomSubject = new BehaviorSubject<ChatRoom | null>(null);
  private chatRoomsSubject = new BehaviorSubject<ChatRoom[]>([]);

  // Typing status tracking
  private typingUsersMap = new Map<number, Map<number, number>>(); // Map<roomId, Map<userId, timeoutId>>
  private typingUsersSubject = new Map<number, BehaviorSubject<Profile[]>>();

  // Error handling
  private errorSubject = new Subject<ChatError>();

  // Last user activity time to manage typing indicators
  private lastUserActivity = new Map<number, number>(); // Map<userId, timestamp>

  constructor() { }

  /**
   * Set the active chat room
   * @param chatRoom The chat room to set as active
   */
  setActiveChatRoom(chatRoom: ChatRoom | null): void {
    this.activeChatRoomSubject.next(chatRoom);

    // Initialize typing users subject for this room if it doesn't exist
    if (chatRoom && !this.typingUsersSubject.has(chatRoom.id)) {
      this.typingUsersSubject.set(chatRoom.id, new BehaviorSubject<Profile[]>([]));
    }
  }

  /**
   * Get the active chat room
   * @returns Observable of the active chat room
   */
  getActiveChatRoom(): Observable<ChatRoom | null> {
    return this.activeChatRoomSubject.asObservable();
  }

  /**
   * Set available chat rooms for the user
   * @param chatRooms Array of available chat rooms
   */
  setChatRooms(chatRooms: ChatRoom[]): void {
    this.chatRoomsSubject.next(chatRooms);

    // Initialize typing users subject for each room
    chatRooms.forEach(room => {
      if (!this.typingUsersSubject.has(room.id)) {
        this.typingUsersSubject.set(room.id, new BehaviorSubject<Profile[]>([]));
      }
    });
  }

  /**
   * Get available chat rooms for the user
   * @returns Observable of available chat rooms
   */
  getChatRooms(): Observable<ChatRoom[]> {
    return this.chatRoomsSubject.asObservable();
  }

  /**
   * Get current chat rooms value without subscribing
   * @returns Current chat rooms array
   */
  getCurrentChatRooms(): ChatRoom[] {
    return this.chatRoomsSubject.getValue();
  }

  /**
   * Update typing status for a user in a chat room
   * @param chatRoomId The ID of the chat room
   * @param typingStatus The typing status update
   * @param profiles All profiles in the chat room to look up the user
   */
  updateTypingStatus(chatRoomId: number, typingStatus: TypingStatus, profiles: Profile[]): void {
    if (!this.typingUsersSubject.has(chatRoomId)) {
      this.typingUsersSubject.set(chatRoomId, new BehaviorSubject<Profile[]>([]));
    }

    // Initialize room in typing users map if needed
    if (!this.typingUsersMap.has(chatRoomId)) {
      this.typingUsersMap.set(chatRoomId, new Map<number, number>());
    }

    const roomTypingMap = this.typingUsersMap.get(chatRoomId)!;
    const userProfile = profiles.find(p => p.idp === typingStatus.senderId);

    if (!userProfile) {
      console.warn(`User profile not found for sender ID ${typingStatus.senderId}`);
      return;
    }

    // Clear existing timeout for this user if any
    if (roomTypingMap.has(typingStatus.senderId)) {
      window.clearTimeout(roomTypingMap.get(typingStatus.senderId));
    }

    const currentTypingUsers = this.typingUsersSubject.get(chatRoomId)?.getValue() || [];

    if (typingStatus.typing) {
      // Add user to typing list if not already there
      if (!currentTypingUsers.some(u => u.idp === typingStatus.senderId)) {
        const newTypingUsers = [...currentTypingUsers, userProfile];
        this.typingUsersSubject.get(chatRoomId)?.next(newTypingUsers);
      }

      // Set timeout to automatically remove typing status after 5 seconds
      const timeoutId = window.setTimeout(() => {
        this.removeTypingUser(chatRoomId, typingStatus.senderId);
      }, 5000);

      roomTypingMap.set(typingStatus.senderId, timeoutId);
    } else {
      // Remove user from typing list
      this.removeTypingUser(chatRoomId, typingStatus.senderId);
    }
  }

  /**
   * Remove a user from the typing users list
   * @param chatRoomId The ID of the chat room
   * @param userId The ID of the user to remove
   */
  private removeTypingUser(chatRoomId: number, userId: number): void {
    const currentTypingUsers = this.typingUsersSubject.get(chatRoomId)?.getValue() || [];
    const filteredUsers = currentTypingUsers.filter(u => u.idp !== userId);

    this.typingUsersSubject.get(chatRoomId)?.next(filteredUsers);

    // Clean up the timeout if it exists
    const roomTypingMap = this.typingUsersMap.get(chatRoomId);
    if (roomTypingMap && roomTypingMap.has(userId)) {
      window.clearTimeout(roomTypingMap.get(userId));
      roomTypingMap.delete(userId);
    }
  }

  /**
   * Get users who are currently typing in a chat room
   * @param chatRoomId The ID of the chat room
   * @returns Observable of profiles currently typing
   */
  getTypingUsers(chatRoomId: number): Observable<Profile[]> {
    if (!this.typingUsersSubject.has(chatRoomId)) {
      this.typingUsersSubject.set(chatRoomId, new BehaviorSubject<Profile[]>([]));
    }
    return this.typingUsersSubject.get(chatRoomId)!.asObservable();
  }

  /**
   * Track user activity to debounce typing indicators
   * @param userId The ID of the user
   * @returns Boolean indicating if enough time has passed to send a new typing status
   */
  trackUserActivity(userId: number): boolean {
    const now = Date.now();
    const lastActivity = this.lastUserActivity.get(userId) || 0;

    // Update last activity time
    this.lastUserActivity.set(userId, now);

    // Only send typing status if more than 2 seconds have passed since last update
    return (now - lastActivity) > 2000;
  }

  /**
   * Log an error that occurred during chat operations
   * @param type The type of error
   * @param message User-friendly error message
   * @param details Optional technical details of the error
   */
  logError(type: ChatErrorType, message: string, details?: any): void {
    const error: ChatError = {
      type,
      message,
      timestamp: new Date(),
      details
    };

    console.error('Chat error:', error);
    this.errorSubject.next(error);
  }

  /**
   * Get notifications of chat-related errors
   * @returns Observable of chat errors
   */
  getErrors(): Observable<ChatError> {
    return this.errorSubject.asObservable();
  }
}
