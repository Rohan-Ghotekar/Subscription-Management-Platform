package com.rohan.service.impl;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.stripe.Stripe;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;

@Service
public class StripeService {

    @Value("${stripe.secret.key}")
    private String secretKey;

    public String createPaymentIntent(Long amount) throws Exception {
        Stripe.apiKey = secretKey;

        PaymentIntentCreateParams params =
                PaymentIntentCreateParams.builder()
                        .setAmount(amount)
                        .setCurrency("inr")
                        .addPaymentMethodType("card")
                        .build();

        PaymentIntent intent = PaymentIntent.create(params);
        return intent.getClientSecret();
    }
}
