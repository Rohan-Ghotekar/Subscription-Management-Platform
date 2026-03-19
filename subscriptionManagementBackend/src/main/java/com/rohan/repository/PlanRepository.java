package com.rohan.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.rohan.entity.SubscriptionPlan;

@Repository
public interface PlanRepository extends JpaRepository<SubscriptionPlan, Long>{
	boolean existsByName(String name);
	Optional<SubscriptionPlan> findByName(String name);
}
