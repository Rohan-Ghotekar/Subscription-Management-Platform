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
import com.rohan.entity.Subscription.Status;
import com.rohan.entity.UserEntity;
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
        LocalDate targetDate = LocalDate.now().plusDays(7);

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
    public void sendExpiryReminders1DayAgo() {
    	log.info("System Scheduler: Inside sendExpiryReminders1DayAgo method");
        LocalDate targetDate = LocalDate.now().plusDays(1);

        List<Subscription> expiringSubs =
                subscriptionRepository.findExpiringSubscriptions(
                        targetDate,
                        Subscription.Status.ACTIVE
                );

        for (Subscription sub : expiringSubs) {
        	
        	if(sub.isReminderSent() || sub.isAutoRenew()) {
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
    public void setReminderSent10DaysAgo() {
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
    public void setReminderSent3DaysAgo() {
    		log.info("System Scheduler: Inside setReminderSent3DaysAgo method");
        LocalDate targetDate = LocalDate.now().plusDays(3);
        
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
    
    @Scheduled(cron = "0 0 12 * * ?")
    @Transactional
    public void CancelledExpiredSubscription() {
    		log.info("System Scheduler: Inside CancelledExpiredSubscription method");
    		 LocalDate today = LocalDate.now();

    		    List<Subscription> expiredSubs =
    		            subscriptionRepository.findByEndDateLessThanEqualAndStatus(today, Status.ACTIVE);

    		    for (Subscription sub : expiredSubs) {

    		        if (Boolean.TRUE.equals(sub.isAutoRenew())) {
    		        		//auto payment deduction is pending
    		            sub.setEndDate(today.plusMonths(1));
    		            log.info("Renew subscription ID: {}", sub.getId());
    		            UserEntity user=sub.getUser();
    		            subscriptionRepository.save(sub);
    		            try {
    						emailService.sendRenewalSuccessEmail(user.getEmail(), user.getFullName(), sub.getPlan().getName(),LocalDate.now().toString(),sub.getEndDate().toString());
    		        		
    					} catch (MessagingException e) {
    						log.info("Unable to Send Reminder...");
    					}

    		            NotificationEntity notification = NotificationEntity.builder()
    		            		.title("Subscription Has Been Renew..")
    		            	    .user(sub.getUser())
    		            	    .message("Your " + sub.getPlan().getName() + " plan Renews on " + LocalDate.now())
    		            	    .type(NotificationType.SUBSCRIPTION_CONFIRMED)
    		            	    .build();

    		            	notificationRepository.save(notification);
    		            continue;
    		        }

    		            sub.setStatus(Status.EXPIRED);
    		            UserEntity user = sub.getUser();
    		            subscriptionRepository.save(sub);
    		            log.info("Cancelled subscription ID: {}", sub.getId());
    		            
    		            try {
    						emailService.sendPlanExpiredEmail(user.getEmail(), user.getFullName(), sub.getPlan().getName());
    		        		
    					} catch (MessagingException e) {
    						log.info("Unable to Send Reminder...");
    					}

    		            NotificationEntity notification = NotificationEntity.builder()
    		            		.title("Subscription Has Been Expired!!")
    		            	    .user(sub.getUser())
    		            	    .message("Your " + sub.getPlan().getName() + " plan expires on " + sub.getEndDate())
    		            	    .type(NotificationType.SUBSCRIPTION_EXPIRED)
    		            	    .build();

    		            	notificationRepository.save(notification);
    		    }
    }
}