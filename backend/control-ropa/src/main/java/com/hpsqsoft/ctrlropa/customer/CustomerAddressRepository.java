package com.hpsqsoft.ctrlropa.customer;

import com.hpsqsoft.ctrlropa.common.Status;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomerAddressRepository extends JpaRepository<CustomerAddress, Long> {

    List<CustomerAddress> findByCustomerIdOrderByIsDefaultDescLabelAsc(Long customerId);

    List<CustomerAddress> findByCustomerIdAndStatusOrderByIsDefaultDescLabelAsc(Long customerId, Status status);

    boolean existsByCustomerIdAndLabel(Long customerId, String label);
}