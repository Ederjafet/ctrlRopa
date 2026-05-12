package com.hpsqsoft.ctrlropa.batch;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BatchRepository extends JpaRepository<Batch, Long> {

    Optional<Batch> findByFolio(String folio);

    boolean existsByFolio(String folio);

    List<Batch> findByBranchIdOrderByCreatedAtDesc(Long branchId);
}