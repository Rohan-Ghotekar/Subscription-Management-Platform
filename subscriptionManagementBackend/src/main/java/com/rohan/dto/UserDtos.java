package com.rohan.dto;

import java.time.LocalDateTime;

import com.rohan.entity.UserEntity;
import com.rohan.entity.UserEntity.Role;

public class UserDtos {

    public record changePassRequest(
            String oldPassword,
            String newPassword
    ) {}

    public record UserProfileResponse(
            Long userId,
            String email,
            String fullName,
            String avatarUrl,
            Role role,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {

        public static UserProfileResponse from(UserEntity u) {
            return new UserProfileResponse(
                    u.getUserId(),
                    u.getEmail(),
                    u.getFullName(),
                    u.getAvatarUrl(),   
                    u.getRole(),        
                    u.getCreatedAt(),
                    u.getUpdatedAt()
            );
        }
    }
    public record UpdateProfileDetails(String fullName,String mobile) {}
}