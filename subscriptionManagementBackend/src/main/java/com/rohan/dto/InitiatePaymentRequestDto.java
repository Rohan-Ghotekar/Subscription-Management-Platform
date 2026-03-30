package com.rohan.dto;



import java.math.BigDecimal;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class InitiatePaymentRequestDto {

    @NotNull(message = "Plan ID is required")
    private Long planId;

    // Amount from frontend — should match the plan price
    @NotNull(message = "Amount is required")
    private BigDecimal amount;

    // Defaults to INR — can be overridden
    private String currency = "INR";
    
//    private boolean isSwitch=false;
}
