package com.rohan.service;

import java.time.LocalDate;
import java.util.List;


import com.rohan.dto.AnalyticsDtos.AnalyticsSummaryResponse;
import com.rohan.dto.AnalyticsDtos.GrowthDataResponse;
import com.rohan.dto.AnalyticsDtos.PlanDistributionResponse;
import com.rohan.dto.SubscriptionResponse;
import com.rohan.dto.UserDtos.UserProfileResponse;

public interface AdminService {

	List<UserProfileResponse> getAllUsers();

	AnalyticsSummaryResponse getSummary(LocalDate from, LocalDate to);

	List<GrowthDataResponse> getMonthlyGrowth();

	List<PlanDistributionResponse> getPlanDistribution();

	SubscriptionResponse getUserActivePlanByUserId(Long userId);

}