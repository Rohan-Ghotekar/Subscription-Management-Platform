package com.rohan.service;

import org.springframework.stereotype.Service;

import com.rohan.entity.NotificationEntity;
import com.rohan.entity.UserEntity;
import com.rohan.repository.NotificationRepository;
import com.rohan.repository.UserRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {
	private final NotificationRepository notificationRepo;
	private final UserRepository userRepository;
	private final EmailService emailService;
	
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
		notificationRepo.save(note);
	}
}
