package com.hpsqsoft.ctrlropa.cash;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CashExpenseRepository extends JpaRepository<CashExpense, Long> {

    List<CashExpense> findByCashClosureIdOrderByCreatedAtAsc(Long cashClosureId);

    List<CashExpense> findByBranchIdAndExpenseDateAndStatusOrderByCreatedAtAsc(
            Long branchId,
            LocalDate expenseDate,
            CashExpenseStatus status
    );
}