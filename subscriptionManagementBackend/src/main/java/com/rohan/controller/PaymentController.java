package com.rohan.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.rohan.dto.InitiatePaymentRequestDto;
import com.rohan.dto.PaymentHistoryResponseDto;
import com.rohan.dto.PaymentOrderResponseDto;
import com.rohan.service.PaymentService;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Slf4j
@SecurityRequirement(name = "bearerAuth")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/initiate")
    public ResponseEntity<PaymentOrderResponseDto> initiatePayment(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody InitiatePaymentRequestDto request) {

        log.info("PaymentController: initiate user={} planId={}",
                userDetails.getUsername(), request.getPlanId());

        PaymentOrderResponseDto response = paymentService.initiatePayment(
                userDetails.getUsername(), request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/verify/{sessionId}")
    public ResponseEntity<PaymentOrderResponseDto> verifyPayment(
            @PathVariable String sessionId) {

        log.info("PaymentController: verify sessionId={}", sessionId);
        return ResponseEntity.ok(paymentService.verifyPayment(sessionId));
    }

    @GetMapping("/history")
    public ResponseEntity<List<PaymentHistoryResponseDto>> getHistory(
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(
                paymentService.getPaymentHistory(userDetails.getUsername()));
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<PaymentHistoryResponseDto>> getAllTransactions(
            @PageableDefault(size = 20) Pageable pageable) {

        return ResponseEntity.ok(paymentService.getAllTransactions(pageable));
    }
}
