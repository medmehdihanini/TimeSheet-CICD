package tn.ey.timesheetclient.notification.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import tn.ey.timesheetclient.notification.model.Notification;


@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceimpl implements NotificationService{
    private final SimpMessagingTemplate messagingTemplate;

    public void sendNotification(String userID, Notification notification) {
        log.info("Sending WS notification to {} user:  with payload {} " + userID, notification);
        messagingTemplate.convertAndSendToUser(
                userID,
                "/notifications",
                notification
        );
        log.info("Sending WS notification to user {} with payload {}", userID, notification);
    }
}
