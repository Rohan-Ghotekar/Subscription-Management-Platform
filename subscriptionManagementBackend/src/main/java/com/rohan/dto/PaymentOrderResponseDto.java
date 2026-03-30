package com.rohan.dto;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class PaymentOrderResponseDto {
    private Long transactionId;
    private Long planId;
    private String stripeSessionId;
    private BigDecimal amount;
    private String currency;
    private String status;
    private String stripePublishableKey;
    private String checkoutUrl;     // redirect user to this URL to open Stripe checkout
    private String planName;
}
