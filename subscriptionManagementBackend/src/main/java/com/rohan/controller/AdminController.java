package com.rohan.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.rohan.dto.AnalyticsDtos.AnalyticsSummaryResponse;
import com.rohan.dto.AnalyticsDtos.GrowthDataResponse;
import com.rohan.dto.AnalyticsDtos.PlanDistributionResponse;
import com.rohan.dto.UserDtos.UserProfileResponse;
import com.rohan.service.AdminService;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
@SecurityRequirement(name = "bearerAuth")
public class AdminController {
	
	private final AdminService adminService;
	
	@GetMapping("/getallusers")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<List<UserProfileResponse>> getAllUsers(){
		log.info("AdminController: Inside getAllUsers method");
		return ResponseEntity.ok(adminService.getAllUsers());
	}
	
	@GetMapping("/summary")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<AnalyticsSummaryResponse>getSummary(
			@RequestParam(required = false)
			@DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
			@RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to){
		return ResponseEntity.ok(adminService.getSummary(from,to));
	}
	
	@GetMapping("/growth")
	@PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<GrowthDataResponse>> getGrowth() {
        return ResponseEntity.ok(adminService.getMonthlyGrowth());
    }
	
	@GetMapping("/plandistribution")
    public ResponseEntity<List<PlanDistributionResponse>> getPlanDistribution() {
        return ResponseEntity.ok(adminService.getPlanDistribution());
    }
	
}
