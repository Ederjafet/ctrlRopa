package com.hpsqsoft.ctrlropa.consignment;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/consignments")
public class ConsignmentController {

    private final ConsignmentService service;

    public ConsignmentController(ConsignmentService service) {
        this.service = service;
    }

    @PostMapping
    public ConsignmentResponse create(@Valid @RequestBody CreateConsignmentRequest request) {
        return service.create(request);
    }

    @GetMapping("/{id}")
    public ConsignmentResponse findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @GetMapping("/folio/{folio}")
    public ConsignmentResponse findByFolio(@PathVariable String folio) {
        return service.findByFolio(folio);
    }

    @GetMapping("/branch/{branchId}")
    public List<ConsignmentResponse> findByBranch(@PathVariable Long branchId) {
        return service.findByBranch(branchId);
    }

    @GetMapping("/status/{status}")
    public List<ConsignmentResponse> findByStatus(@PathVariable ConsignmentStatus status) {
        return service.findByStatus(status);
    }

    @PostMapping("/{consignmentId}/items")
    public ConsignmentResponse addItem(@PathVariable Long consignmentId,
                                       @Valid @RequestBody AddConsignmentItemRequest request) {
        return service.addItem(consignmentId, request);
    }

    @PatchMapping("/{consignmentId}/deliver")
    public ConsignmentResponse deliver(@PathVariable Long consignmentId) {
        return service.deliver(consignmentId);
    }

    @PostMapping("/{consignmentId}/settlements")
    public ConsignmentResponse settle(@PathVariable Long consignmentId,
                                      @Valid @RequestBody CreateConsignmentSettlementRequest request) {
        return service.settle(consignmentId, request);
    }

    @PatchMapping("/{consignmentId}/cancel")
    public ConsignmentResponse cancel(@PathVariable Long consignmentId,
                                      @RequestBody(required = false) CancelConsignmentRequest request) {
        return service.cancel(consignmentId, request);
    }
}