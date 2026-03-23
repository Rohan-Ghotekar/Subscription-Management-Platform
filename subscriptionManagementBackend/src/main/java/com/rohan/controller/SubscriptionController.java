package com.rohan.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.rohan.dto.SubscriptionResponse;
import com.rohan.service.SubscriptionService;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/subscriptions")
@RequiredArgsConstructor
@Slf4j
@SecurityRequirement(name="bearerAuth")
public class SubscriptionController {
	private final SubscriptionService subService;
	
	@PostMapping("/subscribe/{planId}")
	public ResponseEntity<SubscriptionResponse> subscribePlan(
			@PathVariable Long planId,
			@AuthenticationPrincipal UserDetails userDetails){
		return ResponseEntity.ok(subService.subscribePlan(userDetails.getUsername(),planId));
	}
	
	@GetMapping("/myplans")
	public ResponseEntity<List<SubscriptionResponse>> getMySubscriptions(
			@AuthenticationPrincipal UserDetails userDetails){
		return ResponseEntity.ok(subService.getMySubscriptions(userDetails.getUsername()));
	}
	
	@GetMapping("/myactiveplan")
	public ResponseEntity<SubscriptionResponse> getMyActiveSubscriptions(
			@AuthenticationPrincipal UserDetails userDetails){
		return ResponseEntity.ok(subService.getMyActiveSubscriptions(userDetails.getUsername()));
	}
	
	@PutMapping("/cancel/{subId}")
	public ResponseEntity<SubscriptionResponse> cancelSubscription(
			@PathVariable Long subId,
			@AuthenticationPrincipal UserDetails userDetails
			){
		return ResponseEntity.ok(subService.cancelSubscription(userDetails.getUsername(),subId));
	}
	@PutMapping("/switchplan/{planId}")
	public ResponseEntity<SubscriptionResponse> switchPlan(
			@PathVariable Long planId,
			@RequestBody Long remDays,
			@AuthenticationPrincipal UserDetails userDetails
			){
		return ResponseEntity.ok(subService.switchPlan(userDetails.getUsername(),planId,remDays));
	}
	
	@GetMapping("/calculateupgrade")
	public ResponseEntity<Map<String, Object>> calculateUpgradeAmount(
	        @AuthenticationPrincipal UserDetails userDetails,
	        @RequestParam Long newPlanId) {
	    return ResponseEntity.ok(subService.calculateUpgradeAmount(userDetails.getUsername(), newPlanId));
	}
}
