package com.hpsqsoft.ctrlropa.cash;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Collection;

public interface CashClosureRepository extends JpaRepository<CashClosure, Long> {

    Optional<CashClosure> findByBranchIdAndClosureDate(Long branchId, LocalDate closureDate);

    boolean existsByBranchIdAndClosureDateAndStatusIn(
            Long branchId,
            LocalDate closureDate,
            Collection<CashClosureStatus> statuses
    );

    List<CashClosure> findByBranchIdOrderByClosureDateDesc(Long branchId);
}