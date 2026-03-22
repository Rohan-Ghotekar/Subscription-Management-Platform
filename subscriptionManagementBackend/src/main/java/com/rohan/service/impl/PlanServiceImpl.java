package com.rohan.service.impl;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.rohan.dto.PlanDtos.PlanRequest;
import com.rohan.dto.PlanDtos.PlanResponse;
import com.rohan.entity.SubscriptionPlan;
import com.rohan.repository.PlanRepository;
import com.rohan.service.PlanService;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class PlanServiceImpl implements PlanService {
	private final PlanRepository planRepository;
	
	
	@Override
	@Transactional
	public PlanResponse createNewSubscriptionPlan(PlanRequest plan) {
		log.info("PlanServiceImpl: Inside createNewSubscriptionPlan method");
		if(planRepository.existsByName(plan.name())) {
			throw new IllegalArgumentException(
					"Plan name already exists: "+plan.name());
		}
		SubscriptionPlan subPlan=SubscriptionPlan.builder()
				.name(plan.name())
				.description(plan.description())
				.price(plan.price())
                .billingInterval(plan.billingInterval())
                .tier(plan.tier())
                .features(plan.features())
                .active(true)
                .build();
		
		SubscriptionPlan saved=planRepository.save(subPlan);
		log.info("Plan Created with id: "+subPlan.getId()+" and Name: "+subPlan.getName());
		return PlanResponse.from(saved);
	}
	
	@Transactional
	@Override
	public PlanResponse updateSubscriptionPlan(PlanRequest plan) {
		log.info("PlanServiceImpl: Inside updateSubscriptionPlan method");
		log.info("Id: "+plan.id());
		Optional<SubscriptionPlan> optional=planRepository.findById(plan.id());
		if(optional.isEmpty()) {
			throw new IllegalArgumentException("Invalid Plan!! No Such plan exists...");
		}
		SubscriptionPlan oldPlan=optional.get();
		oldPlan.setName(plan.name());
		oldPlan.setDescription(plan.description());
		oldPlan.setPrice(plan.price());
		oldPlan.setTier(plan.tier());
		oldPlan.setBillingInterval(plan.billingInterval());
		oldPlan.setFeatures(plan.features());
		
		SubscriptionPlan updatedPlan=planRepository.save(oldPlan);
		log.info("Plan with id: "+oldPlan.getId()+" is updated");
		return PlanResponse.from(updatedPlan);
	}

	@Override
	public List<PlanResponse> getAllPlans() {
		log.info("PlanServiceImpl: Inside getAllPlans method");
		List<SubscriptionPlan> allPlans=planRepository.findAll();
		if(allPlans.isEmpty())return List.of();
		return allPlans.stream()
	            .map(PlanResponse::from)
	            .toList();
	}

	@Override
	public PlanResponse getPlanById(Long id) {
		log.info("PlanServiceImpl: Inside getPlanById method");
		Optional<SubscriptionPlan> optional=planRepository.findById(id);
		if(optional.isEmpty()) {
			throw new IllegalArgumentException("Invalid Plan Id!! Plan Not Available");
		}
		return PlanResponse.from(optional.get());
	}

	@Override
	public PlanResponse getPlanByName(String name) {
		log.info("PlanServiceImpl: Inside getPlanByName method");
		Optional<SubscriptionPlan> optional=planRepository.findByName(name);
		if(optional.isEmpty()) {
			return null;
		}
		return PlanResponse.from(optional.get());
	}

	@Override
	public PlanResponse deactivatePlanById(Long id) {
		Optional<SubscriptionPlan> optional=planRepository.findById(id);
		if(optional.isEmpty()) {
			throw new IllegalArgumentException("Invalid Plan Id!! Plan Not Available");
		}
		SubscriptionPlan plan=optional.get();
		plan.setActive(false);
		SubscriptionPlan deactivatedPlan=planRepository.save(plan);
		return PlanResponse.from(deactivatedPlan);
	}

	@Override
	public PlanResponse activatePlanById(Long id) {
		Optional<SubscriptionPlan> optional=planRepository.findById(id);
		if(optional.isEmpty()) {
			throw new IllegalArgumentException("Invalid Plan Id!! Plan Not Available");
		}
		SubscriptionPlan plan=optional.get();
		plan.setActive(true);
		SubscriptionPlan activatedPlan=planRepository.save(plan);
		return PlanResponse.from(activatedPlan);
	}

	@Override
	public List<PlanResponse> getAllPlansByStatus(boolean status) {
		Optional<List<SubscriptionPlan>> optional=planRepository.findByActive(status);
		if(optional.isEmpty()) {
			return List.of();
		}
		return optional.get().stream().map(PlanResponse::from).toList();
	}
}
