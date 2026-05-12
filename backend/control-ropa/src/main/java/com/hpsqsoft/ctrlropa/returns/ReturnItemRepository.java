package com.hpsqsoft.ctrlropa.returns;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ReturnItemRepository extends JpaRepository<ReturnItem, Long> {

    List<ReturnItem> findByCustomerReturnIdOrderByCreatedAtAsc(Long returnId);

    @Query("""
           select count(ri) > 0
           from ReturnItem ri
           where ri.item.id = :itemId
             and ri.customerReturn.status = com.hpsqsoft.ctrlropa.returns.ReturnStatus.OPEN
           """)
    boolean existsOpenReturnForItem(Long itemId);

    @Query("""
           select count(ri) > 0
           from ReturnItem ri
           where ri.item.id = :itemId
             and ri.customerReturn.status = com.hpsqsoft.ctrlropa.returns.ReturnStatus.OPEN
             and ri.customerReturn.id <> :currentReturnId
           """)
    boolean existsOpenReturnForItemExcludingReturn(Long itemId, Long currentReturnId);
    
    boolean existsByCustomerReturnIdAndItemId(Long returnId, Long itemId);
}