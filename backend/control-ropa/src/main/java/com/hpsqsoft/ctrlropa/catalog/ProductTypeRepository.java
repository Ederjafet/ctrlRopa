package com.hpsqsoft.ctrlropa.catalog;

import com.hpsqsoft.ctrlropa.common.Status;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductTypeRepository extends JpaRepository<ProductType, Long> {

    Optional<ProductType> findByCode(String code);

    boolean existsByCode(String code);
    
    boolean existsByName(String name);

    List<ProductType> findByStatusOrderByNameAsc(Status status);
}