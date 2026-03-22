package com.rohan.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.rohan.dto.NotificationResponse;
import com.rohan.service.NotificationService;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/notification")
@RequiredArgsConstructor
@Slf4j
@SecurityRequirement(name="bearerAuth")
public class NotificationController {
	
	private final NotificationService notificationService;
	
	@PutMapping("/read/{notificationId}")
	public ResponseEntity<Map<String,Boolean>> readNotification(
				@AuthenticationPrincipal UserDetails userDetails,
				@PathVariable Long notificationId){
		log.info("NotificationController: Inside readNotification method");
		Map<String, Boolean> response=new HashMap<>();
		response.put("success", notificationService.readNotification(userDetails.getUsername(),notificationId));
		return ResponseEntity.ok(response);
	}
	
	@PutMapping("/readall")
	public ResponseEntity<Map<String,Boolean>> readAllNotification(
				@AuthenticationPrincipal UserDetails userDetails){
		log.info("NotificationController: Inside readAllNotification method");
		Map<String, Boolean> response=new HashMap<>();
		response.put("success", notificationService.readAllNotification(userDetails.getUsername()));
		return ResponseEntity.ok(response);
	}
	
	@GetMapping("/getallnotifications")
	public ResponseEntity<List<NotificationResponse>> getAllNotitfications(
			@AuthenticationPrincipal UserDetails userDetails){
		return ResponseEntity.ok(notificationService.getAllNotifications(userDetails.getUsername()));
	}

}
