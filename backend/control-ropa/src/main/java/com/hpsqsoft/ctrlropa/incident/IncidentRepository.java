package com.hpsqsoft.ctrlropa.incident;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IncidentRepository extends JpaRepository<Incident, Long> {

    List<Incident> findByBranchIdOrderByCreatedAtDesc(Long branchId);

    List<Incident> findByShipmentIdOrderByCreatedAtDesc(Long shipmentId);

    List<Incident> findByStatusOrderByCreatedAtDesc(IncidentStatus status);

    List<Incident> findByBranchIdAndStatusOrderByCreatedAtDesc(Long branchId, IncidentStatus status);
}