package com.hpsqsoft.ctrlropa.order;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CustomerOrderItemRepository extends JpaRepository<CustomerOrderItem, Long> {

    List<CustomerOrderItem> findByCustomerOrderIdOrderByCreatedAtAsc(Long customerOrderId);

    Optional<CustomerOrderItem> findFirstByReservation_Id(Long reservationId);

    Optional<CustomerOrderItem> findFirstBySale_Id(Long saleId);

    boolean existsByReservation_Id(Long reservationId);

    boolean existsBySale_Id(Long saleId);
}
