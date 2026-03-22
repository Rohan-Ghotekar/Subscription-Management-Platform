package com.rohan.service;

import java.util.List;

import com.rohan.dto.NotificationResponse;
import com.rohan.entity.NotificationEntity;
import com.rohan.entity.UserEntity;
public interface NotificationService {

	void send(UserEntity user, String title, String message, NotificationEntity.NotificationType type);

	Boolean readNotification(String username, Long notificationId);

	Boolean readAllNotification(String username);

	List<NotificationResponse> getAllNotifications(String username);

}