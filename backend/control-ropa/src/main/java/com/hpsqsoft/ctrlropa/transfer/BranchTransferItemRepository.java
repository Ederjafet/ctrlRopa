package com.hpsqsoft.ctrlropa.transfer;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface BranchTransferItemRepository extends JpaRepository<BranchTransferItem, Long> {

    List<BranchTransferItem> findByBranchTransferIdOrderByIdAsc(Long branchTransferId);

    Optional<BranchTransferItem> findByBranchTransferIdAndItemId(Long branchTransferId, Long itemId);

    @Query("""
           select count(bti) > 0
           from BranchTransferItem bti
           where bti.item.id = :itemId
             and bti.branchTransfer.status in :statuses
           """)
    boolean existsInActiveTransfer(Long itemId, List<BranchTransferStatus> statuses);
}