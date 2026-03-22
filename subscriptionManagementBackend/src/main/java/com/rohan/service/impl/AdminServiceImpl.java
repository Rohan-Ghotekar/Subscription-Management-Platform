package com.rohan.service.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.rohan.dto.AnalyticsDtos.AnalyticsSummaryResponse;
import com.rohan.dto.AnalyticsDtos.GrowthDataResponse;
import com.rohan.dto.AnalyticsDtos.PlanDistributionResponse;
import com.rohan.dto.UserDtos.UserProfileResponse;
import com.rohan.entity.Subscription;
import com.rohan.entity.SubscriptionPlan;
import com.rohan.entity.UserEntity;
import com.rohan.repository.PlanRepository;
import com.rohan.repository.SubscriptionRepository;
import com.rohan.repository.UserRepository;
import com.rohan.service.AdminService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminServiceImpl implements AdminService {
	
	private final UserRepository userRepository;
	private final SubscriptionRepository subRepository;
	private final PlanRepository planRepository;
	
	@Override
	public List<UserProfileResponse> getAllUsers(){
		log.info("AdminServiceImpl: Inside getAllUsers method");
		List<UserEntity>allUsers= userRepository.findAll();
		if(allUsers.isEmpty())return List.of(); ;
		return allUsers.stream()
		        .map(UserProfileResponse::from)
		        .toList();
	}
	
	@Override
	public AnalyticsSummaryResponse getSummary(LocalDate from, LocalDate to) {

	    LocalDate startDate = (from != null) ? from : LocalDate.now().withDayOfMonth(1);
	    LocalDate endDate   = (to != null)   ? to   : LocalDate.now();

	    long active    = subRepository.countByStatus(Subscription.Status.ACTIVE);
	    long expired   = subRepository.countByStatus(Subscription.Status.EXPIRED);
	    long cancelled = subRepository.countByStatus(Subscription.Status.CANCELLED);
	    long total     = active + expired + cancelled;

	    double churnRate = total > 0
	            ? BigDecimal.valueOf((expired + cancelled) * 100.0 / total)
	                       .setScale(2, RoundingMode.HALF_UP).doubleValue()
	            : 0.0;

	    BigDecimal mrr = subRepository
	            .findByStatusAndEndDateBetween(
	                    Subscription.Status.ACTIVE,
	                    startDate,
	                    endDate)
	            .stream()
	            .map(s -> toMonthlyAmount(s.getPlan()))
	            .reduce(BigDecimal.ZERO, BigDecimal::add);

	    long newThisMonth = subRepository
	            .countNewSince(startDate);

	    long renewals = subRepository
	            .findByStatusAndEndDateBetween(
	                    Subscription.Status.ACTIVE,
	                    startDate,
	                    endDate)
	            .size();

	    return new AnalyticsSummaryResponse(active, mrr, churnRate, newThisMonth, renewals);
	}
	
	private BigDecimal toMonthlyAmount(SubscriptionPlan plan) {
        return switch (plan.getBillingInterval()) {
            case MONTHLY   -> plan.getPrice();
            case QUARTERLY -> plan.getPrice().divide(BigDecimal.valueOf(3), 2, RoundingMode.HALF_UP);
            case ANNUALLY    -> plan.getPrice().divide(BigDecimal.valueOf(12), 2, RoundingMode.HALF_UP);
        };
    }
	
	@Override
	public List<GrowthDataResponse> getMonthlyGrowth() {
		DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM yyyy");
        return IntStream.rangeClosed(0, 11)
                .mapToObj(i -> {
                    LocalDate monthStart = LocalDate.now()
                            .minusMonths(11 - i).withDayOfMonth(1);
                    long count = subRepository.countNewSince(monthStart);
                    return new GrowthDataResponse(monthStart.format(fmt), count);
                })
                .collect(Collectors.toList());
	}
	
	@Override
	public List<PlanDistributionResponse> getPlanDistribution() {
		List<SubscriptionPlan> plans = planRepository.findByActiveTrue();
        long total = subRepository.countByStatus(Subscription.Status.ACTIVE);

        return plans.stream().map(plan -> {
            long count = subRepository
                    .findByPlanOrderByCreatedAtDesc(plan, Pageable.unpaged())
                    .stream()
                    .filter(s -> s.getStatus() == Subscription.Status.ACTIVE)
                    .count();
            double pct = total > 0
                    ? BigDecimal.valueOf(count * 100.0 / total)
                               .setScale(1, RoundingMode.HALF_UP).doubleValue()
                    : 0.0;
            return new PlanDistributionResponse(plan.getName(), count, pct);
        }).collect(Collectors.toList());
	}
}
