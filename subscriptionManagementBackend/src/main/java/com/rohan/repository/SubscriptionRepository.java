package com.rohan.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.rohan.entity.Subscription;
import com.rohan.entity.SubscriptionPlan;
import com.rohan.entity.UserEntity;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long>{
	Optional<Subscription> findByUserAndPlanAndStatus(UserEntity user,SubscriptionPlan plan ,Subscription.Status status);
	
	List<Subscription> findByUserOrderByCreatedAtDesc(UserEntity user);
	
	Subscription findByUserAndStatus(UserEntity user,Subscription.Status status);
	Optional<Subscription> findByIdAndUser(Long subId,UserEntity user);
	
	@Query("SELECT s FROM Subscription s JOIN FETCH s.user JOIN FETCH s.plan WHERE s.endDate = :date AND s.status = :status")
	List<Subscription> findExpiringSubscriptions(LocalDate date, Subscription.Status status);
}
