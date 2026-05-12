package com.hpsqsoft.ctrlropa.consignment;

import com.hpsqsoft.ctrlropa.common.Status;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ConsigneeRepository extends JpaRepository<Consignee, Long> {

    List<Consignee> findByBranchIdOrderByNameAsc(Long branchId);

    List<Consignee> findByBranchIdAndStatusOrderByNameAsc(Long branchId, Status status);
}