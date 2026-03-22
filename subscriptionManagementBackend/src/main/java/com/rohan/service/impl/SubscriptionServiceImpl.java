package com.rohan.service.impl;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.rohan.dto.SubscriptionResponse;
import com.rohan.entity.NotificationEntity;
import com.rohan.entity.Subscription;
import com.rohan.entity.SubscriptionPlan;
import com.rohan.entity.UserEntity;
import com.rohan.repository.PlanRepository;
import com.rohan.repository.SubscriptionRepository;
import com.rohan.repository.UserRepository;
import com.rohan.service.NotificationService;
import com.rohan.service.SubscriptionService;

import jakarta.mail.MessagingException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubscriptionServiceImpl implements SubscriptionService {
	private final SubscriptionRepository subRepository;
	private final UserRepository userRepository;
	private final PlanRepository planRepository;
	private final NotificationService notificationService;
	private final EmailService emailService;
	
	@Override
	@Transactional
	public SubscriptionResponse subscribePlan(String email,Long planId) {
		Optional<UserEntity> optional=userRepository.findByEmail(email);
		if(optional.isEmpty())return null;
		Optional<SubscriptionPlan> optional2=planRepository.findById(planId);
		UserEntity user =optional.get();
		SubscriptionPlan plan=optional2.get();
		
		subRepository.findByUserAndPlanAndStatus(user, plan, Subscription.Status.ACTIVE)
		.ifPresent(s->{
			throw new IllegalArgumentException("You have already actively subscribe to the plan: "+plan.getName());
		});
		
		Subscription sub=Subscription.builder()
				.user(user)
                .plan(plan)
                .status(Subscription.Status.ACTIVE)
                .startDate(LocalDate.now())
                .endDate(calculateEndDate(plan))
                .autoRenew(true)
                .build();
		subRepository.save(sub);
		
		notificationService.send(
                user,
                "Subscription Confirmed",
                "You have successfully subscribed to the \"" + plan.getName() + "\" plan.",
                NotificationEntity.NotificationType.SUBSCRIPTION_CONFIRMED
        );
		try {
			emailService.sendSubscriptionConfirmation(email, sub.getUser().getFullName(),plan.getName() );
		} catch (MessagingException e) {
			log.error("Unable to send confirmation email!!");
		}
		return SubscriptionResponse.from(sub);
	}
	private LocalDate calculateEndDate(SubscriptionPlan plan) {
        return switch (plan.getBillingInterval()) {
            case MONTHLY   -> LocalDate.now().plusMonths(1);
            case QUARTERLY -> LocalDate.now().plusMonths(3);
            case ANNUALLY    -> LocalDate.now().plusYears(1);
        };
    }
	@Override
	public List<SubscriptionResponse> getMySubscriptions(String username) {
		UserEntity user=userRepository.findByEmail(username).get();
		return subRepository.findByUserOrderByCreatedAtDesc(user)
				.stream().map(SubscriptionResponse::from).toList();
	}
	@Override
	public SubscriptionResponse getMyActiveSubscriptions(String username) {
		UserEntity user=userRepository.findByEmail(username).get();
		Subscription activePlan = subRepository.findByUserAndStatus(user,Subscription.Status.ACTIVE);
		return SubscriptionResponse.from(activePlan);
	}
	@Override
	public SubscriptionResponse cancelSubscription(String username, Long subId) {
		UserEntity user=userRepository.findByEmail(username).get();
		Optional<Subscription> optional = subRepository.findByIdAndUser(subId, user);
		if(optional.isEmpty()) {
			throw new IllegalArgumentException("Plan Not Found!!");
		}
		Subscription sub=optional.get();
		 if (sub.getStatus() != Subscription.Status.ACTIVE) {
	            throw new IllegalStateException(
	                "Only ACTIVE subscriptions can be cancelled. Current status: " + sub.getStatus());
	        }

	        sub.setStatus(Subscription.Status.CANCELLED);
	        subRepository.save(sub);

	        notificationService.send(
	                user,
	                "Subscription Cancelled",
	                "Your \"" + sub.getPlan().getName() + "\" plan has been cancelled.",
	                NotificationEntity.NotificationType.PLAN_CHANGED
	        );

	        return SubscriptionResponse.from(sub);
	}
	@Override
	public SubscriptionResponse switchPlan(String username, Long planId) {
		UserEntity user=userRepository.findByEmail(username).get();
		Subscription activePlan=subRepository.findByUserAndStatus(user,Subscription.Status.ACTIVE);
		activePlan.setStatus(Subscription.Status.CANCELLED);
		subRepository.save(activePlan);
		return subscribePlan(username,planId);
	}
}
