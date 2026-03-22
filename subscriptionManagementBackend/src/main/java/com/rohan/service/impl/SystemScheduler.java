package com.rohan.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rohan.entity.NotificationEntity;
import com.rohan.entity.NotificationEntity.NotificationType;
import com.rohan.entity.Subscription;
import com.rohan.repository.NotificationRepository;
import com.rohan.repository.SubscriptionRepository;

import jakarta.mail.MessagingException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class SystemScheduler {

    private final SubscriptionRepository subscriptionRepository;
    private final NotificationRepository notificationRepository;
    private final EmailService emailService;

    @Scheduled(cron = "0 0 12 * * ?")
    public void sendExpiryReminders() {
    	log.info("System Scheduler: Inside sendExpiryReminders method");
        LocalDate targetDate = LocalDate.now().plusDays(5);

        List<Subscription> expiringSubs =
                subscriptionRepository.findExpiringSubscriptions(
                        targetDate,
                        Subscription.Status.ACTIVE
                );

        for (Subscription sub : expiringSubs) {
        	
        	if(sub.isReminderSent()) {
        		continue;
        	}
            String email = sub.getUser().getEmail();
            String name = sub.getUser().getFullName();
            String planName = sub.getPlan().getName();
            String expiryDate = sub.getEndDate().toString();

            try {
				emailService.sendRenewalReminder(email, name, planName, expiryDate);
        			sub.setReminderSent(true);
        			subscriptionRepository.save(sub);
        		
			} catch (MessagingException e) {
				log.info("Unable to Send Reminder...");
			}

            NotificationEntity notification = NotificationEntity.builder()
            		.title("Subscription Renewal Reminder")
            	    .user(sub.getUser())
            	    .message("Your " + planName + " plan expires on " + expiryDate)
            	    .type(NotificationType.RENEWAL_REMINDER)
            	    .build();

            	notificationRepository.save(notification);
        }
    }
    
    @Scheduled(cron = "0 0 12 * * ?")
    public void setReminderSent() {
    		log.info("System Scheduler: Inside setReminderSent method");
        LocalDate targetDate = LocalDate.now().plusDays(10);

        List<Subscription> expiringSubs =
                subscriptionRepository.findExpiringSubscriptions(
                        targetDate,
                        Subscription.Status.ACTIVE
                );

        for (Subscription sub : expiringSubs) {
        			sub.setReminderSent(false);
        			subscriptionRepository.save(sub);
			}
    }
    
    @Scheduled(cron = "0 0 12 * * ?")
    @Transactional
    public void deleteOldReadNotifications() {
    		log.info("System Scheduler: Inside deleteOldReadNotifications method");
        LocalDateTime cutoffTime = LocalDateTime.now().minusDays(2);

        notificationRepository.deleteByReadTrueAndReadAtBefore(cutoffTime);

        log.info("Old read notifications deleted at: " + LocalDateTime.now());
    }
}