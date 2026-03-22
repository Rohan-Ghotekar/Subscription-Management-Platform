package com.rohan.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rohan.dto.NotificationResponse;
import com.rohan.entity.NotificationEntity;
import com.rohan.entity.UserEntity;
import com.rohan.repository.NotificationRepository;
import com.rohan.repository.UserRepository;
import com.rohan.service.NotificationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {
	private final NotificationRepository notificationRepository;
	private final UserRepository userRepository;
	
	@Override
	@Transactional
	public void send(UserEntity user,String title,String message,NotificationEntity.NotificationType type) {
		log.info("NotificationServiceImpl: Inside Send Notification Method");
		NotificationEntity note=NotificationEntity.builder()
				 	.user(user)
	                .title(title)
	                .message(message)
	                .type(type)
	                .read(false)
	                .build();
		notificationRepository.save(note);
	}

	@Override
	@Transactional
	public Boolean readNotification(String username, Long notificationId) {
		Optional<UserEntity> user=userRepository.findByEmail(username);
		Optional<NotificationEntity> optional=notificationRepository.findByIdAndUser(notificationId, user.get());
		if(optional.isEmpty())return false;
		NotificationEntity notification=optional.get();
		if(!notification.isRead()) {
		notification.setRead(true);
		notification.setReadAt(LocalDateTime.now());
		notificationRepository.save(notification);
		return true;
		}
		return false;
	}

	@Override
	@Transactional
	public Boolean readAllNotification(String username) {
		Optional<UserEntity> user=userRepository.findByEmail(username);
		List<NotificationEntity> notifications=notificationRepository.findByUser(user.get());
		if(notifications.isEmpty())return false;
		LocalDateTime currentDate=LocalDateTime.now();
		for(NotificationEntity notification:notifications) {
			if(!notification.isRead()) {
				notification.setRead(true);
				notification.setReadAt(currentDate);
				notificationRepository.save(notification);
			}
		}
		return true;
	}

	@Override
	public List<NotificationResponse> getAllNotifications(String username) {
		Optional<UserEntity>user=userRepository.findByEmail(username);
		return notificationRepository.findByUser(user.get())
				.stream().map(NotificationResponse::from).toList();
	}
}
