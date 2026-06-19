package com.hpsqsoft.ctrlropa.customerpackage;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CustomerPackageRepository extends JpaRepository<CustomerPackage, Long> {

    Optional<CustomerPackage> findByFolio(String folio);

    List<CustomerPackage> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    List<CustomerPackage> findByBranchIdOrderByCreatedAtDesc(Long branchId);

    boolean existsByFolio(String folio);
}
