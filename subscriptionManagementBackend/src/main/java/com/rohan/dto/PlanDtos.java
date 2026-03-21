package com.rohan.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.rohan.entity.SubscriptionPlan;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class PlanDtos {
	
	
	public record PlanRequest(
			Long id,
			
		    @NotBlank(message = "Plan name is required")
		    String name,

		    String description,

		    @NotNull(message = "Price is required")
		    @DecimalMin(value = "0.0", message = "Price must be positive")
		    BigDecimal price,

		    @NotNull(message = "Billing interval is required")
		    SubscriptionPlan.BillingInterval billingInterval,
		    
		    SubscriptionPlan.Tier tier,

		    List<String> features
		) {}
	
	public record PlanResponse (

	    Long id,
	    String name,
	    String description,
	    BigDecimal price,
	    SubscriptionPlan.BillingInterval billingInterval,
	    SubscriptionPlan.Tier tier,
	    List<String> features,
	    String imageUrl,
	    boolean active,
	    long subscriberCount,
	    LocalDateTime createdAt
	   ) {

	    public static PlanResponse from(SubscriptionPlan p) {
	    	long subscriberCount = (p.getSubscriptions() == null) 
	                ? 0L 
	                : p.getSubscriptions().size();
	    	
	    	return new PlanResponse(
	                        p.getId(),
	                        p.getName(),
	                        p.getDescription(),
	                        p.getPrice(),
	                        p.getBillingInterval(),
	                        p.getTier(),
	                        p.getFeatures(),
	                        p.getImageUrl(),
	                        p.isActive(),
	                        subscriberCount,
	                        p.getCreatedAt()
	            );
	    }
	}
}
