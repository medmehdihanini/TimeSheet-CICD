import { Injectable } from '@angular/core';
import { Client } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import { BehaviorSubject, Observable, of, Subject, throwError } from 'rxjs';
import { catchError, tap, timeout } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { UserserviceService } from '../user/userservice.service';

import { ChatRoom } from '../../models/chat/ChatRoom';
import { ChatMessage } from '../../models/chat/ChatMessage';
import { TypingStatus } from '../../models/chat/TypingStatus';
import { Profile } from '../../models/chat/ChatParticipant';
import { ChatMessageService } from './chat-message.service';

/**
 * Service for handling WebSocket communication for the chat functionality
 */
@Injectable({
  providedIn: 'root'
})
export class ChatWebSocketService {
  private baseUrl = 'http://localhost:8083/api/v1/chat';
  private client: Client;
  private messageSubject = new Subject<ChatMessage>();
  private typingSubject = new Subject<TypingStatus>();
  private connectionStatus = new BehaviorSubject<boolean>(false);

  // Track active subscriptions
  private activeSubscriptions: Map<string, any> = new Map();
  // Cache for recent messages to handle connection drops
  private messageCache: Map<number, ChatMessage[]> = new Map();

  constructor(
    private http: HttpClient,
    private userService: UserserviceService,
    private chatMessageService: ChatMessageService
  ) {
    this.initializeWebSocketConnection();
  }

  /**
   * Initialize WebSocket connection with SockJS fallback
   */  private initializeWebSocketConnection(): void {
    console.log('Initializing WebSocket connection...');
    this.client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8083/chat-socket'),
      debug: (str) => {
        console.log('📡 CHAT STOMP:', str);
      },
    });

    this.client.onConnect = (frame) => {
      console.log('🌐 Chat WebSocket Connected', frame);
      this.connectionStatus.next(true);

      // Resubscribe to active chat rooms after reconnection
      this.resubscribeToActiveRooms();
    };

    this.client.onDisconnect = () => {
      console.log('🔴 Chat WebSocket Disconnected');
      this.connectionStatus.next(false);
    };

    this.client.onStompError = (frame) => {
      console.error('STOMP Error:', frame);
    };

    this.client.activate();
  }

  /**
   * Resubscribe to previously active chat rooms after reconnection
   */
  private resubscribeToActiveRooms(): void {
    this.activeSubscriptions.forEach((_, destination) => {
      this.subscribeToChatRoom(parseInt(destination.split('/')[2]));
    });
  }

  /**
   * Subscribe to a specific chat room's messages and typing indicators
   * @param chatRoomId The ID of the chat room to subscribe to
   */  subscribeToChatRoom(chatRoomId: number): void {
    console.log(`Subscribing to chat room ${chatRoomId}...`);

    // Subscribe to messages
    const messageDestination = `/user/chatroom/${chatRoomId}`;
    if (!this.activeSubscriptions.has(messageDestination)) {
      console.log(`Creating new subscription for ${messageDestination}`);      const messageSubscription = this.client.subscribe(
        messageDestination,
        (message) => {
          console.log(`[WebSocket] 📨 Received message in room ${chatRoomId}:`, message.body);
          try {
            const chatMessage = JSON.parse(message.body) as ChatMessage;
            console.log('[WebSocket] Parsed message:', chatMessage);

            // Add to cache
            if (!this.messageCache.has(chatRoomId)) {
              this.messageCache.set(chatRoomId, []);
            }
            const cachedMessages = this.messageCache.get(chatRoomId)!;

            // Only add if not a duplicate
            if (!chatMessage.id || !cachedMessages.some(m => m.id === chatMessage.id)) {
              cachedMessages.push(chatMessage);

              // Keep cache size reasonable (last 50 messages)
              if (cachedMessages.length > 50) {
                cachedMessages.shift();
              }

              // Update ChatMessageService directly (primary way messages get to UI)
              console.log('[WebSocket] Adding message to ChatMessageService');
              this.chatMessageService.addMessage(chatRoomId, chatMessage);

              // Also broadcast to any other subscribers
              console.log('[WebSocket] Broadcasting message to messageSubject subscribers');
              this.messageSubject.next(chatMessage);
            } else {
              console.log('[WebSocket] Skipping duplicate message with ID:', chatMessage.id);
            }
          } catch (error) {
            console.error('[WebSocket] Error processing message:', error);
          }
        }
      );
      this.activeSubscriptions.set(messageDestination, messageSubscription);
    }

    // Subscribe to typing indicators
    const typingDestination = `/user/chatroom/${chatRoomId}/typing`;
    if (!this.activeSubscriptions.has(typingDestination)) {
      const typingSubscription = this.client.subscribe(
        typingDestination,
        (message) => {
          console.log(`⌨️ Received typing status in room ${chatRoomId}:`, message.body);
          try {
            const typingStatus = JSON.parse(message.body) as TypingStatus;
            this.typingSubject.next(typingStatus);
          } catch (error) {
            console.error('Error parsing typing status:', error);
          }
        }
      );
      this.activeSubscriptions.set(typingDestination, typingSubscription);    }    // First get chat room details to find the project ID

  }

  /**
   * Unsubscribe from a chat room
   * @param chatRoomId The ID of the chat room to unsubscribe from
   */
  unsubscribeFromChatRoom(chatRoomId: number): void {
    const messageDestination = `/user/chatroom/${chatRoomId}/messages`;
    const typingDestination = `/user/chatroom/${chatRoomId}/typing`;

    if (this.activeSubscriptions.has(messageDestination)) {
      this.activeSubscriptions.get(messageDestination).unsubscribe();
      this.activeSubscriptions.delete(messageDestination);
    }

    if (this.activeSubscriptions.has(typingDestination)) {
      this.activeSubscriptions.get(typingDestination).unsubscribe();
      this.activeSubscriptions.delete(typingDestination);
    }
  }

  /**
   * Send a chat message through WebSocket
   * @param chatRoomId The ID of the chat room
   * @param message The message content
   * @returns A promise that resolves when the message is sent
   */
  sendMessage(chatRoomId: number, message: ChatMessage): Promise<void> {
    return new Promise((resolve, reject) => {
          if (!this.client.connected) {
        // Fallback to REST API if WebSocket is not connected
        this.sendMessageViaRest(chatRoomId, message.sender!.idp, message.content).subscribe(
          () => resolve(),
          (error) => reject(error)
        );
        return;
      }try {
        console.log(`📤 Sending message to room ${chatRoomId}:`, message);

        // Format the message object to match what the backend expects via @MessageMapping
        const messagePayload = {
          senderId: message.sender!.idp,
          content: message.content
        };

        this.client.publish({
          destination: `/app/chat.sendMessage/${chatRoomId}`,
          body: JSON.stringify(messagePayload),
          headers: { 'content-type': 'application/json' }
        });

        // Stop typing indicator when message is sent
        this.sendTypingStatus(chatRoomId, message.sender!.idp, false);

        resolve();
      } catch (error) {
        console.error('Error sending message via WebSocket:', error);        // Fallback to REST API with correctly formatted payload
        this.sendMessageViaRest(chatRoomId, message.sender!.idp, message.content).subscribe(
          () => resolve(),
          (error) => reject(error)
        );
      }
    });
  }

  /**
   * Send typing status through WebSocket
   * @param chatRoomId The ID of the chat room
   * @param senderId The ID of the sender
   * @param isTyping Whether the user is currently typing
   */
  sendTypingStatus(chatRoomId: number, senderId: number, isTyping: boolean): void {
    if (!this.client.connected) {
      console.warn('WebSocket not connected. Typing status not sent.');
      return;
    }

    const typingStatus: TypingStatus = {
      senderId,
      typing: isTyping
    };

    try {
      console.log(`⌨️ Sending typing status to room ${chatRoomId}:`, typingStatus);
      this.client.publish({
        destination: `/app/chat.typing/${chatRoomId}`,
        body: JSON.stringify(typingStatus),
        headers: { 'content-type': 'application/json' }
      });
    } catch (error) {
      console.error('Error sending typing status:', error);
    }
  }

  /**
   * Get messages for a chat room (REST API)
   * @param chatRoomId The ID of the chat room
   * @param page Optional page number for pagination (default: 0)
   * @param size Optional page size (default: 20)
   * @returns Observable of paginated messages
   */
  getMessages(chatRoomId: number, page: number = 0, size: number = 20): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/messages/${chatRoomId}?page=${page}&size=${size}`)
      .pipe(
        tap(response => {
          console.log(`🔍 Retrieved messages for room ${chatRoomId}:`, response);

          // Cache the messages
          if (!this.messageCache.has(chatRoomId)) {
            this.messageCache.set(chatRoomId, []);
          }

          // Add messages to cache if not already present
          if (response && response.content) {
            const cachedMessages = this.messageCache.get(chatRoomId)!;
            response.content.forEach((message: ChatMessage) => {
              if (!cachedMessages.some(m => m.id === message.id)) {
                cachedMessages.push(message);
              }
            });
          }
        }),
        catchError(error => {
          console.error('Error getting messages:', error);
          return throwError(error);
        })
      );
  }

  /**
   * Get recent messages for a chat room (REST API)
   * @param chatRoomId The ID of the chat room
   * @returns Observable of recent messages
   */  getRecentMessages(chatRoomId: number): Observable<ChatMessage[]> {
    console.log(`Getting recent messages for room ${chatRoomId}`);

    // First check cache
    if (this.messageCache.has(chatRoomId) && this.messageCache.get(chatRoomId)!.length > 0) {
      const cachedMessages = this.messageCache.get(chatRoomId)!;
      console.log(`Cache hit: Returning ${cachedMessages.length} cached messages for room ${chatRoomId}`, cachedMessages);
      return of(cachedMessages);
    }

    // If not in cache, fetch from API
    console.log(`Cache miss: Fetching messages from API for room ${chatRoomId}`);
    return this.http.get<ChatMessage[]>(`${this.baseUrl}/messages/${chatRoomId}/recent`)
      .pipe(
        tap(messages => {
          console.log(`🔍 API returned ${messages.length} messages for room ${chatRoomId}:`, messages);

          // Cache the messages
          if (!this.messageCache.has(chatRoomId)) {
            this.messageCache.set(chatRoomId, []);
          }

          const cachedMessages = this.messageCache.get(chatRoomId)!;
          messages.forEach(message => {
            if (!cachedMessages.some(m => m.id === message.id)) {
              cachedMessages.push(message);
            }
          });
        }),
        catchError(error => {
          console.error('Error getting recent messages:', error);
          return throwError(error);
        })
      );
  }

  /**
   * Get messages since a specific timestamp (REST API)
   * @param chatRoomId The ID of the chat room
   * @param timestamp ISO-8601 formatted timestamp
   * @returns Observable of messages since the timestamp
   */
  getMessagesSince(chatRoomId: number): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.baseUrl}/messages/${chatRoomId}/since`)
      .pipe(
        tap(messages => {
          console.log(`🔍 Retrieved messages since for room ${chatRoomId}:`, messages);

          // Cache the messages
          if (!this.messageCache.has(chatRoomId)) {
            this.messageCache.set(chatRoomId, []);
          }

          const cachedMessages = this.messageCache.get(chatRoomId)!;
          messages.forEach(message => {
            if (!cachedMessages.some(m => m.id === message.id)) {
              cachedMessages.push(message);
            }
          });
        }),
        catchError(error => {
          console.error('Error getting messages since timestamp:', error);
          return throwError(error);
        })
      );
  }

  /**
   * Send a message via REST API (fallback)
   * @param chatRoomId The ID of the chat room
   * @param senderId The ID of the sender
   * @param message The message content
   * @returns Observable of the created message
   */  private sendMessageViaRest(chatRoomId: number, senderId: number, message: ChatMessage | string): Observable<ChatMessage> {
    const content = typeof message === 'string' ? message : message.content;

    return this.http.post<ChatMessage>(
      `${this.baseUrl}/messages/${chatRoomId}/sender/${senderId}`,
      { content }
    ).pipe(
      tap(response => console.log('Message sent via REST API:', response)),
      catchError(error => {
        console.error('Error sending message via REST API:', error);
        return throwError(error);
      })
    );
  }

  /**
   * Upload a file as a message
   * @param chatRoomId The ID of the chat room
   * @param senderId The ID of the sender
   * @param file The file to upload
   * @returns Observable of the created message with file URL
   */
  uploadFile(chatRoomId: number, senderId: number, file: File): Observable<ChatMessage> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ChatMessage>(
      `${this.baseUrl}/messages/${chatRoomId}/sender/${senderId}/file`,
      formData
    ).pipe(
      tap(message => console.log('File uploaded successfully:', message)),
      catchError(error => {
        console.error('Error uploading file:', error);
        return throwError(error);
      })
    );
  }
  /**
   * Get a chat room by project ID
   * @param projectId The ID of the project
   * @returns Observable of the chat room
   */
  getChatRoomByProjectId(projectId: number): Observable<ChatRoom> {
    // Make sure we're using the correct projectId parameter here, not a chat room ID
    return this.http.get<ChatRoom>(`${this.baseUrl}/rooms/project/${projectId}`)
      .pipe(
        tap(chatRoom => console.log(`Retrieved chat room for project ${projectId}:`, chatRoom)),
        catchError(error => {
          console.error(`Error getting chat room for project ${projectId}:`, error);
          return throwError(error);
        })
      );
  }

  /**
   * Get all chat rooms for a profile
   * @param profileId The ID of the profile
   * @returns Observable of the chat rooms
   */
  getChatRoomsForProfile(profileId: number): Observable<ChatRoom[]> {
    return this.http.get<ChatRoom[]>(`${this.baseUrl}/rooms/profile/${profileId}`)
      .pipe(
        tap(chatRooms => console.log(`Retrieved chat rooms for profile ${profileId}:`, chatRooms)),
        catchError(error => {
          console.error(`Error getting chat rooms for profile ${profileId}:`, error);
          return throwError(error);
        })
      );
  }

  /**
   * Mark a message as read
   * @param messageId The ID of the message
   * @param profileId The ID of the profile marking the message as read
   * @returns Observable of the result
   */
  markMessageAsRead(messageId: number, profileId: number): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/messages/${messageId}/read/${profileId}`,
      {}
    ).pipe(
      tap(() => console.log(`Message ${messageId} marked as read by profile ${profileId}`)),
      catchError(error => {
        console.error('Error marking message as read:', error);
        return throwError(error);
      })
    );
  }

  /**
   * Mark multiple messages as read in a batch operation
   * @param messageIds Array of message IDs
   * @param profileId The ID of the profile marking the messages as read
   * @returns Observable of the result
   */
  markMessagesAsRead(messageIds: number[], profileId: number): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/messages/read-batch/${profileId}`,
      { messageIds }
    ).pipe(
      tap(() => console.log(`${messageIds.length} messages marked as read by profile ${profileId}`)),
      catchError(error => {
        console.error('Error marking multiple messages as read:', error);
        return throwError(error);
      })
    );
  }

  /**
   * Count unread messages in a chat room for a profile
   * @param chatRoomId The ID of the chat room
   * @param profileId The ID of the profile
   * @returns Observable of the unread message count
   */
  countUnreadMessages(chatRoomId: number, profileId: number): Observable<{count: number}> {
    return this.http.get<{count: number}>(`${this.baseUrl}/messages/${chatRoomId}/unread/${profileId}`)
      .pipe(
        tap(result => console.log(`Profile ${profileId} has ${result.count} unread messages in room ${chatRoomId}`)),
        catchError(error => {
          console.error('Error counting unread messages:', error);
          return throwError(error);
        })
      );
  }

  /**
   * Get messages from the cache
   * @param chatRoomId The ID of the chat room
   * @returns Array of cached messages or empty array if none
   */
  getCachedMessages(chatRoomId: number): ChatMessage[] {
    return this.messageCache.get(chatRoomId) || [];
  }

  /**
   * Check if the WebSocket is currently connected
   * @returns Observable boolean indicating connection status
   */
  isConnected(): Observable<boolean> {
    return this.connectionStatus.asObservable();
  }

  /**
   * Get new message notifications
   * @returns Observable of incoming chat messages
   */
  getMessages$(): Observable<ChatMessage> {
    return this.messageSubject.asObservable();
  }

  /**
   * Get typing status notifications
   * @returns Observable of typing status updates
   */
  getTypingStatus$(): Observable<TypingStatus> {
    return this.typingSubject.asObservable();
  }

  /**
   * Disconnect WebSocket client
   */
  disconnect(): void {
    if (this.client) {
      this.client.deactivate();
    }
  }
}
