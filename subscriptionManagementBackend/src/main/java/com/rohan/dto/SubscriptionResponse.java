package com.rohan.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.rohan.entity.Subscription;
import com.rohan.entity.SubscriptionPlan;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionResponse {

    private Long subId;
    private Long planId;
    private String planName;
    private String planDescription;
    private BigDecimal Price;
    private SubscriptionPlan.Tier tier;
    private SubscriptionPlan.BillingInterval billing;
    private Subscription.Status status;
    private LocalDate startDate;
    private LocalDate endDate;
    private boolean autoRenew;
    private long daysRemaining;
    private LocalDateTime createdAt;


    private Long userId;
    private String userEmail;
    private String userFullName;

    public static SubscriptionResponse from(Subscription s) {
        long days = java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), s.getEndDate());
        return SubscriptionResponse.builder()
                .subId(s.getId())
                .planId(s.getPlan().getId())
                .planName(s.getPlan().getName())
                .planDescription(s.getPlan().getDescription())
                .Price(s.getPlan().getPrice())
                .tier(s.getPlan().getTier())
                .billing(s.getPlan().getBillingInterval())
                .status(s.getStatus())
                .startDate(s.getStartDate())
                .endDate(s.getEndDate())
                .autoRenew(s.isAutoRenew())
                .daysRemaining(Math.max(0, days))
                .createdAt(s.getCreatedAt())
                .build();
    }

    public static SubscriptionResponse fromWithUser(Subscription s) {
        SubscriptionResponse resp = from(s);
        resp.setUserId(s.getUser().getUserId());
        resp.setUserEmail(s.getUser().getEmail());
        resp.setUserFullName(s.getUser().getFullName());
        return resp;
    }
}