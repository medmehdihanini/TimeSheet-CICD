package tn.ey.timesheetclient.notification.service;

import tn.ey.timesheetclient.notification.model.Notification;

public interface NotificationService {
    public void sendNotification(String userID , Notification notification);


}
