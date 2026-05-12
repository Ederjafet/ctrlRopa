package com.hpsqsoft.ctrlropa.payment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    List<Payment> findByBranchIdOrderByCreatedAtDesc(Long branchId);

    List<Payment> findByStatusOrderByCreatedAtDesc(PaymentStatus status);
}