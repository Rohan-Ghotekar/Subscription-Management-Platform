package com.rohan.dto;

import java.math.BigDecimal;

public class AnalyticsDtos {
	
	public record AnalyticsSummaryResponse(
		    long totalActiveSubscriptions,
		    BigDecimal monthlyRecurringRevenue,
		    double churnRate,
		    long newSubscriptionsThisMonth,
		    long upcomingRenewalsNext30Days
		) {}
	
	public record GrowthDataResponse(
		    String month,
		    long count
		) {}
	
	public record PlanDistributionResponse(
		    String planName,
		    long count,
		    double percentage
		) {}
}
