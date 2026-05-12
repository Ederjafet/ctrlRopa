package com.hpsqsoft.ctrlropa.incident;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class IncidentService {

    private final IncidentRepository repository;

    public IncidentService(IncidentRepository repository) {
        this.repository = repository;
    }

    public void createCollectionIncident(Long branchId,
                                         Long shipmentId,
                                         Long shipmentPackageId,
                                         Long customerId,
                                         Long customerOrderId,
                                         BigDecimal expectedAmount,
                                         BigDecimal receivedAmount,
                                         Long createdByUserId) {
        if (expectedAmount == null || receivedAmount == null) {
            return;
        }

        BigDecimal difference = receivedAmount.subtract(expectedAmount);
        if (difference.compareTo(BigDecimal.ZERO) == 0) {
            return;
        }

        Incident incident = new Incident();
        incident.setBranchId(branchId);
        incident.setShipmentId(shipmentId);
        incident.setShipmentPackageId(shipmentPackageId);
        incident.setCustomerId(customerId);
        incident.setCustomerOrderId(customerOrderId);
        incident.setExpectedAmount(expectedAmount);
        incident.setReceivedAmount(receivedAmount);
        incident.setDifferenceAmount(difference);
        incident.setCreatedByUserId(createdByUserId);
        incident.setStatus(IncidentStatus.OPEN);

        if (difference.compareTo(BigDecimal.ZERO) < 0) {
            incident.setType(IncidentType.COLLECTION_SHORT);
            incident.setTitle("Faltante en cobranza");
            incident.setDescription(
                    "Faltante de cobranza. Esperado: " + expectedAmount +
                    ", recibido: " + receivedAmount +
                    ", diferencia: " + difference + "."
            );
        } else {
            incident.setType(IncidentType.COLLECTION_OVER);
            incident.setTitle("Sobrante en cobranza");
            incident.setDescription(
                    "Sobrante de cobranza. Esperado: " + expectedAmount +
                    ", recibido: " + receivedAmount +
                    ", diferencia: " + difference + "."
            );
        }

        repository.save(incident);
    }

    @Transactional(readOnly = true)
    public IncidentResponse findById(Long id) {
        Incident incident = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Incidencia no encontrada con id: " + id));
        return toResponse(incident);
    }

    @Transactional(readOnly = true)
    public List<IncidentResponse> findByBranch(Long branchId) {
        return repository.findByBranchIdOrderByCreatedAtDesc(branchId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<IncidentResponse> findByShipment(Long shipmentId) {
        return repository.findByShipmentIdOrderByCreatedAtDesc(shipmentId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<IncidentResponse> findByStatus(IncidentStatus status) {
        return repository.findByStatusOrderByCreatedAtDesc(status)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<IncidentResponse> findByBranchAndStatus(Long branchId, IncidentStatus status) {
        return repository.findByBranchIdAndStatusOrderByCreatedAtDesc(branchId, status)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public IncidentResponse updateStatus(Long incidentId, UpdateIncidentStatusRequest request) {
        Incident incident = repository.findById(incidentId)
                .orElseThrow(() -> new IllegalArgumentException("Incidencia no encontrada con id: " + incidentId));

        if (incident.getStatus() == IncidentStatus.RESOLVED || incident.getStatus() == IncidentStatus.CANCELLED) {
            throw new IllegalArgumentException("La incidencia ya está finalizada");
        }

        if (request.getDescription() != null && !request.getDescription().isBlank()) {
            incident.setDescription(request.getDescription());
        }

        if (request.getEvidenceUrl() != null && !request.getEvidenceUrl().isBlank()) {
            incident.setEvidenceUrl(request.getEvidenceUrl());
        }

        if (request.getStatus() == IncidentStatus.OPEN) {
            throw new IllegalArgumentException("No se puede regresar una incidencia a OPEN");
        }

        if (request.getStatus() == IncidentStatus.IN_PROGRESS) {
            incident.setStatus(IncidentStatus.IN_PROGRESS);
            if (incident.getInProgressAt() == null) {
                incident.setInProgressAt(LocalDateTime.now());
            }
        } else if (request.getStatus() == IncidentStatus.RESOLVED) {
            incident.setStatus(IncidentStatus.RESOLVED);
            if (incident.getInProgressAt() == null) {
                incident.setInProgressAt(LocalDateTime.now());
            }
            incident.setResolvedAt(LocalDateTime.now());
            incident.setResolvedByUserId(request.getActedByUserId());
        } else if (request.getStatus() == IncidentStatus.CANCELLED) {
            incident.setStatus(IncidentStatus.CANCELLED);
            incident.setCancelledAt(LocalDateTime.now());
            incident.setCancelledByUserId(request.getActedByUserId());
        }

        return toResponse(repository.save(incident));
    }

    private IncidentResponse toResponse(Incident incident) {
        return new IncidentResponse(
                incident.getId(),
                incident.getBranchId(),
                incident.getType().name(),
                incident.getStatus().name(),
                incident.getCustomerId(),
                incident.getItemId(),
                incident.getShipmentId(),
                incident.getShipmentPackageId(), 
                incident.getCustomerOrderId(),
                incident.getExpectedAmount(),
                incident.getReceivedAmount(),
                incident.getDifferenceAmount(),
                incident.getDescription(),
                incident.getEvidenceUrl(),
                incident.getCreatedAt(),
                incident.getCreatedByUserId(),
                incident.getInProgressAt(),
                incident.getResolvedAt(),
                incident.getResolvedByUserId(),
                incident.getCancelledAt(),
                incident.getCancelledByUserId()
        );
    }
}