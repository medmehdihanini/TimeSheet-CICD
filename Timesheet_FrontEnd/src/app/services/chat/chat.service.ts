import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of, throwError, forkJoin } from 'rxjs';
import { catchError, finalize, map, switchMap, take, tap } from 'rxjs/operators';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

import { ChatWebSocketService } from './chat-websocket.service';
import { ChatStateService, ChatErrorType } from './chat-state.service';
import { UserserviceService } from '../user/userservice.service';
import { ChatMessageService } from './chat-message.service';

import { ChatRoom } from '../../models/chat/ChatRoom';
import { ChatMessage, ContentType } from '../../models/chat/ChatMessage';
import { TypingStatus } from '../../models/chat/TypingStatus';
import { Profile } from '../../models/chat/ChatParticipant';
import { FileAttachment } from '../../models/chat/FileAttachment';
import { ProfileId } from '../../models/chat/ProfileId';

/**
 * Main service for chat functionality that combines WebSocket and state management
 */
@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private baseUrl = 'http://localhost:8083/api/v1/chat';
  private loadingSubject = new BehaviorSubject<boolean>(false);
  constructor(
    private chatWebSocketService: ChatWebSocketService,
    private chatStateService: ChatStateService,
    private userService: UserserviceService,
    private http: HttpClient,
    private chatMessageService: ChatMessageService
  ) {
    // Subscribe to incoming messages from WebSocket
    this.chatWebSocketService.getMessages$().subscribe({
      next: (message) => {
        console.log('[ChatService] New message received:', message);

        try {
          // Ensure the message has necessary data
          if (!message) {
            console.error('[ChatService] Received null or undefined message');
            return;
          }

          if (!message.chatRoom || !message.chatRoom.id) {
            console.error('[ChatService] Message missing chatRoom or chatRoom.id:', message);
            return;
          }

          // Update messages in the ChatMessageService to trigger UI updates
          console.log(`[ChatService] Adding message to room ${message.chatRoom.id}:`, message);
          this.chatMessageService.addMessage(message.chatRoom.id, message);

          // If a typing user sends a message, remove them from typing list
          if (message.sender) {
            const activeRoom = this.chatStateService.getActiveChatRoom().pipe(take(1));
            activeRoom.subscribe(room => {
              if (room && room.id === message.chatRoom.id) {
                this.chatStateService.updateTypingStatus(
                  room.id,
                  { senderId: message.sender!.idp, typing: false },
                  room.members
                );
              }
            });
          }
        } catch (error) {
          console.error('[ChatService] Error processing message:', error);
        }
      },
      error: (error) => {
        console.error('[ChatService] Error from message subscription:', error);
      }
    });

    // Subscribe to typing status updates
    this.chatWebSocketService.getTypingStatus$().subscribe(typingStatus => {
      console.log('Typing status update:', typingStatus);

      const activeRoom = this.chatStateService.getActiveChatRoom().pipe(take(1));
      activeRoom.subscribe(room => {
        if (room) {
          this.chatStateService.updateTypingStatus(
            room.id,
            typingStatus,
            room.members
          );
        }
      });
    });
  }

  /**
   * Load and initialize chat rooms for the current user
   * @returns Observable of available chat rooms
   */  initializeUserChatRooms(profileId?: number): Observable<ChatRoom[]> {
    this.loadingSubject.next(true);

    // If profileId is not provided, try to get it from the current user
    if (!profileId) {
      const currentUser = this.userService.getUserConnected();
      if (!currentUser) {
        this.chatStateService.logError(
          ChatErrorType.ROOM_FETCH,
          'No user is currently logged in'
        );
        this.loadingSubject.next(false);
        return throwError('User not authenticated');
      }      // Get matching profile ID
      return this.userService.getMatchingProfileId(currentUser.id).pipe(
        switchMap((profileData: ProfileId) => {
          const profileId = profileData.idp;
          return this.loadChatRooms(profileId);
        }),
        catchError(error => {
          this.chatStateService.logError(
            ChatErrorType.ROOM_FETCH,
            'Failed to get matching profile ID',
            error
          );
          this.loadingSubject.next(false);
          return throwError(error);
        })
      );
    }

    // If profileId is provided, use it directly
    return this.loadChatRooms(profileId);
  }

  /**
   * Private method to load chat rooms using a profile ID
   * @param profileId The profile ID to load rooms for
   * @returns Observable of available chat rooms
   */
  private loadChatRooms(profileId: number): Observable<ChatRoom[]> {    return this.chatWebSocketService.getChatRoomsForProfile(profileId).pipe(
      tap(chatRooms => {
        this.chatStateService.setChatRooms(chatRooms);
        console.log('Loaded chat rooms for profile ID:', profileId, chatRooms);

        // Subscribe to each chat room
        chatRooms.forEach(room => {
          this.chatWebSocketService.subscribeToChatRoom(room.id);
        });
      }),
      catchError(error => {
        this.chatStateService.logError(
          ChatErrorType.ROOM_FETCH,
          'Failed to load chat rooms',
          error
        );
        return throwError(error);
      }),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  /**
   * Activate a chat room and load its messages
   * @param roomId The ID of the chat room to activate
   * @returns Observable of chat messages
   */
  activateChatRoom(roomId: number, projectId?: number): Observable<ChatMessage[]> {
    this.loadingSubject.next(true);

    // First, get the chat room details
    const rooms = this.chatStateService.getCurrentChatRooms();
    const room = rooms.find(r => r.id === roomId);

    if (!room) {
      if (!projectId) {
        return throwError('Room not found and no project ID provided');
      }
      return this.chatWebSocketService.getChatRoomByProjectId(projectId).pipe(
        tap(fetchedRoom => {
          this.chatStateService.setActiveChatRoom(fetchedRoom);
          this.chatWebSocketService.subscribeToChatRoom(fetchedRoom.id);
        }),
        switchMap(fetchedRoom => this.loadMessagesForRoom(fetchedRoom.id)),
        catchError(error => {
          this.chatStateService.logError(
            ChatErrorType.ROOM_FETCH,
            'Failed to activate chat room',
            error
          );
          return throwError(error);
        }),
        finalize(() => this.loadingSubject.next(false))
      );
    } else {
      this.chatStateService.setActiveChatRoom(room);
      return this.loadMessagesForRoom(roomId).pipe(
        finalize(() => this.loadingSubject.next(false))
      );
    }
  }

  /**
   * Load messages for a chat room
   * @param roomId The ID of the chat room
   * @returns Observable of chat messages
   */
  private loadMessagesForRoom(roomId: number): Observable<ChatMessage[]> {
    // First check if we have cached messages
    const cachedMessages = this.chatWebSocketService.getCachedMessages(roomId);

    if (cachedMessages.length > 0) {
      console.log('Using cached messages for room:', roomId);
      return of(cachedMessages);
    }

    return this.chatWebSocketService.getRecentMessages(roomId).pipe(
      catchError(error => {
        this.chatStateService.logError(
          ChatErrorType.MESSAGE_FETCH,
          'Failed to load messages',
          error
        );
        return throwError(error);
      })
    );
  }

  /**
   * Load more messages for the active chat room (pagination)
   * @param page The page number to load
   * @param size The number of messages per page
   * @returns Observable of the paginated message response
   */
  loadMoreMessages(page: number = 1, size: number = 20): Observable<any> {
    return this.chatStateService.getActiveChatRoom().pipe(
      take(1),
      switchMap(room => {
        if (!room) {
          return throwError('No active chat room');
        }

        this.loadingSubject.next(true);
        return this.chatWebSocketService.getMessages(room.id, page, size).pipe(
          finalize(() => this.loadingSubject.next(false))
        );
      }),
      catchError(error => {
        this.chatStateService.logError(
          ChatErrorType.MESSAGE_FETCH,
          'Failed to load more messages',
          error
        );
        return throwError(error);
      })
    );
  }
  /**
   * Send a text message in the active chat room
   * @param content The message content
   * @returns Promise that resolves when the message is sent
   */
  sendMessage(content: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const currentUser = this.userService.getUserConnected();
      if (!currentUser) {
        this.chatStateService.logError(
          ChatErrorType.MESSAGE_SEND,
          'Cannot send message: User not authenticated'
        );
        reject('User not authenticated');
        return;
      }

      this.userService.getMatchingProfileId(currentUser.id).subscribe({
        next: (profileData: ProfileId) => {
          const profileId = profileData.idp;

          this.chatStateService.getActiveChatRoom().pipe(
            take(1)
          ).subscribe(
            room => {
              if (!room) {
                this.chatStateService.logError(
                  ChatErrorType.MESSAGE_SEND,
                  'Cannot send message: No active chat room'
                );
                reject('No active chat room');
                return;
              }

              // Find the profile that corresponds to the current user
              const senderProfile = room.members.find(m => m.idp === profileId);
              if (!senderProfile) {
                this.chatStateService.logError(
                  ChatErrorType.MESSAGE_SEND,
                  'Cannot send message: Current user is not a member of this chat room'
                );
                reject('User is not a member of this chat room');
                return;
              }

              const message: ChatMessage = {
                chatRoom: { id: room.id },
                sender: senderProfile,
                content: content,
                contentType: ContentType.TEXT,
                systemMessage: false,
                readBy: [senderProfile] // Mark as read by sender
              };

              this.chatWebSocketService.sendMessage(room.id, message)
                .then(() => resolve())
                .catch(error => {
                  this.chatStateService.logError(
                    ChatErrorType.MESSAGE_SEND,
                    'Failed to send message',
                    error
                  );
                  reject(error);
                });
            },
            error => {
              this.chatStateService.logError(
                ChatErrorType.MESSAGE_SEND,
                'Failed to get active chat room',
                error
              );
              reject(error);
            }
          );
        },
        error: (err) => {
          this.chatStateService.logError(
            ChatErrorType.MESSAGE_SEND,
            'Failed to get matching profile ID',
            err
          );
          reject(err);
        }
      });
    });
  }

  /**
   * Send typing status for the current user
   * @param isTyping Whether the user is typing
   */
  sendTypingStatus(isTyping: boolean): void {
    const currentUser = this.userService.getUserConnected();
    if (!currentUser) {
      return;
    }

    // Only send typing updates if enough time has passed since last update
    if (!this.chatStateService.trackUserActivity(currentUser.id) && isTyping) {
      return;
    }

    this.userService.getMatchingProfileId(currentUser.id).subscribe({
      next: (profileData: ProfileId) => {
        const profileId = profileData.idp;

        this.chatStateService.getActiveChatRoom().pipe(
          take(1)
        ).subscribe(
          room => {
            if (room) {
              this.chatWebSocketService.sendTypingStatus(room.id, profileId, isTyping);
            }
          }
        );
      },
      error: (err) => {
        console.error('Error getting profile ID for typing status:', err);
      }
    });
  }

  /**
   * Upload a file in the active chat room
   * @param file The file to upload
   * @returns Observable of the created message
   */
  uploadFile(file: File): Observable<ChatMessage> {
    const currentUser = this.userService.getUserConnected();
    if (!currentUser) {
      this.chatStateService.logError(
        ChatErrorType.FILE_UPLOAD,
        'Cannot upload file: User not authenticated'
      );
      return throwError('User not authenticated');
    }

    return this.userService.getMatchingProfileId(currentUser.id).pipe(
      switchMap((profileData: ProfileId) => {
        const profileId = profileData.idp;

        return this.chatStateService.getActiveChatRoom().pipe(
          take(1),
          switchMap(room => {
            if (!room) {
              this.chatStateService.logError(
                ChatErrorType.FILE_UPLOAD,
                'Cannot upload file: No active chat room'
              );
              return throwError('No active chat room');
            }

            this.loadingSubject.next(true);
            return this.chatWebSocketService.uploadFile(room.id, profileId, file).pipe(
              tap(message => {
                console.log('File uploaded successfully:', message);
              }),
              catchError(error => {
                this.chatStateService.logError(
                  ChatErrorType.FILE_UPLOAD,
                  'Failed to upload file',
                  error
                );
                return throwError(error);
              }),
              finalize(() => this.loadingSubject.next(false))
            );
          })
        );
      }),
      catchError(error => {
        this.chatStateService.logError(
          ChatErrorType.FILE_UPLOAD,
          'Failed to get matching profile ID',
          error
        );
        return throwError(error);
      })
    );
  }

  /**
   * Mark a message as read
   * @param messageId The ID of the message
   * @returns Observable of the operation result
   */
  markMessageAsRead(messageId: number): Observable<any> {
    const currentUser = this.userService.getUserConnected();
    if (!currentUser) {
      return throwError('User not authenticated');
    }

    return this.userService.getMatchingProfileId(currentUser.id).pipe(
      switchMap((profileData: ProfileId) => {
        const profileId = profileData.idp;
        return this.chatWebSocketService.markMessageAsRead(messageId, profileId).pipe(
          catchError(error => {
            console.error('Error marking message as read:', error);
            return throwError(error);
          })
        );
      }),
      catchError(error => {
        console.error('Error getting profile ID:', error);
        return throwError(error);
      })
    );
  }

  /**
   * Mark multiple messages as read in a batch
   * @param messageIds Array of message IDs to mark as read
   * @returns Observable of the operation result
   */
  markMessagesAsRead(messageIds: number[]): Observable<any> {
    const currentUser = this.userService.getUserConnected();
    if (!currentUser) {
      return throwError('User not authenticated');
    }

    return this.userService.getMatchingProfileId(currentUser.id).pipe(
      switchMap((profileData: ProfileId) => {
        const profileId = profileData.idp;
        return this.chatWebSocketService.markMessagesAsRead(messageIds, profileId).pipe(
          catchError(error => {
            console.error('Error marking messages as read:', error);
            return throwError(error);
          })
        );
      }),
      catchError(error => {
        console.error('Error getting profile ID:', error);
        return throwError(error);
      })
    );
  }

  /**
   * Get count of unread messages for each chat room
   * @returns Observable of a map of room IDs to unread counts
   */
  getUnreadMessageCounts(): Observable<Map<number, number>> {
    const currentUser = this.userService.getUserConnected();
    if (!currentUser) {
      return throwError('User not authenticated');
    }

    return this.userService.getMatchingProfileId(currentUser.id).pipe(
      switchMap((profileData: ProfileId) => {
        const profileId = profileData.idp;

        const rooms = this.chatStateService.getCurrentChatRooms();
        if (rooms.length === 0) {
          return of(new Map<number, number>());
        }

        // Create an array of observables for each room's unread count
        const countObservables = rooms.map(room =>
          this.chatWebSocketService.countUnreadMessages(room.id, profileId).pipe(
            map(result => ({ roomId: room.id, count: result.count })),
            catchError(error => {
              console.error(`Error counting unread messages for room ${room.id}:`, error);
              return of({ roomId: room.id, count: 0 });
            })
          )
        );

        // Combine all count observables
        return forkJoin(countObservables).pipe(
          map(results => {
            const countMap = new Map<number, number>();
            results.forEach(result => {
              countMap.set(result.roomId, result.count);
            });
            return countMap;
          })
        );
      }),
      catchError(error => {
        console.error('Error getting profile ID for unread counts:', error);
        return of(new Map<number, number>());
      })
    );
  }

  /**
   * Get typing users in the active chat room
   * @returns Observable of profiles currently typing
   */
  getTypingUsers(): Observable<Profile[]> {
    return this.chatStateService.getActiveChatRoom().pipe(
      switchMap(room => {
        if (!room) {
          return of([]);
        }
        return this.chatStateService.getTypingUsers(room.id);
      })
    );
  }

  /**
   * Get active chat room
   * @returns Observable of the active chat room
   */
  getActiveChatRoom(): Observable<ChatRoom | null> {
    return this.chatStateService.getActiveChatRoom();
  }

  /**
   * Get all available chat rooms
   * @returns Observable of all available chat rooms
   */
  getChatRooms(): Observable<ChatRoom[]> {
    return this.chatStateService.getChatRooms();
  }

  /**
   * Get loading state
   * @returns Observable boolean indicating if any operations are loading
   */
  isLoading(): Observable<boolean> {
    return this.loadingSubject.asObservable();
  }

  /**
   * Get error notifications
   * @returns Observable of chat errors
   */
  getErrors() {
    return this.chatStateService.getErrors();
  }

  /**
   * Check if WebSocket is connected
   * @returns Observable boolean of connection status
   */
  isConnected(): Observable<boolean> {
    return this.chatWebSocketService.isConnected();
  }

  /**
   * Clean up resources when component is destroyed
   */
  ngOnDestroy(): void {
    this.chatWebSocketService.disconnect();
  }
}
