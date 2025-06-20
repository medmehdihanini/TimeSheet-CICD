package tn.ey.timesheetclient.ChatRoom.Services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.ey.timesheetclient.ChatRoom.Model.ChatRoom;
import tn.ey.timesheetclient.ChatRoom.dao.ChatRoomRepository;
import tn.ey.timesheetclient.profile.dao.profileDao;
import tn.ey.timesheetclient.profile.model.Profile;
import tn.ey.timesheetclient.program.dao.ProjectDao;
import tn.ey.timesheetclient.program.model.Project;
import tn.ey.timesheetclient.user.dao.UserRepository;
import tn.ey.timesheetclient.user.model.User;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatRoomServiceImpl implements ChatRoomService {

    private final ChatRoomRepository chatRoomRepository;
    private final ProjectDao projectDao;
    private final UserRepository userRepository;
    private final profileDao profileRepository;
    private final ChatMessageService chatMessageService;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional
    public ResponseEntity<?> createChatRoom(Long projectId, Long creatorId) {
        try {
            // Check if chat room already exists for this project
            Optional<ChatRoom> existingChatRoom = chatRoomRepository.findByProject_Idproject(projectId);
            if (existingChatRoom.isPresent()) {
                log.info("Chat room already exists for project with ID: {}", projectId);
                return ResponseEntity.ok(existingChatRoom.get());
            }

            // Find the project
            Project project = projectDao.findById(projectId).orElse(null);
            if (project == null) {
                log.error("Failed to create chat room: Project not found with ID: {}", projectId);
                return ResponseEntity.badRequest().body("Project not found");
            }

            // Find the creator (project manager)
            User creator = userRepository.findById(creatorId).orElse(null);
            if (creator == null) {
                log.error("Failed to create chat room: User not found with ID: {}", creatorId);
                return ResponseEntity.badRequest().body("User not found");
            }

            // Create the chat room
            ChatRoom chatRoom = ChatRoom.builder()
                    .name("Project Chat: " + project.getName())
                    .description("Chat room for project: " + project.getName())
                    .createdDate(LocalDateTime.now())
                    .creator(creator)
                    .project(project)
                    .build();

            // Save the chat room
            chatRoom = chatRoomRepository.save(chatRoom);

            // Add project manager to the chat room if they have a profile
            if (creator.getProfile() != null) {
                Profile managerProfile = profileRepository.findById(creator.getProfile().getIdp()).orElse(null);
                if (managerProfile != null) {
                    chatRoom.addMember(managerProfile);
                    chatRoomRepository.save(chatRoom);
                    
                    // Send a system message
                    chatMessageService.sendSystemMessage(chatRoom.getId(), 
                        "Chat room created by " + managerProfile.getFirstname() + " " + managerProfile.getLastname());
                }
            }

            // Log success
            log.info("Chat room created successfully for project: {}", project.getName());
            
            // Notify via WebSocket
            messagingTemplate.convertAndSend("/project/" + projectId, 
                    Map.of("type", "CHAT_ROOM_CREATED", "chatRoomId", chatRoom.getId()));
            
            return ResponseEntity.ok(chatRoom);
            
        } catch (Exception e) {
            log.error("Error creating chat room: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error creating chat room: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public ResponseEntity<?> addProfileToChatRoom(Long chatRoomId, Long profileId) {
        try {
            // Find the chat room
            ChatRoom chatRoom = chatRoomRepository.findById(chatRoomId).orElse(null);
            if (chatRoom == null) {
                log.error("Failed to add profile: Chat room not found with ID: {}", chatRoomId);
                return ResponseEntity.badRequest().body("Chat room not found");
            }

            // Find the profile
            Profile profile = profileRepository.findById(profileId).orElse(null);
            if (profile == null) {
                log.error("Failed to add profile: Profile not found with ID: {}", profileId);
                return ResponseEntity.badRequest().body("Profile not found");
            }

            // Check if profile is already a member
            if (chatRoom.getMembers().contains(profile)) {
                return ResponseEntity.ok().body("Profile is already a member of this chat room");
            }

            // Add profile to chat room
            chatRoom.addMember(profile);
            chatRoomRepository.save(chatRoom);

            // Send a system message
            chatMessageService.sendSystemMessage(chatRoomId, 
                profile.getFirstname() + " " + profile.getLastname() + " has joined the chat");

            // Log success
            log.info("Profile {} {} added to chat room: {}", 
                profile.getFirstname(), profile.getLastname(), chatRoom.getName());
            
            // Notify via WebSocket
            messagingTemplate.convertAndSend("/project/" + chatRoom.getProject().getIdproject(), 
                    Map.of(
                        "type", "MEMBER_ADDED", 
                        "chatRoomId", chatRoomId,
                        "profileId", profileId,
                        "profileName", profile.getFirstname() + " " + profile.getLastname()
                    ));

            return ResponseEntity.ok().body("Profile added to chat room successfully");
            
        } catch (Exception e) {
            log.error("Error adding profile to chat room: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error adding profile to chat room: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public ResponseEntity<?> removeProfileFromChatRoom(Long chatRoomId, Long profileId) {
        try {
            // Find the chat room
            ChatRoom chatRoom = chatRoomRepository.findById(chatRoomId).orElse(null);
            if (chatRoom == null) {
                log.error("Failed to remove profile: Chat room not found with ID: {}", chatRoomId);
                return ResponseEntity.badRequest().body("Chat room not found");
            }

            // Find the profile
            Profile profile = profileRepository.findById(profileId).orElse(null);
            if (profile == null) {
                log.error("Failed to remove profile: Profile not found with ID: {}", profileId);
                return ResponseEntity.badRequest().body("Profile not found");
            }

            // Check if profile is a member
            if (!chatRoom.getMembers().contains(profile)) {
                return ResponseEntity.badRequest().body("Profile is not a member of this chat room");
            }

            // Save profile name for notification before removing
            String profileName = profile.getFirstname() + " " + profile.getLastname();
            
            // Remove profile from chat room
            chatRoom.removeMember(profile);
            chatRoomRepository.save(chatRoom);

            // Send a system message
            chatMessageService.sendSystemMessage(chatRoomId, profileName + " has left the chat");

            // Log success
            log.info("Profile {} removed from chat room: {}", profileName, chatRoom.getName());
            
            // Notify via WebSocket
            messagingTemplate.convertAndSend("/project/" + chatRoom.getProject().getIdproject(), 
                    Map.of(
                        "type", "MEMBER_REMOVED", 
                        "chatRoomId", chatRoomId,
                        "profileId", profileId,
                        "profileName", profileName
                    ));

            return ResponseEntity.ok().body("Profile removed from chat room successfully");
            
        } catch (Exception e) {
            log.error("Error removing profile from chat room: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error removing profile from chat room: " + e.getMessage());
        }
    }

    @Override
    public Optional<ChatRoom> getChatRoomByProjectId(Long projectId) {
        return chatRoomRepository.findByProject_Idproject(projectId);
    }

    @Override
    public List<ChatRoom> getChatRoomsByProfileId(Long profileId) {
        return chatRoomRepository.findByMembersContaining(profileId);
    }

    @Override
    public boolean isProfileMemberOfChatRoom(Long chatRoomId, Long profileId) {
        return chatRoomRepository.isProfileMemberOfChatRoom(chatRoomId, profileId);
    }    @Override
    public void sendSystemMessage(Long chatRoomId, String content) {
        try {
            chatMessageService.sendSystemMessage(chatRoomId, content);
        } catch (Exception e) {
            log.error("Error sending system message to chat room {}: {}", chatRoomId, e.getMessage(), e);
        }
    }
    
    @Override
    @Transactional
    public boolean deleteChatRoomByProjectId(Long projectId) {
        try {
            Optional<ChatRoom> chatRoomOpt = chatRoomRepository.findByProject_Idproject(projectId);
            if (chatRoomOpt.isPresent()) {
                ChatRoom chatRoom = chatRoomOpt.get();
                
                // Send a system message before deletion
                try {
                    sendSystemMessage(chatRoom.getId(), 
                        "This chat room is being closed because the associated project has been deleted");
                } catch (Exception e) {
                    log.warn("Could not send system message before deletion: {}", e.getMessage());
                }
                
                // Break the foreign key connection
                chatRoom.setProject(null);
                
                // Delete chat messages first
                chatRoom.getMessages().clear();
                
                // Save the updated chat room with no project reference
                chatRoomRepository.save(chatRoom);
                
                // Delete the chat room
                chatRoomRepository.delete(chatRoom);
                
                return true;
            }
            return false;
        } catch (Exception e) {
            log.error("Error deleting chat room for project {}: {}", projectId, e.getMessage(), e);
            return false;
        }
    }
}
