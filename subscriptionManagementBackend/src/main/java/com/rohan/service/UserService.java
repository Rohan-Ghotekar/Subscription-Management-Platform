package com.rohan.service;

import org.springframework.web.multipart.MultipartFile;

import com.rohan.dto.UserDtos.UpdateProfileDetails;
import com.rohan.dto.UserDtos.UserProfileResponse;
import com.rohan.dto.UserDtos.changePassRequest;

public interface UserService {

	boolean changePass(String email,changePassRequest userDetails);

	UserProfileResponse getProfile(String email);

	UserProfileResponse updateProfile(String email, UpdateProfileDetails details);

	UserProfileResponse updateProfilePhoto(String email, MultipartFile avatar);

}