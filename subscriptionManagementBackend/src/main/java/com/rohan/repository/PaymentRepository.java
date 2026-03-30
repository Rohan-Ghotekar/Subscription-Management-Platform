package com.rohan.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.rohan.entity.Payment;
import com.rohan.entity.Payment.PaymentStatus;


@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByUserEmailOrderByCreatedAtDesc(String userEmail);


    Optional<Payment> findByStripeSessionId(String sessionId);


    boolean existsByUserEmailAndPlanIdAndStatus(String userEmail, Long planId, PaymentStatus status);


    Page<Payment> findAllByOrderByCreatedAtDesc(Pageable pageable);
}