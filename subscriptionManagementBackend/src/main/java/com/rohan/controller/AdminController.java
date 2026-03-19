package com.rohan.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.rohan.dto.UserDtos.UserProfileResponse;
import com.rohan.service.AdminService;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
@SecurityRequirement(name = "bearerAuth")
public class AdminController {
	
	private final AdminService adminService;
	
	@GetMapping("/getallusers")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<List<UserProfileResponse>> getAllUsers(){
		log.info("AdminController: Inside getAllUsers method");
		return ResponseEntity.ok(adminService.getAllUsers());
	}
	
}
