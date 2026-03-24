package com.rohan.controller;

//import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.rohan.service.impl.StripeService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/payment")
//@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class PaymentController {
	
    private final StripeService stripeService;

    @PostMapping("/create")
    public String createPayment(@RequestParam Long amount) throws Exception {
        return stripeService.createPaymentIntent(amount);
    }
}