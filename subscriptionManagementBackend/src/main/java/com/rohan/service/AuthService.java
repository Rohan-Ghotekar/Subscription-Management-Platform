package com.rohan.service;


import java.util.Map;

import org.jspecify.annotations.Nullable;

import com.rohan.dto.AuthDtos.AuthResponse;
import com.rohan.dto.AuthDtos.ForgotPassRequest;
import com.rohan.dto.AuthDtos.LoginRequest;
import com.rohan.dto.AuthDtos.RefreshResponse;
import com.rohan.dto.AuthDtos.RegisterRequest;

public interface AuthService {

	AuthResponse registerUser(RegisterRequest userDetails);
	AuthResponse loginUser(LoginRequest userDetails);
	boolean forgotPass(ForgotPassRequest userDetails);
	RefreshResponse refresh(String refreshToken);
	Map<String,Object> verifyEmail(String email);
}