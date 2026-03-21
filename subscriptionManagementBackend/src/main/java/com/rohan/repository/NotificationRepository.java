package com.rohan.repository;

import java.time.LocalDateTime;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.rohan.entity.NotificationEntity;

@Repository
public interface NotificationRepository extends JpaRepository<NotificationEntity, Long>{
	void deleteByReadTrueAndCreatedAtBefore(LocalDateTime time);
}
