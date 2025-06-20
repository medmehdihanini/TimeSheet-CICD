package tn.ey.timesheetclient.ChatRoom.Controller;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import tn.ey.timesheetclient.ChatRoom.Model.ChatMessage;
import tn.ey.timesheetclient.ChatRoom.Model.ChatRoom;
import tn.ey.timesheetclient.ChatRoom.Services.ChatMessageService;
import tn.ey.timesheetclient.ChatRoom.Services.ChatRoomService;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/chat")
@AllArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:4200")
public class ChatController {
    
    private final ChatRoomService chatRoomService;
    private final ChatMessageService chatMessageService;
    private final SimpMessagingTemplate messagingTemplate;

    // Chat Room Endpoints
    
    @GetMapping("/rooms/project/{projectId}")
    public ResponseEntity<?> getChatRoomByProjectId(@PathVariable Long projectId) {
        Optional<ChatRoom> chatRoom = chatRoomService.getChatRoomByProjectId(projectId);
        if (chatRoom.isPresent()) {
            return ResponseEntity.ok(chatRoom.get());
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Chat room not found for project");
        }
    }
    
    @GetMapping("/rooms/profile/{profileId}")
    public ResponseEntity<?> getChatRoomsByProfileId(@PathVariable Long profileId) {
        log.info("Received request to get chat rooms for profileId: {}", profileId);
        try {
            List<ChatRoom> chatRooms = chatRoomService.getChatRoomsByProfileId(profileId);
            log.info("Found {} chat rooms for profileId: {}", chatRooms.size(), profileId);
            return ResponseEntity.ok(chatRooms);
        } catch (Exception e) {
            log.error("Error getting chat rooms for profileId {}: {}", profileId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error getting chat rooms: " + e.getMessage());
        }
    }
    
    @PostMapping("/rooms/project/{projectId}/creator/{creatorId}")
    public ResponseEntity<?> createChatRoom(@PathVariable Long projectId, @PathVariable Long creatorId) {
        return chatRoomService.createChatRoom(projectId, creatorId);
    }
    
    @PostMapping("/rooms/{chatRoomId}/members/{profileId}")
    public ResponseEntity<?> addProfileToChatRoom(@PathVariable Long chatRoomId, @PathVariable Long profileId) {
        return chatRoomService.addProfileToChatRoom(chatRoomId, profileId);
    }
    
    @DeleteMapping("/rooms/{chatRoomId}/members/{profileId}")
    public ResponseEntity<?> removeProfileFromChatRoom(@PathVariable Long chatRoomId, @PathVariable Long profileId) {
        return chatRoomService.removeProfileFromChatRoom(chatRoomId, profileId);
    }
    
    // Message Endpoints
    
    @GetMapping("/messages/{chatRoomId}")
    public ResponseEntity<?> getMessages(
            @PathVariable Long chatRoomId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Page<ChatMessage> messages = chatMessageService.getMessages(
                chatRoomId, 
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdDate")));
        
        return ResponseEntity.ok(messages);
    }
    
    @GetMapping("/messages/{chatRoomId}/recent")
    public ResponseEntity<?> getRecentMessages(@PathVariable Long chatRoomId) {
        List<ChatMessage> messages = chatMessageService.getRecentMessages(chatRoomId);
        return ResponseEntity.ok(messages);
    }
    
    @GetMapping("/messages/{chatRoomId}/since")
    public ResponseEntity<?> getMessagesSince(
            @PathVariable Long chatRoomId,
            @RequestParam String timestamp) {
        
        LocalDateTime since = LocalDateTime.parse(timestamp);
        List<ChatMessage> messages = chatMessageService.getMessagesSince(chatRoomId, since);
        return ResponseEntity.ok(messages);
    }
    
    @PostMapping("/messages/{chatRoomId}/sender/{senderId}")
    public ResponseEntity<?> sendMessage(
            @PathVariable Long chatRoomId,
            @PathVariable Long senderId,
            @RequestBody Map<String, String> payload) {
        
        String content = payload.get("content");
        if (content == null || content.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Message content cannot be empty");
        }
        
        return chatMessageService.sendTextMessage(chatRoomId, senderId, content);
    }
    
    @PostMapping("/messages/{chatRoomId}/sender/{senderId}/file")
    public ResponseEntity<?> uploadFile(
            @PathVariable Long chatRoomId,
            @PathVariable Long senderId,
            @RequestParam("file") MultipartFile file) {
        
        return chatMessageService.uploadFile(chatRoomId, senderId, file);
    }
    
    @PostMapping("/messages/{messageId}/read/{profileId}")
    public ResponseEntity<?> markAsRead(
            @PathVariable Long messageId,
            @PathVariable Long profileId) {
        
        return chatMessageService.markAsRead(messageId, profileId);
    }
    
    @GetMapping("/messages/{chatRoomId}/unread/{profileId}")
    public ResponseEntity<?> countUnreadMessages(
            @PathVariable Long chatRoomId,
            @PathVariable Long profileId) {
        
        long count = chatMessageService.countUnreadMessages(chatRoomId, profileId);
        return ResponseEntity.ok(Map.of("count", count));
    }
    
    // WebSocket message handling
      @MessageMapping("/chat.sendMessage/{chatRoomId}")
    public void processMessage(@DestinationVariable Long chatRoomId, @Payload Map<String, Object> messageMap) {
        try {
            log.info("WebSocket: Received message for chatRoomId: {}, message data: {}", chatRoomId, messageMap);
            Long senderId = Long.valueOf(messageMap.get("senderId").toString());
            String content = messageMap.get("content").toString();
            
            log.info("WebSocket: Processing message from senderId: {} with content: {}", senderId, content);
            
            // Save the message to database
            ResponseEntity<?> response = chatMessageService.sendTextMessage(chatRoomId, senderId, content);
            log.info("WebSocket: Message saved to database with response status: {}", response.getStatusCode());
            
            // Notifying typing status ended
            Map<String, Object> typingStatus = new HashMap<>();
            typingStatus.put("senderId", senderId);
            typingStatus.put("typing", false);
            
            log.info("WebSocket: Sending typing status update to /user/chatroom/{}/typing", chatRoomId);
            messagingTemplate.convertAndSend("/user/chatroom/" + chatRoomId + "/typing", typingStatus);
            log.info("WebSocket: Typing status update sent successfully");
        } catch (Exception e) {
            log.error("Error processing WebSocket message: {}", e.getMessage(), e);
        }
    }
    
    @MessageMapping("/chat.typing/{chatRoomId}")
    public void typingIndicator(@DestinationVariable Long chatRoomId, @Payload Map<String, Object> typingStatus) {
        messagingTemplate.convertAndSend("/user/chatroom/" + chatRoomId + "/typing", typingStatus);
    }
}
