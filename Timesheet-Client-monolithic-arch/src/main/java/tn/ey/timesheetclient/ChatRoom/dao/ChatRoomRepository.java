package tn.ey.timesheetclient.ChatRoom.dao;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import tn.ey.timesheetclient.ChatRoom.Model.ChatRoom;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
    Optional<ChatRoom> findByProject_Idproject(Long projectId);

    List<ChatRoom> findByCreator_Id(Long creatorId);

    @Query("SELECT cr FROM ChatRoom cr JOIN cr.members m WHERE m.idp = :profileId")
    List<ChatRoom> findByMembersContaining(@Param("profileId") Long profileId);

    @Query("SELECT CASE WHEN COUNT(cr) > 0 THEN true ELSE false END FROM ChatRoom cr JOIN cr.members m WHERE cr.id = :chatRoomId AND m.idp = :profileId")
    boolean isProfileMemberOfChatRoom(@Param("chatRoomId") Long chatRoomId, @Param("profileId") Long profileId);
}