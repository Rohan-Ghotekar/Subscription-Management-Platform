package com.rohan.service.impl;

import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.rohan.dto.UserDtos.UpdateProfileDetails;
import com.rohan.dto.UserDtos.UserProfileResponse;
import com.rohan.dto.UserDtos.changePassRequest;
import com.rohan.entity.UserEntity;
import com.rohan.repository.UserRepository;
import com.rohan.service.UserService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
	
	private final UserRepository userRepository;
	private final PasswordEncoder encoder;
	
	@Override
	public UserProfileResponse getProfile(String email) {
		Optional<UserEntity>optional=userRepository.findByEmail(email);
        return UserProfileResponse.from(optional.get());
    }
	
	@Override
	public boolean changePass(String email,changePassRequest userDetails) {
		Optional<UserEntity> optional=userRepository.findByEmail(email);
		if(optional.isEmpty()) {
			return false;
		}
		UserEntity user=optional.get();
		if(encoder.matches(userDetails.oldPassword(), user.getPassword())) {
			user.setPassword(encoder.encode(userDetails.newPassword()));
			userRepository.save(user);
			return true;
		}
		return false;
	}
	
	@Override
	public UserProfileResponse updateProfile(String email,UpdateProfileDetails details) {
		Optional<UserEntity>optional=userRepository.findByEmail(email);
		if(optional.isEmpty())return null;
        UserEntity user=optional.get();
        if(details.fullName()!=null && !details.fullName().isBlank()) {
        	user.setFullName(details.fullName());
        }
        if(details.mobile()!=null && !details.mobile().isBlank()) {
        	user.setMobile(details.mobile());
        }
        userRepository.save(user);
        return UserProfileResponse.from(user);
    }
}
