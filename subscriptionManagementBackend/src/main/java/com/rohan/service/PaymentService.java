package com.rohan.service;


import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.rohan.dto.InitiatePaymentRequestDto;
import com.rohan.dto.PaymentHistoryResponseDto;
import com.rohan.dto.PaymentOrderResponseDto;

public interface PaymentService {

    // Step 1: User clicks pay — creates Stripe session, saves PENDING transaction
    PaymentOrderResponseDto initiatePayment(String userEmail, InitiatePaymentRequestDto request);

    // Step 2: Stripe calls this after payment — updates status, creates subscription
    void handleWebhook(String payload, String signature);

    // Step 3: Frontend polls this after redirect to confirm final status
    PaymentOrderResponseDto verifyPayment(String stripeSessionId);

    // User: get own payment history
    List<PaymentHistoryResponseDto> getPaymentHistory(String userEmail);

    // Admin: all transactions paginated
    Page<PaymentHistoryResponseDto> getAllTransactions(Pageable pageable);

	void cancelPayment(String stripeSessionId);
}
