
package com.rohan.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.rohan.dto.AuthDtos.AuthResponse;
import com.rohan.dto.AuthDtos.EmailRequest;
import com.rohan.dto.AuthDtos.EmailRequestVal;
import com.rohan.dto.AuthDtos.LoginRequest;
import com.rohan.dto.AuthDtos.RegisterRequest;
import com.rohan.service.AuthService;
import com.rohan.service.OtpService;

import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {
	
	private final AuthService authService;
	private final OtpService otpService;
	
//	@GetMapping("/home")
//	ResponseEntity<String> getHome(){
//		return ResponseEntity.ok().body("Home Page");
//	}
	@PostMapping("/register")
	@Operation(summary = "Register a new user (FR-01)")
	ResponseEntity<AuthResponse> registerUser(@Valid @RequestBody RegisterRequest userDetails){
		log.info("AuthController: Inside registerUser Method");
		return ResponseEntity.ok().body(authService.registerUser(userDetails));
	}
	
	@PostMapping("/login")
	@Operation(summary = "Login into System (FR-02)")
	ResponseEntity<AuthResponse> loginUser(@RequestBody LoginRequest userDetails){
		log.info("AuthController: Inside loginUser Method");
		return ResponseEntity.ok().body(authService.loginUser(userDetails));
	}
	
	@PostMapping("/sendotp")
    public ResponseEntity<String> sendOtp(@RequestBody EmailRequest emailRequest) {
		log.info("FUll object:"+emailRequest.email());
		log.info("Email in Controller:"+emailRequest);
        otpService.sendOtp(emailRequest);
        return ResponseEntity.ok().body("Otp Sent Successfully");
    }

    @PostMapping("/verifyotp")
    public ResponseEntity<String> verifyOtp(@RequestBody EmailRequestVal emailRequest) {
    	log.info("FUll object:"+emailRequest.email());
        boolean valid = otpService.verifyOtp(emailRequest);

        if (valid) return ResponseEntity.ok().body("Otp Verified..");
        throw new RuntimeException("Invalid OTP");
    }
}
