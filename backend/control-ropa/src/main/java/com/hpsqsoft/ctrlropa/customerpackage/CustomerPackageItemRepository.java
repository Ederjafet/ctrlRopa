package com.hpsqsoft.ctrlropa.customerpackage;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CustomerPackageItemRepository extends JpaRepository<CustomerPackageItem, Long> {

    List<CustomerPackageItem> findByCustomerPackageIdOrderByCreatedAtAsc(Long customerPackageId);

    List<CustomerPackageItem> findByItemIdOrderByCreatedAtDesc(Long itemId);

    boolean existsByCustomerPackageIdAndItemId(Long customerPackageId, Long itemId);

    boolean existsBySaleId(Long saleId);

    boolean existsByReservationId(Long reservationId);

    Optional<CustomerPackageItem> findFirstBySaleId(Long saleId);

    Optional<CustomerPackageItem> findFirstByReservationId(Long reservationId);
}
