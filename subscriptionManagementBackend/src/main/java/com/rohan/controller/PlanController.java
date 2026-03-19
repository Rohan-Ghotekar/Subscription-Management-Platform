package com.rohan.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.rohan.dto.PlanDtos.PlanRequest;
import com.rohan.dto.PlanDtos.PlanResponse;
import com.rohan.service.PlanService;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/plan")
@RequiredArgsConstructor
@Slf4j
@SecurityRequirement(name="bearerAuth")
public class PlanController {
	
	private final PlanService planService;
	
	@PostMapping("/createplan")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<PlanResponse> createNewSubscriptionPlan(@RequestBody PlanRequest request){
		log.info("PlanController: Inside Create plan method");
		PlanResponse createdPlan= planService.createNewSubscriptionPlan(request);
		return ResponseEntity.ok(createdPlan);
	}
	
	@PutMapping("/updateplan")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<PlanResponse> updateSubscriptionPlan(@RequestBody PlanRequest request){
		log.info("PlanController: Inside Update Plan");
		PlanResponse updatedPlan=planService.updateSubscriptionPlan(request);
		return ResponseEntity.ok(updatedPlan);
	}
	
	@GetMapping("/getallplans")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<List<PlanResponse>> getAllPlans(){
		log.info("PlanController: Inside getAllPlans method");
		return ResponseEntity.ok(planService.getAllPlans());
	}
	
	@GetMapping("/getplanbyid/{id}")
	public ResponseEntity<PlanResponse> getPlanById(@PathVariable Long id){
		log.info("PlanController: Inside getPlanById method");
		return ResponseEntity.ok(planService.getPlanById(id));
	}
	
	@GetMapping("/getplanbyname/{name}")
	public ResponseEntity<PlanResponse> getPlanById(@PathVariable String name){
		log.info("PlanController: Inside getPlanByName method");
		return ResponseEntity.ok(planService.getPlanByName(name));
	}
	
	@PutMapping("/deactivateplan/{id}")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<PlanResponse> deactivatePlanById(@PathVariable Long id){
		log.info("PlanController: Inside deactivatePlanById");
		return ResponseEntity.ok(planService.deactivatePlanById(id));
	}

	@PutMapping("/activateplan/{id}")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<PlanResponse> activatePlanById(@PathVariable Long id){
		log.info("PlanController: Inside activatePlanById");
		return ResponseEntity.ok(planService.activatePlanById(id));
	}
}
