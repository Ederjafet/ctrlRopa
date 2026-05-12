package com.hpsqsoft.ctrlropa.batch;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/batches")
public class BatchController {

    private final BatchService service;

    public BatchController(BatchService service) {
        this.service = service;
    }

    @GetMapping("/branch/{branchId}")
    public List<BatchResponse> findByBranch(@PathVariable Long branchId) {
        return service.findByBranch(branchId);
    }

    @GetMapping("/{id}")
    public BatchResponse findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @GetMapping("/folio/{folio}")
    public BatchResponse findByFolio(@PathVariable String folio) {
        return service.findByFolio(folio);
    }

    @PostMapping("/branch/{branchId}")
    public BatchResponse create(@PathVariable Long branchId,
                                @RequestBody CreateBatchRequest request) {
        return service.create(branchId, request);
    }

    @PatchMapping("/{id}/receive")
    public BatchResponse receive(@PathVariable Long id,
                                 @RequestBody ReceiveBatchRequest request) {
        return service.receive(id, request);
    }

    @PutMapping("/{id}/classification")
    public BatchResponse saveClassification(@PathVariable Long id,
                                            @RequestBody SaveBatchClassificationRequest request) {
        return service.saveClassification(id, request);
    }

    @PatchMapping("/{id}/reconcile")
    public BatchResponse reconcile(@PathVariable Long id) {
        return service.reconcile(id);
    }

    @PatchMapping("/{id}/cancel")
    public BatchResponse cancel(@PathVariable Long id,
                                @RequestBody CancelBatchRequest request) {
        return service.cancel(id, request);
    }
}
