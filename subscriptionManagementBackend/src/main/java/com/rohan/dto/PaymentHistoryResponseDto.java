package com.rohan.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.rohan.entity.Payment.PaymentStatus;

import lombok.Data;

@Data
public class PaymentHistoryResponseDto {
    private Long id;
    private String userEmail;
    private String userFullName;    // resolved from UserEntity
    private Long planId;
    private String planName;        // resolved from SubscriptionPlan
    private BigDecimal amount;
    private String currency;
    private PaymentStatus status;
    private String stripeSessionId;
    private LocalDateTime createdAt;
}
