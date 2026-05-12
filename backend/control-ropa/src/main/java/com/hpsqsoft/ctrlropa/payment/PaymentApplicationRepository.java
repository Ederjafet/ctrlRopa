package com.hpsqsoft.ctrlropa.payment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentApplicationRepository extends JpaRepository<PaymentApplication, Long> {

    List<PaymentApplication> findByCustomerOrderId(Long customerOrderId);
}