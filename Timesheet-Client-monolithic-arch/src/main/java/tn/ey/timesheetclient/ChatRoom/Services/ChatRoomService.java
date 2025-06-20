package tn.ey.timesheetclient.ChatRoom.Services;

import org.springframework.http.ResponseEntity;
import tn.ey.timesheetclient.ChatRoom.Model.ChatRoom;

import java.util.List;
import java.util.Optional;

public interface ChatRoomService {
    
    /**
     * Create a new chat room for a project
     * 
     * @param projectId The ID of the project
     * @param creatorId The ID of the user creating the chat room (project manager)
     * @return ResponseEntity with the created chat room or error message
     */
    ResponseEntity<?> createChatRoom(Long projectId, Long creatorId);
    
    /**
     * Add a profile to a chat room
     * 
     * @param chatRoomId The ID of the chat room
     * @param profileId The ID of the profile to add
     * @return ResponseEntity with success or error message
     */
    ResponseEntity<?> addProfileToChatRoom(Long chatRoomId, Long profileId);
    
    /**
     * Remove a profile from a chat room
     * 
     * @param chatRoomId The ID of the chat room
     * @param profileId The ID of the profile to remove
     * @return ResponseEntity with success or error message
     */
    ResponseEntity<?> removeProfileFromChatRoom(Long chatRoomId, Long profileId);
    
    /**
     * Get a chat room by project ID
     * 
     * @param projectId The ID of the project
     * @return Optional containing the chat room if found
     */
    Optional<ChatRoom> getChatRoomByProjectId(Long projectId);
    
    /**
     * Get all chat rooms that a profile is a member of
     * 
     * @param profileId The ID of the profile
     * @return List of chat rooms
     */
    List<ChatRoom> getChatRoomsByProfileId(Long profileId);
    
    /**
     * Check if a profile is a member of a chat room
     * 
     * @param chatRoomId The ID of the chat room
     * @param profileId The ID of the profile
     * @return true if the profile is a member, false otherwise
     */
    boolean isProfileMemberOfChatRoom(Long chatRoomId, Long profileId);
      /**
     * Send a system message to a chat room
     * 
     * @param chatRoomId The ID of the chat room
     * @param content The system message content
     */
    default void sendSystemMessage(Long chatRoomId, String content) {
        // This will be implemented by the service class
    }
    
    /**
     * Delete a chat room associated with a project
     * 
     * @param projectId The ID of the project
     * @return true if the chat room was deleted, false otherwise
     */
    boolean deleteChatRoomByProjectId(Long projectId);
}
