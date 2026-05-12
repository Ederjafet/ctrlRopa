package com.hpsqsoft.ctrlropa.consignment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ConsignmentSettlementItemRepository extends JpaRepository<ConsignmentSettlementItem, Long> {

    List<ConsignmentSettlementItem> findByConsignmentSettlementIdOrderByCreatedAtAsc(Long settlementId);
}