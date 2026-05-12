package com.hpsqsoft.ctrlropa.payment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentAllocationRepository extends JpaRepository<PaymentAllocation, Long> {

    List<PaymentAllocation> findByPaymentIdOrderByCreatedAtAsc(Long paymentId);

    List<PaymentAllocation> findBySaleIdOrderByCreatedAtAsc(Long saleId);

    List<PaymentAllocation> findByReservationIdOrderByCreatedAtAsc(Long reservationId);
}