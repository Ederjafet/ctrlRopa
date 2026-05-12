package com.hpsqsoft.ctrlropa.customer;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomerOwnerHistoryRepository extends JpaRepository<CustomerOwnerHistory, Long> {

    List<CustomerOwnerHistory> findByCustomerIdOrderByChangedAtDesc(Long customerId);
}