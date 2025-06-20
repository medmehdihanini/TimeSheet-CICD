package tn.ey.timesheetclient.ChatRoom.Services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;
import tn.ey.timesheetclient.ChatRoom.Model.ChatMessage;

import java.time.LocalDateTime;
import java.util.List;

public interface ChatMessageService {
    
    /**
     * Send a text message to a chat room
     * 
     * @param chatRoomId The ID of the chat room
     * @param senderId The ID of the sender profile
     * @param content The message content
     * @return ResponseEntity with the created message or error message
     */
    ResponseEntity<?> sendTextMessage(Long chatRoomId, Long senderId, String content);
    
    /**
     * Send a system notification to a chat room (e.g., "Profile X has joined the group")
     * 
     * @param chatRoomId The ID of the chat room
     * @param content The system message content
     * @return ResponseEntity with the created message or error message
     */
    ResponseEntity<?> sendSystemMessage(Long chatRoomId, String content);
    
    /**
     * Upload a file to a chat room
     * 
     * @param chatRoomId The ID of the chat room
     * @param senderId The ID of the sender profile
     * @param file The file to upload
     * @return ResponseEntity with the created message or error message
     */
    ResponseEntity<?> uploadFile(Long chatRoomId, Long senderId, MultipartFile file);
    
    /**
     * Get messages from a chat room, paginated
     * 
     * @param chatRoomId The ID of the chat room
     * @param pageable Pagination parameters
     * @return Page of messages
     */
    Page<ChatMessage> getMessages(Long chatRoomId, Pageable pageable);
    
    /**
     * Get the 20 most recent messages from a chat room
     * 
     * @param chatRoomId The ID of the chat room
     * @return List of messages
     */
    List<ChatMessage> getRecentMessages(Long chatRoomId);
    
    /**
     * Get new messages since a specific time
     * 
     * @param chatRoomId The ID of the chat room
     * @param since The timestamp to get messages since
     * @return List of messages
     */
    List<ChatMessage> getMessagesSince(Long chatRoomId, LocalDateTime since);
    
    /**
     * Mark messages as read for a profile
     * 
     * @param messageId The ID of the message
     * @param profileId The ID of the profile that read the message
     * @return ResponseEntity with success or error message
     */
    ResponseEntity<?> markAsRead(Long messageId, Long profileId);
    
    /**
     * Count unread messages for a profile in a chat room
     * 
     * @param chatRoomId The ID of the chat room
     * @param profileId The ID of the profile
     * @return Number of unread messages
     */
    long countUnreadMessages(Long chatRoomId, Long profileId);
}
