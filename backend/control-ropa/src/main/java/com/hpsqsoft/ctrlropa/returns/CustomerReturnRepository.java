package com.hpsqsoft.ctrlropa.returns;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomerReturnRepository extends JpaRepository<CustomerReturn, Long> {

    List<CustomerReturn> findBySaleIdOrderByCreatedAtDesc(Long saleId);

    List<CustomerReturn> findByStatusOrderByCreatedAtDesc(ReturnStatus status);
    
    boolean existsBySaleIdAndStatus(Long saleId, ReturnStatus status);
}