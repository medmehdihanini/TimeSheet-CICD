import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ChatMessage } from '../../models/chat/ChatMessage';

/**
 * Service to manage chat messages synchronization across components
 * This service is meant to augment WebSocket communication and ensure UI updates
 */
@Injectable({
  providedIn: 'root'
})
export class ChatMessageService {
  // Store messages by room ID
  private messageStore = new Map<number, ChatMessage[]>();

  // Create subjects to broadcast message updates per room
  private messageSubjects = new Map<number, BehaviorSubject<ChatMessage[]>>();

  constructor(private ngZone: NgZone) {}
  /**
   * Add a message to a specific chat room
   * @param roomId The ID of the chat room
   * @param message The message to add
   */
  addMessage(roomId: number, message: ChatMessage): void {
    console.log(`[ChatMessageService] Adding message to room ${roomId}:`, message);

    try {
      // Initialize messages array for room if it doesn't exist
      if (!this.messageStore.has(roomId)) {
        console.log(`[ChatMessageService] Initializing store and subject for new room ${roomId}`);
        this.messageStore.set(roomId, []);
        this.messageSubjects.set(roomId, new BehaviorSubject<ChatMessage[]>([]));
      }

      // Get current messages
      const messages = this.messageStore.get(roomId)!;
      console.log(`[ChatMessageService] Current message count for room ${roomId}:`, messages.length);

      // Only add the message if it doesn't already exist
      const isDuplicate = message.id && messages.some(m => m.id === message.id);

      if (isDuplicate) {
        console.log(`[ChatMessageService] Skipping duplicate message with ID ${message.id}`);
        return;
      }

      // Add the new message and sort
      const updatedMessages = [...messages, message].sort((a, b) =>
        new Date(a.createdDate || 0).getTime() - new Date(b.createdDate || 0).getTime()
      );

      // Update the store
      this.messageStore.set(roomId, updatedMessages);

      // Run inside Angular's zone to ensure change detection is triggered
      this.ngZone.run(() => {
        console.log(`[ChatMessageService] Broadcasting ${updatedMessages.length} messages for room ${roomId}`);

        // Ensure we have a subject to broadcast to
        if (!this.messageSubjects.has(roomId)) {
          console.log(`[ChatMessageService] Creating missing subject for room ${roomId}`);
          this.messageSubjects.set(roomId, new BehaviorSubject<ChatMessage[]>([]));
        }

        // Notify subscribers
        this.messageSubjects.get(roomId)!.next(updatedMessages);
      });
    } catch (error) {
      console.error(`[ChatMessageService] Error adding message to room ${roomId}:`, error);
    }
  }

  /**
   * Set all messages for a specific chat room
   * @param roomId The ID of the chat room
   * @param messages The messages to set
   */
  setMessages(roomId: number, messages: ChatMessage[]): void {
    // Initialize subject if it doesn't exist
    if (!this.messageSubjects.has(roomId)) {
      this.messageSubjects.set(roomId, new BehaviorSubject<ChatMessage[]>([]));
    }

    // Sort messages by date
    const sortedMessages = [...messages].sort((a, b) =>
      new Date(a.createdDate || 0).getTime() - new Date(b.createdDate || 0).getTime()
    );

    // Update the store
    this.messageStore.set(roomId, sortedMessages);

    // Run inside Angular's zone to ensure change detection is triggered
    this.ngZone.run(() => {
      console.log(`Set ${sortedMessages.length} messages for room ${roomId}`);
      // Notify subscribers
      this.messageSubjects.get(roomId)!.next(sortedMessages);
    });
  }

  /**
   * Get messages for a specific chat room
   * @param roomId The ID of the chat room
   * @returns Array of messages or empty array if none
   */
  getMessages(roomId: number): ChatMessage[] {
    return this.messageStore.get(roomId) || [];
  }

  /**
   * Get an observable of messages for a specific chat room
   * @param roomId The ID of the chat room
   * @returns Observable of messages array
   */
  getMessages$(roomId: number): BehaviorSubject<ChatMessage[]> {
    // Initialize if it doesn't exist
    if (!this.messageSubjects.has(roomId)) {
      this.messageStore.set(roomId, []);
      this.messageSubjects.set(roomId, new BehaviorSubject<ChatMessage[]>([]));
    }

    return this.messageSubjects.get(roomId)!;
  }

  /**
   * Clear messages for a specific chat room
   * @param roomId The ID of the chat room
   */
  clearMessages(roomId: number): void {
    this.messageStore.set(roomId, []);

    if (this.messageSubjects.has(roomId)) {
      this.messageSubjects.get(roomId)!.next([]);
    }
  }
}
