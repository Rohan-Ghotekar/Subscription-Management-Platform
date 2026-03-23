package com.rohan.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;


import com.rohan.dto.SubscriptionResponse;

public interface SubscriptionService {

	SubscriptionResponse subscribePlan(String email, Long planId);

	List<SubscriptionResponse> getMySubscriptions(String username);

	SubscriptionResponse getMyActiveSubscriptions(String username);

	SubscriptionResponse cancelSubscription(String username, Long subId);
	
	Map<String,Object> calculateUpgradeAmount(String username, Long newPlanId);

	SubscriptionResponse switchPlan(String username, Long planId, Long RemDays);

	SubscriptionResponse subscribeSwitchPlan(String email, Long planId, LocalDate start, LocalDate end);
	
}