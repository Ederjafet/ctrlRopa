package com.hpsqsoft.ctrlropa.consignment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ConsignmentRepository extends JpaRepository<Consignment, Long> {

    Optional<Consignment> findByFolio(String folio);

    boolean existsByFolio(String folio);

    List<Consignment> findByBranchIdOrderByCreatedAtDesc(Long branchId);

    List<Consignment> findByStatusOrderByCreatedAtDesc(ConsignmentStatus status);
}