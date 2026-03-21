package com.rohan.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name="subscriptions")
public class Subscription {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	
	@ManyToOne(fetch=FetchType.LAZY)
	@JoinColumn(name="user_id",nullable=false)
	private UserEntity user;
	
	@ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
	private SubscriptionPlan plan;
	
	@Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;
	
	@Column(nullable = false)
    private LocalDate startDate;
	
	@Column(nullable = false)
    private LocalDate endDate;
	
	@Column(nullable = false)
    private boolean autoRenew;
	
	@CreationTimestamp
    private LocalDateTime createdAt;
	
	@UpdateTimestamp
    private LocalDateTime updatedAt;
	
	@Builder.Default
	private boolean reminderSent=false;
	
	public enum Status { ACTIVE, EXPIRED, CANCELLED, PENDING }
}
