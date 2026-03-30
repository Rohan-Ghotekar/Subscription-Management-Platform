package com.rohan.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.rohan.entity.Subscription;
import com.rohan.entity.Subscription.Status;
import com.rohan.entity.SubscriptionPlan;
import com.rohan.entity.UserEntity;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
	Optional<Subscription> findByUserAndPlanAndStatus(UserEntity user, SubscriptionPlan plan,
			Subscription.Status status);

	List<Subscription> findByUserOrderByCreatedAtDesc(UserEntity user);

	Subscription findByUserAndStatus(UserEntity user, Subscription.Status status);

	Optional<Subscription> findByIdAndUser(Long subId, UserEntity user);

	@Query("SELECT s FROM Subscription s JOIN FETCH s.user JOIN FETCH s.plan WHERE s.endDate = :date AND s.status = :status")
	List<Subscription> findExpiringSubscriptions(LocalDate date, Subscription.Status status);

	long countByStatus(Subscription.Status status);

	List<Subscription> findByStatusAndEndDateBetween(Subscription.Status status, LocalDate from, LocalDate to);

	@Query("SELECT COUNT(s) FROM Subscription s WHERE s.status = 'ACTIVE' AND s.startDate >= :since")
	long countNewSince(@Param("since") LocalDate since);

	Page<Subscription> findByPlanOrderByCreatedAtDesc(SubscriptionPlan plan, Pageable pageable);

	List<Subscription> findByEndDateLessThanEqualAndStatus(LocalDate today, Subscription.Status status);

	Optional<UserEntity> findActiveByUserEmailAndPlanId(String userEmail, Long planId);

	@Query("""
			    SELECT s FROM Subscription s
			    WHERE s.user.id = :userId
			    AND s.plan.id = :planId
			    AND s.status = :status
			""")
	Optional<Subscription> findActiveSub(@Param("userId") Long userId, @Param("planId") Long planId,
			@Param("status") Subscription.Status status);

	Optional<UserEntity> findByUserAndPlan(UserEntity user, SubscriptionPlan plan);

	Optional<UserEntity> findActiveByUserEmailAndPlanIdAndStatus(String userEmail, Long planId,
			Subscription.Status status);
}
