package com.hpsqsoft.ctrlropa.inventory;

import com.hpsqsoft.ctrlropa.common.Status;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StorageLocationRepository extends JpaRepository<StorageLocation, Long> {

    Optional<StorageLocation> findByBranchIdAndCode(Long branchId, String code);

    boolean existsByBranchIdAndCode(Long branchId, String code);

    boolean existsByBranchIdAndCodeAndIdNot(Long branchId, String code, Long id);

    boolean existsByBranchIdAndName(Long branchId, String name);

    boolean existsByBranchIdAndNameAndIdNot(Long branchId, String name, Long id);

    List<StorageLocation> findByBranchIdAndStatusOrderByNameAsc(Long branchId, Status status);

    List<StorageLocation> findByBranchIdOrderByNameAsc(Long branchId);
}