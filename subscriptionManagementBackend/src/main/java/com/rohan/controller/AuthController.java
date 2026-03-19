
package com.rohan.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.rohan.dto.AuthDtos.AuthResponse;
import com.rohan.dto.AuthDtos.EmailRequest;
import com.rohan.dto.AuthDtos.EmailRequestVal;
import com.rohan.dto.AuthDtos.ForgotPassRequest;
import com.rohan.dto.AuthDtos.LoginRequest;
import com.rohan.dto.AuthDtos.RegisterRequest;
import com.rohan.service.AuthService;
import com.rohan.service.OtpService;

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
	
	
	@PostMapping("/register")
	ResponseEntity<AuthResponse> registerUser(@Valid @RequestBody RegisterRequest userDetails){
		log.info("AuthController: Inside registerUser Method");
		return ResponseEntity.ok().body(authService.registerUser(userDetails));
	}
	
	@PostMapping("/login")
	ResponseEntity<AuthResponse> loginUser(@RequestBody LoginRequest userDetails){
		log.info("AuthController: Inside loginUser Method");
		return ResponseEntity.ok().body(authService.loginUser(userDetails));
	}
	
	@PostMapping("/sendotp")
	public ResponseEntity<Map<String, Object>> sendOtp(@RequestBody EmailRequest emailRequest) {
	    log.info("AuthController: Inside SendOtp method. Email: " + emailRequest.email());
	    otpService.sendOtp(emailRequest);
	    Map<String, Object> response = new HashMap<>();
	    response.put("status", "success");
	    response.put("message", "OTP sent successfully");
	    response.put("email", emailRequest.email());

	    return ResponseEntity.ok(response);
	}


	@PostMapping("/verifyotp")
	public ResponseEntity<Map<String, Object>> verifyOtp(@RequestBody EmailRequestVal emailRequest) {
	    log.info("AuthController: Inside verifyOtp method. Email: " + emailRequest.email());

	    boolean valid = otpService.verifyOtp(emailRequest);

	    Map<String, Object> response = new HashMap<>();
	    if (valid) {
	        response.put("status", "success");
	        response.put("message", "OTP verified successfully");
	    } else {
	        response.put("status", "error");
	        response.put("message", "Invalid or expired OTP");
	    }

	    return ResponseEntity.ok(response);
	}
	
	@PostMapping("/forgotpass")
	public ResponseEntity<Map<String,Object>> forgotPass(@RequestBody ForgotPassRequest userDetails){
		log.info("AuthController: Inside forgotPass method");

	    boolean valid = authService.forgotPass(userDetails);

	    Map<String, Object> response = new HashMap<>();
	    if (valid) {
	        response.put("status", "success");
	        response.put("message", "Password Reset Successfully...");
	    } else {
	        response.put("status", "error");
	        response.put("message", "Account not found!!!");
	    }

	    return ResponseEntity.ok(response);
	}
}
