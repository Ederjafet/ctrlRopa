package com.hpsqsoft.ctrlropa.item;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ItemRepository extends JpaRepository<Item, Long> {

    Optional<Item> findByCompanyIdAndId(Long companyId, Long id);

    Optional<Item> findByCompanyIdAndCode(Long companyId, String code);

    Optional<Item> findByCompanyIdAndQrCode(Long companyId, String qrCode);

    boolean existsByCompanyIdAndCode(Long companyId, String code);

    boolean existsByCompanyIdAndQrCode(Long companyId, String qrCode);

    List<Item> findByCompanyIdAndBranchIdOrderByCreatedAtDesc(Long companyId, Long branchId);

    List<Item> findByCompanyIdAndBatchIdOrderByCreatedAtAsc(Long companyId, Long batchId);

    List<Item> findByCompanyIdAndStorageLocationIdOrderByCreatedAtDesc(Long companyId, Long storageLocationId);

    Optional<Item> findByCode(String code);

    Optional<Item> findByQrCode(String qrCode);

    boolean existsByCode(String code);

    boolean existsByQrCode(String qrCode);

    List<Item> findByBranchIdOrderByCreatedAtDesc(Long branchId);

    List<Item> findByBatchIdOrderByCreatedAtAsc(Long batchId);

    List<Item> findByStorageLocationIdOrderByCreatedAtDesc(Long storageLocationId);
}
