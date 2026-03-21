package com.rohan.service;

import java.util.List;

import com.rohan.dto.SubscriptionResponse;

public interface SubscriptionService {

	SubscriptionResponse subscribePlan(String email, Long planId);

	List<SubscriptionResponse> getMySubscriptions(String username);

	SubscriptionResponse getMyActiveSubscriptions(String username);

	SubscriptionResponse cancelSubscription(String username, Long subId);

	SubscriptionResponse switchPlan(String username, Long planId);
	
}