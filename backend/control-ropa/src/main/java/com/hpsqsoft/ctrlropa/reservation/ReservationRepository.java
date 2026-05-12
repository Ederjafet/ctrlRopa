package com.hpsqsoft.ctrlropa.reservation;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    List<Reservation> findByBranchIdOrderByCreatedAtDesc(Long branchId);

    List<Reservation> findByBranchIdAndStatusOrderByCreatedAtDesc(Long branchId, ReservationStatus status);

    List<Reservation> findByCustomerIdAndStatusOrderByCreatedAtDesc(Long customerId, ReservationStatus status);

    List<Reservation> findByBoxIdOrderByCreatedAtAsc(Long boxId);

    List<Reservation> findByBoxIsNullAndBranchIdAndStatusOrderByCreatedAtDesc(Long branchId, ReservationStatus status);

    Optional<Reservation> findByItemIdAndStatus(Long itemId, ReservationStatus status);
}