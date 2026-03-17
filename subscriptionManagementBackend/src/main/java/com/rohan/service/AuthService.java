package com.rohan.service;

import com.rohan.dto.AuthDtos.AuthResponse;
import com.rohan.dto.AuthDtos.LoginRequest;
import com.rohan.dto.AuthDtos.RegisterRequest;

public interface AuthService {

	AuthResponse registerUser(RegisterRequest userDetails);
	AuthResponse loginUser(LoginRequest userDetails);
}