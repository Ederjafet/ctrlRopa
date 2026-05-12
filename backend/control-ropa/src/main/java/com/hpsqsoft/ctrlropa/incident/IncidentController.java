package com.hpsqsoft.ctrlropa.incident;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/incidents")
public class IncidentController {

    private final IncidentService service;

    public IncidentController(IncidentService service) {
        this.service = service;
    }

    @GetMapping("/{id}")
    public IncidentResponse findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @GetMapping("/branch/{branchId}")
    public List<IncidentResponse> findByBranch(@PathVariable Long branchId,
                                               @RequestParam(required = false) IncidentStatus status) {
        if (status != null) {
            return service.findByBranchAndStatus(branchId, status);
        }
        return service.findByBranch(branchId);
    }

    @GetMapping("/shipment/{shipmentId}")
    public List<IncidentResponse> findByShipment(@PathVariable Long shipmentId) {
        return service.findByShipment(shipmentId);
    }

    @GetMapping
    public List<IncidentResponse> findByStatus(@RequestParam IncidentStatus status) {
        return service.findByStatus(status);
    }

    @PatchMapping("/{id}/status")
    public IncidentResponse updateStatus(@PathVariable Long id,
                                         @Valid @RequestBody UpdateIncidentStatusRequest request) {
        return service.updateStatus(id, request);
    }
}