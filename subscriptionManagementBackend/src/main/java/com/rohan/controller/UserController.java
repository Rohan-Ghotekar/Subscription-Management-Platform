package com.rohan.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.rohan.dto.UserDtos.UpdateProfileDetails;
import com.rohan.dto.UserDtos.UserProfileResponse;
import com.rohan.dto.UserDtos.changePassRequest;
import com.rohan.service.UserService;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
@Slf4j
@SecurityRequirement(name = "bearerAuth")
public class UserController {
	
	private final UserService userService;
	
    @GetMapping("/profile")
    public ResponseEntity<UserProfileResponse> getProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userService.getProfile(userDetails.getUsername()));
    }
	
	@PutMapping("/changepassword")
	public ResponseEntity<Map<String,Object>> changePassword(
			@AuthenticationPrincipal UserDetails userDetails,
			@RequestBody changePassRequest details){
		log.info("UserController: Inside ChangePass method");
	    boolean valid = userService.changePass(userDetails.getUsername(),details);

	    Map<String, Object> response = new HashMap<>();
	    if (valid) {
	        response.put("status", "success");
	        response.put("message", "Password Change Successfully...");
	    } else {
	        response.put("status", "error");
	        response.put("message", "Incorrect Old Password!!!");
	    }
	    return ResponseEntity.ok(response);
	}
	
	@PutMapping("/updateprofile")
	public ResponseEntity<UserProfileResponse> updateProfile(
			@AuthenticationPrincipal UserDetails userDetails,
			@RequestBody UpdateProfileDetails details){
			return ResponseEntity.ok(userService.updateProfile(userDetails.getUsername(),details));
	}
}
