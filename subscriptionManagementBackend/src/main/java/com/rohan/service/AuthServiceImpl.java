package com.rohan.service;

import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rohan.dto.AuthDtos.AuthResponse;
import com.rohan.dto.AuthDtos.LoginRequest;
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
			return new AuthResponse("USER",userDetails.fullname(),0,"Email alread registered",false);
		}
		String token=UUID.randomUUID().toString();
		UserEntity user=UserEntity.builder()
				.email(userDetails.email())
				.password(encoder.encode(userDetails.password()))
				.fullName(userDetails.fullname())
				.role(UserEntity.Role.USER)
				.verificationToken(token)
				.loginAttempts(5)
                .accountLocked(false)
				.build();
		userRepository.save(user);
		return new AuthResponse(
				    user.getRole().name(),
	                user.getFullName(),
	                user.getLoginAttempts(),
	                "Registration successful",
	                true);
	}

	@Override
	@Transactional
	public AuthResponse loginUser(LoginRequest userDetails) {
		UserEntity user = userRepository.findByEmail(userDetails.email()).orElse(null);
		if (user == null) {
            return new AuthResponse(
                    "USER",
                    "",
                    0,
                    "Invalid email or password",
                    false
            );
        }
		if (user.isAccountLocked()) {
            return new AuthResponse(
                    user.getRole().name(),
                    user.getFullName(),
                    user.getLoginAttempts(),
                    "Account locked due to multiple failed attempts",
                    false
            );
        }
		if (!encoder.matches(userDetails.password(), user.getPassword())) {

            int attempts = user.getLoginAttempts() -1;
            user.setLoginAttempts(attempts);
            if (user.isAccountLocked()) {
                return new AuthResponse(
                        user.getRole().name(),
                        user.getFullName(),
                        attempts,
                        "Your Account Has Been Locked!!",
                        false
                );
            }

            if (attempts <= 0) {
                user.setAccountLocked(true);
            }
            userRepository.save(user);

            return new AuthResponse(
                    user.getRole().name(),
                    user.getFullName(),
                    attempts,
                    "Invalid Password!!",
                    false
            );
		}
            user.setLoginAttempts(5);
            userRepository.save(user);
            
            return new AuthResponse(
                    user.getRole().name(),
                    user.getFullName(),
                    5,
                    "Login successful",
                    true
            );
        
	}
}
