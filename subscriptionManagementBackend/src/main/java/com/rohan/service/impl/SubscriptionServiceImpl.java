package com.rohan.service.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.rohan.dto.SubscriptionResponse;
import com.rohan.entity.NotificationEntity;
import com.rohan.entity.Subscription;
import com.rohan.entity.Subscription.Status;
import com.rohan.entity.SubscriptionPlan;
import com.rohan.entity.SubscriptionPlan.BillingInterval;
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
		
//		subRepository.findByUserAndPlanAndStatus(user, plan, Subscription.Status.ACTIVE)
//		.ifPresent(s->{
//			throw new IllegalArgumentException("You have already actively subscribe to the plan: "+plan.getName());
//		});
//		
//		subRepository.findActiveSub(user.getUserId(), plan.getId(), Subscription.Status.ACTIVE)
//	    .ifPresent(s -> {
//	        throw new IllegalArgumentException(
//	            "You have already actively subscribed to the plan: " + plan.getName()
//	        );
//	    });
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
//	
	@Override
	@Transactional
	public SubscriptionResponse subscribeSwitchPlan(String email,Long planId,LocalDate start, LocalDate end) {
		Optional<UserEntity> optional=userRepository.findByEmail(email);
		if(optional.isEmpty())return null;
		Optional<SubscriptionPlan> optional2=planRepository.findById(planId);
		UserEntity user =optional.get();
		SubscriptionPlan plan=optional2.get();
		
		Optional<Subscription> subDemo=subRepository.findByUserAndPlanAndStatus(user, plan, Subscription.Status.ACTIVE);
		if(subDemo.isPresent()) {
			subDemo.get().setEndDate(LocalDate.now());
			subDemo.get().setStatus(Status.CANCELLED);
			subRepository.save(subDemo.get());
		}
//		.ifPresent(s->{
//			throw new IllegalArgumentException("You have already actively subscribe to the plan: "+plan.getName());
//		});
//		
		Subscription sub=Subscription.builder()
				.user(user)
                .plan(plan)
                .status(Subscription.Status.ACTIVE)
                .startDate(start)
                .endDate(end)
                .autoRenew(true)
                .build();
		subRepository.save(sub);
		
		notificationService.send(
                user,
                "Subscription Plan Changed Confirmed",
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
		if(activePlan==null)return null;
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
	        sub.setEndDate(LocalDate.now());
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
	public SubscriptionResponse switchPlan(String username, Long planId,Long remDays) {
		log.info("Subscription: -------- Inside switch Plan");
		UserEntity user=userRepository.findByEmail(username).get();
		Subscription activePlan=subRepository.findByUserAndStatus(user,Subscription.Status.ACTIVE);
		cancelSubscription(username,activePlan.getId());
		LocalDate end=LocalDate.now().plusDays(remDays);
		return subscribeSwitchPlan(username,planId,activePlan.getStartDate(),end);
	}
	@Override
	public Map<String, Object> calculateUpgradeAmount(String username, Long newPlanId) {

	    Map<String, Object> response = new HashMap<>();

	    UserEntity user = userRepository.findByEmail(username)
	            .orElseThrow(() -> new RuntimeException("User not found"));

	    Subscription currentSub = subRepository.findByUserAndStatus(user, Subscription.Status.ACTIVE);

	    SubscriptionPlan currentPlan = currentSub.getPlan();
	    SubscriptionPlan newPlan = planRepository.findById(newPlanId)
	            .orElseThrow(() -> new RuntimeException("Plan not found"));

	    LocalDate startDate = currentSub.getStartDate();
	    LocalDate endDate = currentSub.getEndDate();
	    LocalDate today = LocalDate.now();

	    long totalDays = ChronoUnit.DAYS.between(startDate, endDate);
	    long usedDays = ChronoUnit.DAYS.between(startDate, today);
	    long remainingDays = totalDays - usedDays;

	    if (remainingDays < 0) remainingDays = 0;

	    BigDecimal currentPlanPrice = currentPlan.getPrice();
	    BigDecimal newPlanPrice = newPlan.getPrice();

	    if (currentPlanPrice.compareTo(newPlanPrice) >= 0) {

	        remainingDays = calculateDays(newPlan.getBillingInterval()) - usedDays;

	        response.put("remainingDays", remainingDays);
	        response.put("remainingValue", BigDecimal.ZERO);
	        response.put("newPlanPrice", newPlan.getPrice());
	        response.put("extraAmountToPay", BigDecimal.ZERO);

	        return response;
	    }

	    BigDecimal totalDaysBD = BigDecimal.valueOf(calculateDays(currentPlan.getBillingInterval()));
	    BigDecimal usedDaysBD = BigDecimal.valueOf(usedDays);

	    BigDecimal usedDaysPrice = currentPlanPrice
	            .divide(totalDaysBD, 2, RoundingMode.HALF_UP)
	            .multiply(usedDaysBD);
	    BigDecimal remAmount=currentPlanPrice.subtract(usedDaysPrice);
	    BigDecimal extraAmount = newPlan.getPrice().subtract(remAmount);

	    response.put("remainingDays", remainingDays);
	    response.put("remainingValue", currentPlan.getPrice().subtract(usedDaysPrice));
	    response.put("newPlanPrice", newPlanPrice);
	    response.put("extraAmountToPay", extraAmount);

	    return response;
	}
	private Long calculateDays(BillingInterval billingInterval) {
		 switch (billingInterval) {
        case MONTHLY: return 30L;
        case QUARTERLY: return 90L;
        case ANNUALLY: return 365L;
    };
    return 1L;
	}
}
