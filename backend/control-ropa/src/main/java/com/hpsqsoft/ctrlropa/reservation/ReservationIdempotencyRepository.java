package com.hpsqsoft.ctrlropa.reservation;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ReservationIdempotencyRepository extends JpaRepository<ReservationIdempotencyRecord, Long> {

    Optional<ReservationIdempotencyRecord> findByCompanyIdAndBranchIdAndUserIdAndOperationAndIdempotencyKey(
            Long companyId,
            Long branchId,
            Long userId,
            String operation,
            String idempotencyKey
    );
}
