package com.hpsqsoft.ctrlropa.live;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LiveRepository extends JpaRepository<Live, Long> {

    List<Live> findByBranchIdOrderByCreatedAtDesc(Long branchId);

    List<Live> findByBranchIdAndStatusOrderByCreatedAtDesc(Long branchId, LiveStatus status);
}