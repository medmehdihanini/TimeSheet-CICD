package tn.ey.timesheetclient.notification.model;


import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class Notification {
    private NotificationStatus Status;
    private String Message;
    private String Title;
}
