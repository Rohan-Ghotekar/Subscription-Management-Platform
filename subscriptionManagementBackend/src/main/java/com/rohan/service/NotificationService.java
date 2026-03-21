package com.rohan.service;

import com.rohan.entity.NotificationEntity;
import com.rohan.entity.UserEntity;

import jakarta.transaction.Transactional;

public interface NotificationService {

	void send(UserEntity user, String title, String message, NotificationEntity.NotificationType type);

}