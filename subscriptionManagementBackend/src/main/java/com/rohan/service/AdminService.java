package com.rohan.service;

import java.util.List;

import com.rohan.dto.UserDtos.UserProfileResponse;

public interface AdminService {

	List<UserProfileResponse> getAllUsers();

}