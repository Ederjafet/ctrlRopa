package com.hpsqsoft.ctrlropa.balance;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomerBalanceMovementRepository extends JpaRepository<CustomerBalanceMovement, Long> {

    List<CustomerBalanceMovement> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    List<CustomerBalanceMovement> findByCustomerOrderIdAndTypeOrderByCreatedAtAsc(
            Long customerOrderId,
            CustomerBalanceMovementType type
    );

    List<CustomerBalanceMovement> findByPaymentIdAndTypeOrderByCreatedAtAsc(
            Long paymentId,
            CustomerBalanceMovementType type
    );
}