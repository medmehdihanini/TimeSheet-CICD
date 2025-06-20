package tn.ey.timesheetclient.ChatRoom.dao;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import tn.ey.timesheetclient.ChatRoom.Model.ChatMessage;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    Page<ChatMessage> findByChatRoom_IdOrderByCreatedDateDesc(Long chatRoomId, Pageable pageable);

    List<ChatMessage> findTop20ByChatRoom_IdOrderByCreatedDateDesc(Long chatRoomId);

    @Query("SELECT cm FROM ChatMessage cm WHERE cm.chatRoom.id = :chatRoomId AND cm.createdDate > :since ORDER BY cm.createdDate ASC")
    List<ChatMessage> findMessagesSince(@Param("chatRoomId") Long chatRoomId, @Param("since") LocalDateTime since);    @Query("SELECT COUNT(cm) FROM ChatMessage cm WHERE cm.chatRoom.id = :chatRoomId AND :profileId NOT IN (SELECT p.idp FROM cm.readBy p)")
    long countUnreadMessagesByProfileId(@Param("chatRoomId") Long chatRoomId, @Param("profileId") Long profileId);
    
    List<ChatMessage> findBySender_Idp(Long senderId);
}