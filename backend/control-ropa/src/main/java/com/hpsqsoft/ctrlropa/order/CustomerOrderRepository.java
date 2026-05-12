package com.hpsqsoft.ctrlropa.order;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, Long> {

    List<CustomerOrder> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    List<CustomerOrder> findByBranchIdOrderByCreatedAtDesc(Long branchId);

    Optional<CustomerOrder> findFirstByCustomerIdAndBranchIdAndStatusOrderByCreatedAtDesc(
            Long customerId,
            Long branchId,
            CustomerOrderStatus status
    );
}
