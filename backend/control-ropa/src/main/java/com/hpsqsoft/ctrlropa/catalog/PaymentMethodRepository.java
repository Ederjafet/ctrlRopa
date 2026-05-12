package com.hpsqsoft.ctrlropa.catalog;

import com.hpsqsoft.ctrlropa.common.Status;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentMethodRepository extends JpaRepository<PaymentMethod, Long> {

    Optional<PaymentMethod> findByCode(String code);

    boolean existsByCode(String code);
    
    boolean existsByName(String name);

    List<PaymentMethod> findByStatusOrderByNameAsc(Status status);
}