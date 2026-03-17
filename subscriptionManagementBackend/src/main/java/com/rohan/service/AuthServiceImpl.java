package com.rohan.service;

import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rohan.dto.AuthDtos.AuthResponse;
import com.rohan.dto.AuthDtos.RegisterRequest;
import com.rohan.entity.UserEntity;
import com.rohan.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
	
	private final UserRepository userRepository;
	private final PasswordEncoder encoder;
	
	@Override
	@Transactional
	public AuthResponse registerUser(RegisterRequest userDetails) {
		if(userRepository.existsByEmail(userDetails.email())) {
			throw new IllegalArgumentException("Email already register.");
		}
		String token=UUID.randomUUID().toString();
		UserEntity user=UserEntity.builder()
				.email(userDetails.email())
				.password(encoder.encode(userDetails.password()))
				.fullName(userDetails.fullname())
				.role(UserEntity.Role.USER)
				.verificationToken(token)
				.build();
		return null;
	}
}
