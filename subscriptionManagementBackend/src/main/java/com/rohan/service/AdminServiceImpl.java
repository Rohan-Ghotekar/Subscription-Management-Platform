package com.rohan.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.rohan.dto.UserDtos.UserProfileResponse;
import com.rohan.entity.UserEntity;
import com.rohan.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminServiceImpl implements AdminService {
	
	private final UserRepository userRepository;
	@Override
	public List<UserProfileResponse> getAllUsers(){
		log.info("AdminServiceImpl: Inside getAllUsers method");
		List<UserEntity>allUsers= userRepository.findAll();
		if(allUsers.isEmpty())return List.of(); ;
		return allUsers.stream()
		        .map(UserProfileResponse::from)
		        .toList();
	}
}
