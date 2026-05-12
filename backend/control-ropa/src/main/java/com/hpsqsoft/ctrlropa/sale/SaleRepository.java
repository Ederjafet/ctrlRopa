package com.hpsqsoft.ctrlropa.sale;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SaleRepository extends JpaRepository<Sale, Long> {

    List<Sale> findByBranchIdOrderByCreatedAtDesc(Long branchId);

    List<Sale> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    boolean existsByItemIdAndStatus(Long itemId, SaleStatus status);

    List<Sale> findByCustomerOrderIdOrderByCreatedAtAsc(Long customerOrderId);
    
    Optional<Sale> findByItemIdAndStatus(Long itemId, SaleStatus status);
}