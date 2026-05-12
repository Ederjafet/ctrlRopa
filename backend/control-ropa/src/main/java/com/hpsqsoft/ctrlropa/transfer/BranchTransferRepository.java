package com.hpsqsoft.ctrlropa.transfer;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BranchTransferRepository extends JpaRepository<BranchTransfer, Long> {

    Optional<BranchTransfer> findByFolio(String folio);

    boolean existsByFolio(String folio);

    List<BranchTransfer> findByFromBranchIdOrToBranchIdOrderByCreatedAtDesc(Long fromBranchId, Long toBranchId);

    List<BranchTransfer> findByStatusOrderByCreatedAtDesc(BranchTransferStatus status);
}