package com.hpsqsoft.ctrlropa.item;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    long countByCompanyIdAndBatchId(Long companyId, Long batchId);

    List<Item> findByCompanyIdAndStorageLocationIdOrderByCreatedAtDesc(Long companyId, Long storageLocationId);

    @Modifying(flushAutomatically = true)
    @Query("""
            update Item item
            set item.status = :reservedStatus
            where item.company.id = :companyId
              and item.branch.id = :branchId
              and item.id = :itemId
              and item.status = :availableStatus
            """)
    int reserveIfAvailable(@Param("companyId") Long companyId,
                           @Param("branchId") Long branchId,
                           @Param("itemId") Long itemId,
                           @Param("availableStatus") ItemStatus availableStatus,
                           @Param("reservedStatus") ItemStatus reservedStatus);

    @Modifying(flushAutomatically = true)
    @Query("""
            update Item item
            set item.status = :availableStatus
            where item.company.id = :companyId
              and item.branch.id = :branchId
              and item.id = :itemId
              and item.status = :reservedStatus
            """)
    int releaseIfReserved(@Param("companyId") Long companyId,
                          @Param("branchId") Long branchId,
                          @Param("itemId") Long itemId,
                          @Param("reservedStatus") ItemStatus reservedStatus,
                          @Param("availableStatus") ItemStatus availableStatus);

    Optional<Item> findByCode(String code);

    Optional<Item> findByQrCode(String qrCode);

    boolean existsByCode(String code);

    boolean existsByQrCode(String qrCode);

    List<Item> findByBranchIdOrderByCreatedAtDesc(Long branchId);

    List<Item> findByBatchIdOrderByCreatedAtAsc(Long batchId);

    long countByBatchId(Long batchId);

    List<Item> findByStorageLocationIdOrderByCreatedAtDesc(Long storageLocationId);
}
