package com.rohan.service;

import java.util.List;
import com.rohan.dto.PlanDtos.PlanRequest;
import com.rohan.dto.PlanDtos.PlanResponse;


public interface PlanService {

	PlanResponse createNewSubscriptionPlan(PlanRequest plan);

	PlanResponse updateSubscriptionPlan(PlanRequest plan);

	List<PlanResponse> getAllPlans();

	PlanResponse getPlanById(Long id);

	PlanResponse getPlanByName(String name);

	PlanResponse deactivatePlanById(Long id);

	PlanResponse activatePlanById(Long id);

}