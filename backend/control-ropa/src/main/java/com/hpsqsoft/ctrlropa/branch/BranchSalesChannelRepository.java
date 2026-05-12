package com.hpsqsoft.ctrlropa.branch;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface BranchSalesChannelRepository extends JpaRepository<BranchSalesChannel, Long> {

    Optional<BranchSalesChannel> findByBranchIdAndSalesChannelId(Long branchId, Long salesChannelId);

    @Query("""
            select bsc
            from BranchSalesChannel bsc
            where bsc.branch.id = :branchId
              and bsc.salesChannel.status = com.hpsqsoft.ctrlropa.common.Status.ACTIVE
              and bsc.salesChannel.globalEnabled = true
            order by bsc.salesChannel.name asc
            """)
    List<BranchSalesChannel> findConfigurableByBranchId(Long branchId);

    boolean existsByBranchIdAndSalesChannelId(Long branchId, Long salesChannelId);
}
