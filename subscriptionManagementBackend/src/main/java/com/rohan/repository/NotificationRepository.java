package com.rohan.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.rohan.entity.NotificationEntity;
import com.rohan.entity.UserEntity;

@Repository
public interface NotificationRepository extends JpaRepository<NotificationEntity, Long>{
	void deleteByReadTrueAndReadAtBefore(LocalDateTime time);
	
	Optional<NotificationEntity> findByIdAndUser(Long id, UserEntity user);
	
	List<NotificationEntity> findByUser(UserEntity user);
}
