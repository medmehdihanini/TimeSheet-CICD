package tn.ey.timesheetclient.ChatRoom.Services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import tn.ey.timesheetclient.ChatRoom.Model.ChatMessage;
import tn.ey.timesheetclient.ChatRoom.Model.ChatRoom;
import tn.ey.timesheetclient.ChatRoom.dao.ChatMessageRepository;
import tn.ey.timesheetclient.ChatRoom.dao.ChatRoomRepository;
import tn.ey.timesheetclient.profile.dao.profileDao;
import tn.ey.timesheetclient.profile.model.Profile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatMessageServiceimpl implements ChatMessageService {

    private final ChatMessageRepository chatMessageRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final profileDao profileRepository;
    private final SimpMessagingTemplate messagingTemplate;
    
    private static final String FILE_UPLOAD_DIR = "uploads/chat-files/";
    
    @Override
    @Transactional
    public ResponseEntity<?> sendTextMessage(Long chatRoomId, Long senderId, String content) {
        try {
            // Find the chat room
            ChatRoom chatRoom = chatRoomRepository.findById(chatRoomId).orElse(null);
            if (chatRoom == null) {
                log.error("Failed to send message: Chat room not found with ID: {}", chatRoomId);
                return ResponseEntity.badRequest().body("Chat room not found");
            }

            // Find the sender
            Profile sender = profileRepository.findById(senderId).orElse(null);
            if (sender == null) {
                log.error("Failed to send message: Profile not found with ID: {}", senderId);
                return ResponseEntity.badRequest().body("Profile not found");
            }

            // Check if sender is a member of the chat room
            if (!chatRoom.getMembers().contains(sender)) {
                log.warn("Profile {} tried to send a message to chat room {} but is not a member", senderId, chatRoomId);
                return ResponseEntity.badRequest().body("You are not a member of this chat room");
            }

            // Create and save the message
            ChatMessage message = ChatMessage.builder()
                    .chatRoom(chatRoom)
                    .sender(sender)
                    .content(content)
                    .createdDate(LocalDateTime.now())
                    .contentType(ChatMessage.MessageContentType.TEXT)
                    .systemMessage(false)
                    .build();
            
            message = chatMessageRepository.save(message);

            // Add sender to readBy list to mark it as read for them
            message.getReadBy().add(sender);
            chatMessageRepository.save(message);            // Notify via WebSocket
            log.info("WebSocket: About to send message to destination: /user/chatroom/{}", chatRoomId);
            log.info("WebSocket: Message payload details - id: {}, sender: {}, timestamp: {}, content type: {}", 
                    message.getId(), 
                    message.getSender() != null ? message.getSender().getIdp() : "null",
                    message.getCreatedDate(),
                    message.getContentType());
                    
            messagingTemplate.convertAndSend("/user/chatroom/" + chatRoomId, message);
            log.info("WebSocket: Message successfully sent via messaging template");
            
            log.info("Message sent by profile {} to chat room {}", senderId, chatRoomId);
            return ResponseEntity.ok(message);
            
        } catch (Exception e) {
            log.error("Error sending message: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error sending message: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public ResponseEntity<?> sendSystemMessage(Long chatRoomId, String content) {
        try {
            // Find the chat room
            ChatRoom chatRoom = chatRoomRepository.findById(chatRoomId).orElse(null);
            if (chatRoom == null) {
                log.error("Failed to send system message: Chat room not found with ID: {}", chatRoomId);
                return ResponseEntity.badRequest().body("Chat room not found");
            }

            // Create and save the message
            ChatMessage message = ChatMessage.builder()
                    .chatRoom(chatRoom)
                    .content(content)
                    .createdDate(LocalDateTime.now())
                    .contentType(ChatMessage.MessageContentType.SYSTEM)
                    .systemMessage(true)
                    .build();
            
            message = chatMessageRepository.save(message);

            // System messages are automatically read by everyone
            chatRoom.getMembers().forEach(message.getReadBy()::add);
            chatMessageRepository.save(message);

            // Notify via WebSocket
            messagingTemplate.convertAndSend("/user/chatroom/" + chatRoomId, message);
            
            log.info("System message sent to chat room {}", chatRoomId);
            return ResponseEntity.ok(message);
            
        } catch (Exception e) {
            log.error("Error sending system message: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error sending system message: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public ResponseEntity<?> uploadFile(Long chatRoomId, Long senderId, MultipartFile file) {
        try {
            // Find the chat room
            ChatRoom chatRoom = chatRoomRepository.findById(chatRoomId).orElse(null);
            if (chatRoom == null) {
                log.error("Failed to upload file: Chat room not found with ID: {}", chatRoomId);
                return ResponseEntity.badRequest().body("Chat room not found");
            }

            // Find the sender
            Profile sender = profileRepository.findById(senderId).orElse(null);
            if (sender == null) {
                log.error("Failed to upload file: Profile not found with ID: {}", senderId);
                return ResponseEntity.badRequest().body("Profile not found");
            }

            // Check if sender is a member of the chat room
            if (!chatRoom.getMembers().contains(sender)) {
                log.warn("Profile {} tried to upload a file to chat room {} but is not a member", senderId, chatRoomId);
                return ResponseEntity.badRequest().body("You are not a member of this chat room");
            }

            // Check if file is empty
            if (file.isEmpty()) {
                log.warn("Empty file uploaded by profile {}", senderId);
                return ResponseEntity.badRequest().body("Cannot upload empty file");
            }

            // Create directory if it doesn't exist
            Path uploadDir = Paths.get(FILE_UPLOAD_DIR + chatRoomId);
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }

            // Create unique filename
            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null) {
                originalFilename = "unknown-file";
            }
            
            String fileExtension = "";
            if (originalFilename.contains(".")) {
                fileExtension = originalFilename.substring(originalFilename.lastIndexOf('.'));
            }
            String uniqueFilename = UUID.randomUUID().toString() + fileExtension;
            Path filePath = uploadDir.resolve(uniqueFilename);

            // Save the file
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Determine content type
            ChatMessage.MessageContentType contentType;
            String fileContentType = file.getContentType();
            if (fileContentType != null && fileContentType.startsWith("image/")) {
                contentType = ChatMessage.MessageContentType.IMAGE;
            } else {
                contentType = ChatMessage.MessageContentType.FILE;
            }

            // Create and save the message
            ChatMessage message = ChatMessage.builder()
                    .chatRoom(chatRoom)
                    .sender(sender)
                    .content("File: " + originalFilename)
                    .createdDate(LocalDateTime.now())
                    .contentType(contentType)
                    .filePath(filePath.toString())
                    .fileName(originalFilename)
                    .fileType(fileContentType)
                    .systemMessage(false)
                    .build();
            
            message = chatMessageRepository.save(message);

            // Add sender to readBy list to mark it as read for them
            message.getReadBy().add(sender);
            chatMessageRepository.save(message);

            // Notify via WebSocket
            messagingTemplate.convertAndSend("/user/chatroom/" + chatRoomId, message);
            
            log.info("File uploaded by profile {} to chat room {}: {}", senderId, chatRoomId, originalFilename);
            return ResponseEntity.ok(message);
            
        } catch (IOException e) {
            log.error("Error uploading file: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error uploading file: " + e.getMessage());
        }
    }

    @Override
    public Page<ChatMessage> getMessages(Long chatRoomId, Pageable pageable) {
        return chatMessageRepository.findByChatRoom_IdOrderByCreatedDateDesc(chatRoomId, pageable);
    }

    @Override
    public List<ChatMessage> getRecentMessages(Long chatRoomId) {
        return chatMessageRepository.findTop20ByChatRoom_IdOrderByCreatedDateDesc(chatRoomId);
    }

    @Override
    public List<ChatMessage> getMessagesSince(Long chatRoomId, LocalDateTime since) {
        return chatMessageRepository.findMessagesSince(chatRoomId, since);
    }

    @Override
    @Transactional
    public ResponseEntity<?> markAsRead(Long messageId, Long profileId) {
        try {
            // Find the message
            ChatMessage message = chatMessageRepository.findById(messageId).orElse(null);
            if (message == null) {
                log.error("Failed to mark message as read: Message not found with ID: {}", messageId);
                return ResponseEntity.badRequest().body("Message not found");
            }

            // Find the profile
            Profile profile = profileRepository.findById(profileId).orElse(null);
            if (profile == null) {
                log.error("Failed to mark message as read: Profile not found with ID: {}", profileId);
                return ResponseEntity.badRequest().body("Profile not found");
            }

            // Check if profile is a member of the chat room
            if (!message.getChatRoom().getMembers().contains(profile)) {
                log.warn("Profile {} tried to mark a message as read in chat room {} but is not a member", 
                        profileId, message.getChatRoom().getId());
                return ResponseEntity.badRequest().body("You are not a member of this chat room");
            }

            // Mark as read
            message.getReadBy().add(profile);
            chatMessageRepository.save(message);
            
            log.debug("Message {} marked as read by profile {}", messageId, profileId);
            return ResponseEntity.ok().build();
            
        } catch (Exception e) {
            log.error("Error marking message as read: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error marking message as read: " + e.getMessage());
        }
    }

    @Override
    public long countUnreadMessages(Long chatRoomId, Long profileId) {
        return chatMessageRepository.countUnreadMessagesByProfileId(chatRoomId, profileId);
    }
}
