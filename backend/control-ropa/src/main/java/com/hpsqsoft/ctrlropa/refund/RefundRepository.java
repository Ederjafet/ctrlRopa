package com.hpsqsoft.ctrlropa.refund;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RefundRepository extends JpaRepository<Refund, Long> {

    List<Refund> findByCustomerReturnIdOrderByCreatedAtDesc(Long returnId);

    List<Refund> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    List<Refund> findByStatusOrderByCreatedAtDesc(RefundStatus status);
}