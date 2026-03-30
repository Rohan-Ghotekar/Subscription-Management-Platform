//package com.rohan.service.impl;
//
//import java.math.BigDecimal;
//import java.time.LocalDate;
//import java.util.List;
//
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.data.domain.Page;
//import org.springframework.data.domain.Pageable;
//import org.springframework.stereotype.Service;
//import org.springframework.transaction.annotation.Transactional;
//
//import com.rohan.dto.InitiatePaymentRequestDto;
//import com.rohan.dto.PaymentHistoryResponseDto;
//import com.rohan.dto.PaymentOrderResponseDto;
//import com.rohan.entity.Payment;
//import com.rohan.entity.Payment.PaymentStatus;
//import com.rohan.entity.Subscription;
//import com.rohan.entity.SubscriptionPlan;
//import com.rohan.entity.UserEntity;
//import com.rohan.repository.PaymentRepository;
//import com.rohan.repository.PlanRepository;
//import com.rohan.repository.SubscriptionRepository;
//import com.rohan.repository.UserRepository;
//import com.rohan.service.PaymentService;
//import com.stripe.Stripe;
//import com.stripe.exception.SignatureVerificationException;
//import com.stripe.exception.StripeException;
//import com.stripe.model.Event;
//import com.stripe.model.EventDataObjectDeserializer;
//import com.stripe.model.checkout.Session;
//import com.stripe.net.Webhook;
//import com.stripe.param.checkout.SessionCreateParams;
//
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//
//@Service
//@RequiredArgsConstructor
//@Slf4j
//public class PaymentServiceImpl implements PaymentService {
//
//    private final PaymentRepository paymentRepository;
//    private final UserRepository userRepository;
//    private final PlanRepository planRepository;
//    private final SubscriptionRepository subscriptionRepository;
//
//    @Value("${stripe.publishable.key}")
//    private String stripePublishableKey;
//
//    @Value("${stripe.secret.key}")
//    private String stripeSecretKey;
//
//    @Value("${stripe.webhook.secret:}")
//    private String stripeWebhookSecret;
//
//    @Value("${stripe.frontend.url}")
//    private String frontendUrl;
//
//    @Override
//    @Transactional
//    public PaymentOrderResponseDto initiatePayment(String userEmail, InitiatePaymentRequestDto request) {
//        if (!isStripeConfigured()) {
//            throw new IllegalStateException(
//                "Stripe is not configured. Set stripe.publishable-key and stripe.secret-key in application.properties.");
//        }
//
//        if (paymentRepository.existsByUserEmailAndPlanIdAndStatus(
//                userEmail, request.getPlanId(), PaymentStatus.SUCCESS)) {
//            throw new IllegalArgumentException(
//                "You already have an active subscription to this plan.");
//        }
//     // ✅ Only block if user has an active subscription AND active payment
//        boolean hasActiveSub = subscriptionRepository
//            .findActiveByUserEmailAndPlanId(userEmail, request.getPlanId()).isPresent();
//        if (hasActiveSub) {
//            throw new IllegalArgumentException("You already have an active subscription to this plan.");
//        }
//
//        UserEntity user = userRepository.findByEmail(userEmail)
//                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));
//
//        SubscriptionPlan plan = planRepository.findById(request.getPlanId())
//                .orElseThrow(() -> new IllegalArgumentException("Plan not found: " + request.getPlanId()));
//
//        String currency = (request.getCurrency() == null || request.getCurrency().isBlank())
//                ? "INR" : request.getCurrency().toUpperCase();
//
//        long unitAmount = request.getAmount()
//                .multiply(BigDecimal.valueOf(100))
//                .longValue();
//
//        String baseUrl = normalizeFrontendUrl(frontendUrl);
//
//        try {
//            Stripe.apiKey = stripeSecretKey;
//
//            SessionCreateParams params = SessionCreateParams.builder()
//                    .setMode(SessionCreateParams.Mode.PAYMENT)
//                    .setSuccessUrl(baseUrl + "/payment/success?session_id={CHECKOUT_SESSION_ID}")
//                    .setCancelUrl(baseUrl + "/payment/cancel")
//                    .putMetadata("userEmail", userEmail)
//                    .putMetadata("planId",    String.valueOf(plan.getId()))
//                    .addLineItem(
//                        SessionCreateParams.LineItem.builder()
//                            .setQuantity(1L)
//                            .setPriceData(
//                                SessionCreateParams.LineItem.PriceData.builder()
//                                    .setCurrency(currency)
//                                    .setUnitAmount(unitAmount)
//                                    .setProductData(
//                                        SessionCreateParams.LineItem.PriceData.ProductData.builder()
//                                            .setName(plan.getName() + " Plan")
//                                            .setDescription(plan.getDescription())
//                                            .build()
//                                    )
//                                    .build()
//                            )
//                            .build()
//                    )
//                    .build();
//
//            Session session = Session.create(params);
//
//            // Save PENDING transaction — webhook will update it to SUCCESS
//            Payment transaction = Payment.builder()
//                    .userEmail(userEmail)
//                    .planId(plan.getId())
//                    .amount(request.getAmount())
//                    .currency(currency)
//                    .stripeSessionId(session.getId())
//                    .status(PaymentStatus.PENDING)
//                    .build();
//
//            Payment saved = paymentRepository.save(transaction);
//            log.info("PaymentService: PENDING transaction id={} user={} plan={} session={}",
//                    saved.getId(), userEmail, plan.getName(), session.getId());
//
//            PaymentOrderResponseDto dto = new PaymentOrderResponseDto();
//            dto.setTransactionId(saved.getId());
//            dto.setPlanId(transaction.getPlanId());
//            dto.setStripeSessionId(session.getId());
//            dto.setAmount(request.getAmount());
//            dto.setCurrency(currency);
//            dto.setStatus("PENDING");
//            dto.setStripePublishableKey(stripePublishableKey);
//            dto.setCheckoutUrl(session.getUrl());
//            dto.setPlanName(plan.getName());
//            return dto;
//
//        } catch (StripeException e) {
//            log.error("PaymentService: Stripe error creating session: {}", e.getMessage());
//            throw new RuntimeException("Failed to create Stripe checkout session: " + e.getMessage());
//        }
//    }
//
//    // ── Step 2: Handle Stripe webhook ─────────────────────────────────────────
//
////    @Override
////    @Transactional
////    public void handleWebhook(String payload, String signature) {
////        if (stripeWebhookSecret == null || stripeWebhookSecret.isBlank()) {
////            throw new IllegalStateException("Stripe webhook secret is not configured.");
////        }
////
////        Event event;
////        try {
////            Stripe.apiKey = stripeSecretKey;
////            event = Webhook.constructEvent(payload, signature, stripeWebhookSecret);
////        } catch (SignatureVerificationException e) {
////            log.warn("PaymentService: Invalid Stripe webhook signature");
////            throw new IllegalArgumentException("Invalid Stripe webhook signature");
////        } catch (Exception e) {
////            log.error("PaymentService: Webhook parse error: {}", e.getMessage());
////            throw new RuntimeException("Webhook processing failed: " + e.getMessage());
////        }
////
////        log.info("PaymentService: webhook event type={} id={}", event.getType(), event.getId());
////
////        // Only handle checkout session events
////        boolean isSuccess = "checkout.session.completed".equals(event.getType())
////                || "checkout.session.async_payment_succeeded".equals(event.getType());
////        boolean isFailure = "checkout.session.async_payment_failed".equals(event.getType())
////                || "checkout.session.expired".equals(event.getType());
////
////        if (!isSuccess && !isFailure) {
////            log.debug("PaymentService: Ignoring event type={}", event.getType());
////            return;
////        }
////
////        EventDataObjectDeserializer deserializer = event.getDataObjectDeserializer();
////
////        Session session;
////
////        if (deserializer.getObject().isPresent()) {
////            session = (Session) deserializer.getObject().get();
////        } else {
////            log.warn("⚠️ Deserialization failed, using JSON fallback...");
////
////            try {
////                // ✅ Parse raw JSON string
////                String rawJson = deserializer.getRawJson();
////
////                JsonObject jsonObject = JsonParser.parseString(rawJson).getAsJsonObject();
////                String sessionId = jsonObject.get("id").getAsString();
////
////                Stripe.apiKey = stripeSecretKey;
////                session = Session.retrieve(sessionId);
////
////            } catch (Exception e) {
////                throw new RuntimeException("Failed to retrieve Stripe session", e);
////            }
////        }
//////        Session session = (Session) deserializer.getObject()
//////                .orElseThrow(() -> new RuntimeException("Could not deserialize Stripe session."));
////
////        Payment transaction = paymentRepository
////                .findByStripeSessionId(session.getId())
////                .orElseThrow(() -> new IllegalArgumentException(
////                    "Transaction not found for session: " + session.getId()));
////
////        transaction.setStripeSignature(signature);
////
////        if (isSuccess) {
////            markAsSuccess(transaction, session.getPaymentIntent());
////        } else if (transaction.getStatus() == PaymentStatus.PENDING) {
////            transaction.setStatus(PaymentStatus.FAILED);
////            paymentRepository.save(transaction);
////            log.info("PaymentService: transaction FAILED id={}", transaction.getId());
////        }
////    }
//    @Override
//    @Transactional
//    public void handleWebhook(String payload, String signature) {
//
//        if (stripeWebhookSecret == null || stripeWebhookSecret.isBlank()) {
//            throw new IllegalStateException("Stripe webhook secret is not configured.");
//        }
//
//        Event event;
//        try {
//            Stripe.apiKey = stripeSecretKey;
//            event = Webhook.constructEvent(payload, signature, stripeWebhookSecret);
//        } catch (SignatureVerificationException e) {
//            log.warn("PaymentService: Invalid Stripe webhook signature");
//            throw new IllegalArgumentException("Invalid Stripe webhook signature");
//        } catch (Exception e) {
//            log.error("PaymentService: Webhook parse error: {}", e.getMessage());
//            throw new RuntimeException("Webhook processing failed: " + e.getMessage());
//        }
//
//        log.info("PaymentService: webhook event type={} id={}", event.getType(), event.getId());
//
//        // ✅ Handle only required events
//        boolean isSuccess = "checkout.session.completed".equals(event.getType())
//                || "checkout.session.async_payment_succeeded".equals(event.getType());
//
//        boolean isFailure = "checkout.session.async_payment_failed".equals(event.getType())
//                || "checkout.session.expired".equals(event.getType());
//
//        if (!isSuccess && !isFailure) {
//            log.debug("PaymentService: Ignoring event type={}", event.getType());
//            return;
//        }
//
//        try {
//            // 🔥 SAFEST WAY: Always extract session ID from Stripe (no deserialization issues)
//            EventDataObjectDeserializer deserializer = event.getDataObjectDeserializer();
//
//            String sessionId;
//
//            if (deserializer.getObject().isPresent()) {
//                Session session = (Session) deserializer.getObject().get();
//                sessionId = session.getId();
//            } else {
//                // fallback (rare case)
//                log.warn("⚠️ Deserialization failed, retrieving from Stripe...");
//
//                // Extract session ID from raw JSON safely
//                String rawJson = deserializer.getRawJson().toString();
//
//                // simple extraction (safe because Stripe always sends "id")
//                sessionId = rawJson.split("\"id\":\"")[1].split("\"")[0];
//            }
//
//            log.info("PaymentService: sessionId={}", sessionId);
//
//            // 🔎 Find transaction in DB
//            Payment transaction = paymentRepository
//                    .findByStripeSessionId(sessionId)
//                    .orElseThrow(() -> new IllegalArgumentException(
//                            "Transaction not found for session: " + sessionId));
//
//            transaction.setStripeSignature(signature);
//
//            if (isSuccess) {
//                // ✅ Fetch latest session from Stripe (BEST PRACTICE)
//                Session session = Session.retrieve(sessionId);
//
//                markAsSuccess(transaction, session.getPaymentIntent());
//
//            } else if (transaction.getStatus() == PaymentStatus.PENDING) {
//                transaction.setStatus(PaymentStatus.FAILED);
//                paymentRepository.save(transaction);
//
//                log.info("PaymentService: transaction FAILED id={}", transaction.getId());
//            }
//
//        } catch (Exception e) {
//            log.error("PaymentService: Webhook handling failed: {}", e.getMessage());
//            throw new RuntimeException("Webhook handling failed", e);
//        }
//    }
//    // ── Step 3: Verify payment (frontend polls after redirect) ────────────────
//
//    @Override
//    @Transactional
//    public PaymentOrderResponseDto verifyPayment(String stripeSessionId) {
//        Payment transaction = paymentRepository
//                .findByStripeSessionId(stripeSessionId)
//                .orElseThrow(() -> new IllegalArgumentException(
//                    "Session not found: " + stripeSessionId));
//
//        // Double-check with Stripe directly (handles cases where webhook was delayed)
//        try {
//            Stripe.apiKey = stripeSecretKey;
//            Session session = Session.retrieve(stripeSessionId);
//            boolean isPaid = "paid".equalsIgnoreCase(session.getPaymentStatus())
//                    || "complete".equalsIgnoreCase(session.getStatus());
//
//            if (isPaid && transaction.getStatus() != PaymentStatus.SUCCESS) {
//                markAsSuccess(transaction, session.getPaymentIntent());
//            }
//        } catch (StripeException e) {
//            log.warn("PaymentService: Stripe verify failed for session {}: {}",
//                    stripeSessionId, e.getMessage());
//        }
//
//        SubscriptionPlan plan = planRepository.findById(transaction.getPlanId()).orElse(null);
//
//        PaymentOrderResponseDto dto = new PaymentOrderResponseDto();
//        dto.setTransactionId(transaction.getId());
//        dto.setStripeSessionId(transaction.getStripeSessionId());
//        dto.setAmount(transaction.getAmount());
//        dto.setCurrency(transaction.getCurrency());
//        dto.setStatus(transaction.getStatus().name());
//        dto.setStripePublishableKey(stripePublishableKey);
//        dto.setPlanName(plan != null ? plan.getName() : "Unknown");
//        return dto;
//    }
//
//    // ── History ───────────────────────────────────────────────────────────────
//
//    @Override
//    public List<PaymentHistoryResponseDto> getPaymentHistory(String userEmail) {
//        return paymentRepository.findByUserEmailOrderByCreatedAtDesc(userEmail)
//                .stream()
//                .map(t -> toHistoryDto(t, false))
//                .toList();
//    }
//
//    @Override
//    public Page<PaymentHistoryResponseDto> getAllTransactions(Pageable pageable) {
//        return paymentRepository.findAllByOrderByCreatedAtDesc(pageable)
//                .map(t -> toHistoryDto(t, true));
//    }
//
//    // ── Private helpers ───────────────────────────────────────────────────────
//
//    private void markAsSuccess(Payment transaction, String paymentIntentId) {
//        if (transaction.getStatus() == PaymentStatus.SUCCESS) {
//            log.debug("PaymentService: transaction {} already SUCCESS, skipping", transaction.getId());
//            return;
//        }
//
//        transaction.setStripePaymentIntentId(paymentIntentId);
//        transaction.setStatus(PaymentStatus.SUCCESS);
//        paymentRepository.save(transaction);
//        log.info("PaymentService: transaction SUCCESS id={} user={} plan={}",
//                transaction.getId(), transaction.getUserEmail(), transaction.getPlanId());
//
//        // Create subscription for the user
//        activateSubscription(transaction);
//    }
//
//    private void activateSubscription(Payment transaction) {
//        try {
//            UserEntity user = userRepository.findByEmail(transaction.getUserEmail())
//                    .orElseThrow(() -> new IllegalArgumentException(
//                        "User not found: " + transaction.getUserEmail()));
//
//            SubscriptionPlan plan = planRepository.findById(transaction.getPlanId())
//                    .orElseThrow(() -> new IllegalArgumentException(
//                        "Plan not found: " + transaction.getPlanId()));
//
//            // Prevent duplicate active subscription
//            boolean alreadyActive = subscriptionRepository
//                    .findByUserAndPlanAndStatus(user, plan, Subscription.Status.ACTIVE)
//                    .isPresent();
//
//            if (alreadyActive) {
//                log.info("PaymentService: user {} already has active subscription for plan {}",
//                        user.getEmail(), plan.getName());
//                return;
//            }
//
//            LocalDate endDate = switch (plan.getBillingInterval()) {
//                case MONTHLY   -> LocalDate.now().plusMonths(1);
//                case QUARTERLY -> LocalDate.now().plusMonths(3);
//                case ANNUALLY    -> LocalDate.now().plusYears(1);
//            };
//
//            Subscription subscription = Subscription.builder()
//                    .user(user)
//                    .plan(plan)
//                    .status(Subscription.Status.ACTIVE)
//                    .startDate(LocalDate.now())
//                    .endDate(endDate)
//                    .autoRenew(true)
//                    .build();
//
//            subscriptionRepository.save(subscription);
//            log.info("PaymentService: subscription created for user={} plan={} until={}",
//                    user.getEmail(), plan.getName(), endDate);
//
//        } catch (Exception e) {
//            log.error("PaymentService: subscription creation failed for transaction {}: {}",
//                    transaction.getId(), e.getMessage());
//        }
//    }
//
//    private PaymentHistoryResponseDto toHistoryDto(Payment t, boolean includeNames) {
//        PaymentHistoryResponseDto dto = new PaymentHistoryResponseDto();
//        dto.setId(t.getId());
//        dto.setUserEmail(t.getUserEmail());
//        dto.setPlanId(t.getPlanId());
//        dto.setAmount(t.getAmount());
//        dto.setCurrency(t.getCurrency());
//        dto.setStatus(t.getStatus());
//        dto.setStripeSessionId(t.getStripeSessionId());
//        dto.setCreatedAt(t.getCreatedAt());
//
//        if (includeNames) {
//            try {
//                UserEntity user = userRepository.findByEmail(t.getUserEmail()).orElse(null);
//                if (user != null) dto.setUserFullName(user.getFullName());
//            } catch (Exception e) {
//                log.debug("PaymentService: Could not resolve user name for transaction {}", t.getId());
//            }
//        }
//
//        try {
//            SubscriptionPlan plan = planRepository.findById(t.getPlanId()).orElse(null);
//            if (plan != null) dto.setPlanName(plan.getName());
//        } catch (Exception e) {
//            log.debug("PaymentService: Could not resolve plan name for transaction {}", t.getId());
//        }
//
//        return dto;
//    }
//
//    private boolean isStripeConfigured() {
//        return stripePublishableKey != null && !stripePublishableKey.isBlank()
//                && stripeSecretKey != null && !stripeSecretKey.isBlank();
//    }
//
//    private String normalizeFrontendUrl(String rawUrl) {
//        if (rawUrl == null || rawUrl.isBlank()) {
//            throw new IllegalStateException("stripe.frontend-url is not configured.");
//        }
//        String url = rawUrl.trim();
//        if (!url.startsWith("http://") && !url.startsWith("https://")) {
//            url = "http://" + url;
//        }
//        while (url.endsWith("/")) {
//            url = url.substring(0, url.length() - 1);
//        }
//        return url;
//    }
//}

package com.rohan.service.impl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rohan.dto.InitiatePaymentRequestDto;
import com.rohan.dto.PaymentHistoryResponseDto;
import com.rohan.dto.PaymentOrderResponseDto;
import com.rohan.entity.Payment;
import com.rohan.entity.Payment.PaymentStatus;
import com.rohan.entity.Subscription;
import com.rohan.entity.SubscriptionPlan;
import com.rohan.entity.UserEntity;
import com.rohan.repository.PaymentRepository;
import com.rohan.repository.PlanRepository;
import com.rohan.repository.SubscriptionRepository;
import com.rohan.repository.UserRepository;
import com.rohan.service.PaymentService;
import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final PlanRepository planRepository;
    private final SubscriptionRepository subscriptionRepository;

    @Value("${stripe.publishable.key}")
    private String stripePublishableKey;

    @Value("${stripe.secret.key}")
    private String stripeSecretKey;

    @Value("${stripe.webhook.secret:}")
    private String stripeWebhookSecret;

    @Value("${stripe.frontend.url}")
    private String frontendUrl;

    // ── Step 1: Initiate Payment ──────────────────────────────────────────────

    @Override
    @Transactional
    public PaymentOrderResponseDto initiatePayment(String userEmail, InitiatePaymentRequestDto request) {
        if (!isStripeConfigured()) {
            throw new IllegalStateException(
                "Stripe is not configured. Set stripe.publishable-key and stripe.secret-key in application.properties.");
        }

//        // Block if user already has a SUCCESS payment for this plan
//        if (paymentRepository.existsByUserEmailAndPlanIdAndStatus(
//                userEmail, request.getPlanId(), PaymentStatus.SUCCESS)) {
//            throw new IllegalArgumentException(
//                "You already have an active subscription to this plan.");
//        }

        // Block if user already has an active subscription for this plan
        boolean hasActiveSub = subscriptionRepository
				.findActiveByUserEmailAndPlanIdAndStatus(userEmail, request.getPlanId(),
						Subscription.Status.ACTIVE).isPresent();
        if (hasActiveSub) {
            throw new IllegalArgumentException("You already have an active subscription to this plan.");
        }

        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        SubscriptionPlan plan = planRepository.findById(request.getPlanId())
                .orElseThrow(() -> new IllegalArgumentException("Plan not found: " + request.getPlanId()));

        String currency = (request.getCurrency() == null || request.getCurrency().isBlank())
                ? "INR" : request.getCurrency().toUpperCase();

        long unitAmount = request.getAmount()
                .multiply(BigDecimal.valueOf(100))
                .longValue();

        String baseUrl = normalizeFrontendUrl(frontendUrl);

        try {
            Stripe.apiKey = stripeSecretKey;

            // Pass session_id in cancel URL so frontend can mark it as cancelled
            SessionCreateParams params = SessionCreateParams.builder()
                    .setMode(SessionCreateParams.Mode.PAYMENT)
                    .setSuccessUrl(baseUrl + "/payment/success?session_id={CHECKOUT_SESSION_ID}")
                    .setCancelUrl(baseUrl + "/payment/cancel?session_id={CHECKOUT_SESSION_ID}")
                    .putMetadata("userEmail", userEmail)
                    .putMetadata("planId",    String.valueOf(plan.getId()))
                    .addLineItem(
                        SessionCreateParams.LineItem.builder()
                            .setQuantity(1L)
                            .setPriceData(
                                SessionCreateParams.LineItem.PriceData.builder()
                                    .setCurrency(currency)
                                    .setUnitAmount(unitAmount)
                                    .setProductData(
                                        SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                            .setName(plan.getName() + " Plan")
                                            .setDescription(plan.getDescription())
                                            .build()
                                    )
                                    .build()
                            )
                            .build()
                    )
                    .build();

            Session session = Session.create(params);

            // Save PENDING transaction — webhook will update it to SUCCESS
            Payment transaction = Payment.builder()
                    .userEmail(userEmail)
                    .planId(plan.getId())
                    .amount(request.getAmount())
                    .currency(currency)
                    .stripeSessionId(session.getId())
                    .status(PaymentStatus.PENDING)
                    .build();

            // saveAndFlush ensures planId/id are populated before use
            Payment saved = paymentRepository.saveAndFlush(transaction);
            log.info("PaymentService: PENDING transaction id={} user={} plan={} session={}",
                    saved.getId(), userEmail, plan.getName(), session.getId());

            PaymentOrderResponseDto dto = new PaymentOrderResponseDto();
            dto.setTransactionId(saved.getId());
            dto.setPlanId(saved.getPlanId());
            dto.setStripeSessionId(session.getId());
            dto.setAmount(request.getAmount());
            dto.setCurrency(currency);
            dto.setStatus("PENDING");
            dto.setStripePublishableKey(stripePublishableKey);
            dto.setCheckoutUrl(session.getUrl());
            dto.setPlanName(plan.getName());
            return dto;

        } catch (StripeException e) {
            log.error("PaymentService: Stripe error creating session: {}", e.getMessage());
            throw new RuntimeException("Failed to create Stripe checkout session: " + e.getMessage());
        }
    }

    // ── Step 2: Handle Stripe Webhook ─────────────────────────────────────────

    @Override
    @Transactional
    public void handleWebhook(String payload, String signature) {
        if (stripeWebhookSecret == null || stripeWebhookSecret.isBlank()) {
            throw new IllegalStateException("Stripe webhook secret is not configured.");
        }

        Event event;
        try {
            Stripe.apiKey = stripeSecretKey;
            event = Webhook.constructEvent(payload, signature, stripeWebhookSecret);
        } catch (SignatureVerificationException e) {
            log.warn("PaymentService: Invalid Stripe webhook signature");
            throw new IllegalArgumentException("Invalid Stripe webhook signature");
        } catch (Exception e) {
            log.error("PaymentService: Webhook parse error: {}", e.getMessage());
            throw new RuntimeException("Webhook processing failed: " + e.getMessage());
        }

        log.info("PaymentService: webhook event type={} id={}", event.getType(), event.getId());

        boolean isSuccess = "checkout.session.completed".equals(event.getType())
                || "checkout.session.async_payment_succeeded".equals(event.getType());

        boolean isFailure = "checkout.session.async_payment_failed".equals(event.getType())
                || "checkout.session.expired".equals(event.getType());

        if (!isSuccess && !isFailure) {
            log.debug("PaymentService: Ignoring event type={}", event.getType());
            return;
        }

        try {
            EventDataObjectDeserializer deserializer = event.getDataObjectDeserializer();
            String sessionId;

            if (deserializer.getObject().isPresent()) {
                Session session = (Session) deserializer.getObject().get();
                sessionId = session.getId();
            } else {
                // Fallback: extract session ID from raw JSON
                log.warn("PaymentService: Deserialization failed, extracting session ID from raw JSON...");
                String rawJson = deserializer.getRawJson();
                sessionId = rawJson.split("\"id\":\"")[1].split("\"")[0];
            }

            log.info("PaymentService: sessionId={}", sessionId);

            Payment transaction = paymentRepository
                    .findByStripeSessionId(sessionId)
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Transaction not found for session: " + sessionId));

            transaction.setStripeSignature(signature);

            if (isSuccess) {
                Session session = Session.retrieve(sessionId);
                markAsSuccess(transaction, session.getPaymentIntent());
            } else if (transaction.getStatus() == PaymentStatus.PENDING) {
                transaction.setStatus(PaymentStatus.FAILED);
                paymentRepository.save(transaction);
                log.info("PaymentService: transaction FAILED id={}", transaction.getId());
            }

        } catch (Exception e) {
            log.error("PaymentService: Webhook handling failed: {}", e.getMessage());
            throw new RuntimeException("Webhook handling failed", e);
        }
    }

    // ── Step 3: Verify Payment (frontend polls after redirect) ────────────────

    @Override
    @Transactional
    public PaymentOrderResponseDto verifyPayment(String stripeSessionId) {
        Payment transaction = paymentRepository
                .findByStripeSessionId(stripeSessionId)
                .orElseThrow(() -> new IllegalArgumentException(
                    "Session not found: " + stripeSessionId));

        // Double-check with Stripe directly (handles webhook delay)
        try {
            Stripe.apiKey = stripeSecretKey;
            Session session = Session.retrieve(stripeSessionId);

            // FIX: use && (not ||) to avoid false positives on cancelled/expired sessions
            boolean isPaid = "paid".equalsIgnoreCase(session.getPaymentStatus())
                    && "complete".equalsIgnoreCase(session.getStatus());

            if (isPaid && transaction.getStatus() != PaymentStatus.SUCCESS) {
                markAsSuccess(transaction, session.getPaymentIntent());
            }
        } catch (StripeException e) {
            log.warn("PaymentService: Stripe verify failed for session {}: {}",
                    stripeSessionId, e.getMessage());
        }

        SubscriptionPlan plan = planRepository.findById(transaction.getPlanId()).orElse(null);

        PaymentOrderResponseDto dto = new PaymentOrderResponseDto();
        dto.setTransactionId(transaction.getId());
        dto.setStripeSessionId(transaction.getStripeSessionId());
        dto.setAmount(transaction.getAmount());
        dto.setCurrency(transaction.getCurrency());
        dto.setStatus(transaction.getStatus().name());
        dto.setStripePublishableKey(stripePublishableKey);
        dto.setPlanName(plan != null ? plan.getName() : "Unknown");
        return dto;
    }

    // ── Step 4: Cancel Payment (called when user hits cancel URL) ─────────────

    @Override
    @Transactional
    public void cancelPayment(String stripeSessionId) {
        if (stripeSessionId == null || stripeSessionId.isBlank()) {
            log.warn("PaymentService: cancelPayment called with blank sessionId");
            return;
        }
        paymentRepository.findByStripeSessionId(stripeSessionId)
            .ifPresent(payment -> {
                if (payment.getStatus() == PaymentStatus.PENDING) {
                    payment.setStatus(PaymentStatus.FAILED);
                    paymentRepository.save(payment);
                    log.info("PaymentService: payment cancelled (FAILED) for session={}", stripeSessionId);
                } else {
                    log.info("PaymentService: cancelPayment skipped — status already={} for session={}",
                        payment.getStatus(), stripeSessionId);
                }
            });
    }

    // ── History ───────────────────────────────────────────────────────────────

    @Override
    public List<PaymentHistoryResponseDto> getPaymentHistory(String userEmail) {
        return paymentRepository.findByUserEmailOrderByCreatedAtDesc(userEmail)
                .stream()
                .map(t -> toHistoryDto(t, false))
                .toList();
    }

    @Override
    public Page<PaymentHistoryResponseDto> getAllTransactions(Pageable pageable) {
        return paymentRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(t -> toHistoryDto(t, true));
    }

    // ── Private Helpers ───────────────────────────────────────────────────────

    private void markAsSuccess(Payment transaction, String paymentIntentId) {
        if (transaction.getStatus() == PaymentStatus.SUCCESS) {
            log.debug("PaymentService: transaction {} already SUCCESS, skipping", transaction.getId());
            return;
        }

        transaction.setStripePaymentIntentId(paymentIntentId);
        transaction.setStatus(PaymentStatus.SUCCESS);
        paymentRepository.save(transaction);
        log.info("PaymentService: transaction SUCCESS id={} user={} plan={}",
                transaction.getId(), transaction.getUserEmail(), transaction.getPlanId());

        activateSubscription(transaction);
    }

//    private void activateSubscription(Payment transaction) {
//        // Guard against corrupted/default data
//        if (transaction.getPlanId() == null || transaction.getPlanId() == 0) {
//            log.error("PaymentService: skipping subscription activation — planId is invalid ({}) for transaction id={}",
//                transaction.getPlanId(), transaction.getId());
//            return;
//        }
//        if (transaction.getUserEmail() == null || transaction.getUserEmail().isBlank()) {
//            log.error("PaymentService: skipping subscription activation — userEmail is blank for transaction id={}",
//                transaction.getId());
//            return;
//        }
//
//        try {
//            UserEntity user = userRepository.findByEmail(transaction.getUserEmail())
//                    .orElseThrow(() -> new IllegalArgumentException(
//                        "User not found: " + transaction.getUserEmail()));
//
//            SubscriptionPlan plan = planRepository.findById(transaction.getPlanId())
//                    .orElseThrow(() -> new IllegalArgumentException(
//                        "Plan not found: " + transaction.getPlanId()));
//
//            // Prevent duplicate active subscription
//            boolean alreadyActive = subscriptionRepository
//                    .findByUserAndPlanAndStatus(user, plan, Subscription.Status.ACTIVE)
//                    .isPresent();
//
//            if (alreadyActive) {
//                log.info("PaymentService: user {} already has active subscription for plan {}",
//                        user.getEmail(), plan.getName());
//                return;
//            }
//
//            LocalDate endDate = switch (plan.getBillingInterval()) {
//                case MONTHLY   -> LocalDate.now().plusMonths(1);
//                case QUARTERLY -> LocalDate.now().plusMonths(3);
//                case ANNUALLY  -> LocalDate.now().plusYears(1);
//            };
//
//            Subscription subscription = Subscription.builder()
//                    .user(user)
//                    .plan(plan)
//                    .status(Subscription.Status.ACTIVE)
//                    .startDate(LocalDate.now())
//                    .endDate(endDate)
//                    .autoRenew(true)
//                    .build();
//
//            subscriptionRepository.save(subscription);
//            log.info("PaymentService: subscription created for user={} plan={} until={}",
//                    user.getEmail(), plan.getName(), endDate);
//
//        } catch (Exception e) {
//            log.error("PaymentService: subscription creation failed for transaction id={}: {}",
//                    transaction.getId(), e.getMessage());
//        }
//    }
    
    private void activateSubscription(Payment transaction) {
        if (transaction.getPlanId() == null || transaction.getPlanId() == 0) {
            log.error("PaymentService: skipping — planId invalid ({}) for transaction id={}",
                transaction.getPlanId(), transaction.getId());
            return;
        }
        if (transaction.getUserEmail() == null || transaction.getUserEmail().isBlank()) {
            log.error("PaymentService: skipping — userEmail blank for transaction id={}",
                transaction.getId());
            return;
        }

        try {
            UserEntity user = userRepository.findByEmail(transaction.getUserEmail())
                    .orElseThrow(() -> new IllegalArgumentException(
                        "User not found: " + transaction.getUserEmail()));

            SubscriptionPlan newPlan = planRepository.findById(transaction.getPlanId())
                    .orElseThrow(() -> new IllegalArgumentException(
                        "Plan not found: " + transaction.getPlanId()));

            // Cancel ANY existing active subscription (same or different plan)
            Subscription existingActive = subscriptionRepository
                    .findByUserAndStatus(user, Subscription.Status.ACTIVE);

            if (existingActive != null) {
                if (existingActive.getPlan().getId().equals(newPlan.getId())) {
                    // Same plan already active — payment was duplicate, nothing to do
                    log.info("PaymentService: user {} already has active sub for plan '{}' — skipping",
                            user.getEmail(), newPlan.getName());
                    return;
                }
                // Different plan — cancel old before activating new
                existingActive.setStatus(Subscription.Status.CANCELLED);
                existingActive.setEndDate(LocalDate.now());
                subscriptionRepository.save(existingActive);
                log.info("PaymentService: cancelled old sub id={} plan='{}' for user={} (plan switch)",
                        existingActive.getId(), existingActive.getPlan().getName(), user.getEmail());
            }

            // Activate new subscription
            LocalDate endDate = switch (newPlan.getBillingInterval()) {
                case MONTHLY   -> LocalDate.now().plusMonths(1);
                case QUARTERLY -> LocalDate.now().plusMonths(3);
                case ANNUALLY  -> LocalDate.now().plusYears(1);
            };

            Subscription subscription = Subscription.builder()
                    .user(user)
                    .plan(newPlan)
                    .status(Subscription.Status.ACTIVE)
                    .startDate(LocalDate.now())
                    .endDate(endDate)
                    .autoRenew(true)
                    .build();

            subscriptionRepository.save(subscription);
            log.info("PaymentService: subscription ACTIVATED for user={} plan='{}' until={}",
                    user.getEmail(), newPlan.getName(), endDate);

        } catch (Exception e) {
            log.error("PaymentService: subscription activation failed for transaction id={}: {}",
                    transaction.getId(), e.getMessage());
        }
    }

    private PaymentHistoryResponseDto toHistoryDto(Payment t, boolean includeNames) {
        PaymentHistoryResponseDto dto = new PaymentHistoryResponseDto();
        dto.setId(t.getId());
        dto.setUserEmail(t.getUserEmail());
        dto.setPlanId(t.getPlanId());
        dto.setAmount(t.getAmount());
        dto.setCurrency(t.getCurrency());
        dto.setStatus(t.getStatus());
        dto.setStripeSessionId(t.getStripeSessionId());
        dto.setCreatedAt(t.getCreatedAt());

        if (includeNames) {
            try {
                UserEntity user = userRepository.findByEmail(t.getUserEmail()).orElse(null);
                if (user != null) dto.setUserFullName(user.getFullName());
            } catch (Exception e) {
                log.debug("PaymentService: Could not resolve user name for transaction {}", t.getId());
            }
        }

        try {
            SubscriptionPlan plan = planRepository.findById(t.getPlanId()).orElse(null);
            if (plan != null) dto.setPlanName(plan.getName());
        } catch (Exception e) {
            log.debug("PaymentService: Could not resolve plan name for transaction {}", t.getId());
        }

        return dto;
    }

    private boolean isStripeConfigured() {
        return stripePublishableKey != null && !stripePublishableKey.isBlank()
                && stripeSecretKey != null && !stripeSecretKey.isBlank();
    }

    private String normalizeFrontendUrl(String rawUrl) {
        if (rawUrl == null || rawUrl.isBlank()) {
            throw new IllegalStateException("stripe.frontend-url is not configured.");
        }
        String url = rawUrl.trim();
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            url = "http://" + url;
        }
        while (url.endsWith("/")) {
            url = url.substring(0, url.length() - 1);
        }
        return url;
    }
}