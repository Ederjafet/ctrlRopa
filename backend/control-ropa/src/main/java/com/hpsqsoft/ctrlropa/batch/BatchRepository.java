package com.hpsqsoft.ctrlropa.batch;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BatchRepository extends JpaRepository<Batch, Long> {

    Optional<Batch> findByCompanyIdAndId(Long companyId, Long id);

    Optional<Batch> findByCompanyIdAndFolio(Long companyId, String folio);

    boolean existsByCompanyIdAndFolio(Long companyId, String folio);

    List<Batch> findByCompanyIdAndBranchIdOrderByCreatedAtDesc(Long companyId, Long branchId);

    Optional<Batch> findByFolio(String folio);

    boolean existsByFolio(String folio);

    List<Batch> findByBranchIdOrderByCreatedAtDesc(Long branchId);
}
