package com.rohan.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDtos {

	public record RegisterRequest(
			@NotBlank @Email String email,
			@NotBlank @Size(min=8, message="Password must be at least 8 characters")
			String password,
			@NotBlank String fullname
			) {}
	
	public record AuthResponse(
//			String accessToken,
//			String refreshToken,
			String role,
			String fullName
			) {}
	
	public record EmailRequest(String email) {}
	
	public record EmailRequestVal(String email,String otp) {}
}
