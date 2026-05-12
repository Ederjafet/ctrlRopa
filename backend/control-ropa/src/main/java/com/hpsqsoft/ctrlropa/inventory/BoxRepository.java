package com.hpsqsoft.ctrlropa.inventory;

import com.hpsqsoft.ctrlropa.common.Status;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BoxRepository extends JpaRepository<Box, Long> {

    Optional<Box> findByBranchIdAndCode(Long branchId, String code);

    Optional<Box> findByQrCode(String qrCode);

    boolean existsByBranchIdAndCode(Long branchId, String code);

    boolean existsByBranchIdAndCodeAndIdNot(Long branchId, String code, Long id);

    boolean existsByQrCode(String qrCode);

    boolean existsByQrCodeAndIdNot(String qrCode, Long id);

    List<Box> findByBranchIdAndStatusOrderByCodeAsc(Long branchId, Status status);

    List<Box> findByBranchIdOrderByCodeAsc(Long branchId);
}