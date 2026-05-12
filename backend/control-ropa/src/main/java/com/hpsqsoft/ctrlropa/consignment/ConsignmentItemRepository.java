package com.hpsqsoft.ctrlropa.consignment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ConsignmentItemRepository extends JpaRepository<ConsignmentItem, Long> {

    List<ConsignmentItem> findByConsignmentIdOrderByCreatedAtAsc(Long consignmentId);

    Optional<ConsignmentItem> findByConsignmentIdAndItemId(Long consignmentId, Long itemId);

    @Query("""
           select count(ci) > 0
           from ConsignmentItem ci
           where ci.item.id = :itemId
             and ci.status = com.hpsqsoft.ctrlropa.consignment.ConsignmentItemStatus.OUT_ON_CONSIGNMENT
           """)
    boolean existsActiveByItemId(Long itemId);
}