package com.rohan.service.impl;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rohan.dto.AuthDtos.AuthResponse;
import com.rohan.dto.AuthDtos.ForgotPassRequest;
import com.rohan.dto.AuthDtos.LoginRequest;
import com.rohan.dto.AuthDtos.RefreshResponse;
import com.rohan.dto.AuthDtos.RegisterRequest;
import com.rohan.entity.UserEntity;
import com.rohan.repository.UserRepository;
import com.rohan.security.JwtService;
import com.rohan.service.AuthService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
	
	private final UserRepository userRepository;
	private final PasswordEncoder encoder;
	private final JwtService jwtService;
	
	@Override
	@Transactional
	public AuthResponse registerUser(RegisterRequest userDetails) {
		if(userRepository.existsByEmail(userDetails.email())) {
			return new AuthResponse(null,
				    null,
				    "USER",
				    userDetails.fullName(),
				    null,
				    0,
				    "Email already registered",
				    false
				    );
		}
		String token=UUID.randomUUID().toString();
		UserEntity user=UserEntity.builder()
				.email(userDetails.email())
				.password(encoder.encode(userDetails.password()))
				.fullName(userDetails.fullName())
				.role(UserEntity.Role.USER)
				.verificationToken(token)
				.mobile(userDetails.mobile())
				.loginAttempts(5)
                .accountLocked(false)
				.build();
		userRepository.save(user);
		String accessToken  = jwtService.generateAccessToken(user.getEmail(), user.getRole().name());
        String refreshToken = jwtService.generateRefreshToken(user.getEmail());
		return new AuthResponse(
					accessToken, refreshToken,
				    user.getRole().name(),
	                user.getFullName(),
	                user.getAvatarUrl(),
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
            		  null,
            		    null,
            		    "USER",
            		    "",
            		    null,
            		    0,
            		    "Invalid email address!! Please Enter Valid Email...",
            		    false
            );
        }
		log.info("AuthServiceImpl: AccountLocked:"+user.isAccountLocked());
		if (user.isAccountLocked()) {
            return new AuthResponse(
            		 null,
            		    null,
            		    user.getRole().name(),
            		    user.getFullName(),
            		    user.getAvatarUrl(),
            		    user.getLoginAttempts(),
            		    "Account locked due to multiple failed attempts",
            		    false
            );
        }
		if (!encoder.matches(userDetails.password(), user.getPassword())) {

            int attempts = user.getLoginAttempts() -1;
            user.setLoginAttempts(attempts);

            if (attempts <= 0) {
                user.setAccountLocked(true);
            }
            userRepository.save(user);

            return new AuthResponse(
            		 null,
            		    null,
            		    user.getRole().name(),
            		    user.getFullName(),
            		    user.getAvatarUrl(),
            		    attempts,
            		    "Invalid Password!!",
            		    false
            );
		}
            user.setLoginAttempts(5);
            userRepository.save(user);
            
            String accessToken  = jwtService.generateAccessToken(user.getEmail(), user.getRole().name());
            String refreshToken = jwtService.generateRefreshToken(user.getEmail());

            return new AuthResponse(
                accessToken,
                refreshToken,
                user.getRole().name(),
                user.getFullName(),
                user.getAvatarUrl(),
                5,
                "Login successful",
                true
            );
	}

	@Override
	public boolean forgotPass(ForgotPassRequest userDetails) {
		Optional<UserEntity> optional=userRepository.findByEmail(userDetails.email());
		if(optional.isEmpty()) {
			return false;
		}
		UserEntity user=optional.get();
		user.setPassword(encoder.encode(userDetails.newPassword()));
		userRepository.save(user);
		return true;
	}

	@Override
	public RefreshResponse refresh(String refreshToken) {
		String email=jwtService.extractUsername(refreshToken);
		Optional<UserEntity> user=userRepository.findByEmail(email);
		if(user.isEmpty()) {
			throw new IllegalArgumentException("User Not Found!!");
		}
		String newAccessToken=jwtService.generateAccessToken(user.get().getEmail(),user.get().getRole().name());
		return new RefreshResponse(newAccessToken,refreshToken,user.get().getEmail(),user.get().getFullName());
	}

	@Override
	public Map<String, Object> verifyEmail(String email) {
		Optional<UserEntity> optional=userRepository.findByEmail(email);
		Map<String, Object> response = new HashMap<>();
		if(!optional.isEmpty()) {
			response.put("success", false);
			response.put("message", "Email Already Register..Try Login.");
			return response;
		}
		response.put("success", true);
		response.put("message", "New Email..");
		return response;
	}
}
