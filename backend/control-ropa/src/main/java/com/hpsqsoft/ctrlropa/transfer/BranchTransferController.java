package com.hpsqsoft.ctrlropa.transfer;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transfers")
public class BranchTransferController {

    private final BranchTransferService service;

    public BranchTransferController(BranchTransferService service) {
        this.service = service;
    }

    @PostMapping
    public BranchTransferResponse create(@Valid @RequestBody CreateBranchTransferRequest request) {
        return service.create(request);
    }

    @GetMapping("/{id}")
    public BranchTransferResponse findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @GetMapping("/folio/{folio}")
    public BranchTransferResponse findByFolio(@PathVariable String folio) {
        return service.findByFolio(folio);
    }

    @GetMapping("/branch/{branchId}")
    public List<BranchTransferResponse> findByBranch(@PathVariable Long branchId) {
        return service.findByBranch(branchId);
    }

    @GetMapping("/status/{status}")
    public List<BranchTransferResponse> findByStatus(@PathVariable BranchTransferStatus status) {
        return service.findByStatus(status);
    }

    @PostMapping("/{transferId}/items/{itemId}")
    public BranchTransferResponse addItem(@PathVariable Long transferId,
                                          @PathVariable Long itemId) {
        return service.addItem(transferId, itemId);
    }

    @PatchMapping("/{transferId}/send")
    public BranchTransferResponse send(@PathVariable Long transferId) {
        return service.send(transferId);
    }

    @PatchMapping("/{transferId}/receive-item")
    public BranchTransferResponse receiveItem(@PathVariable Long transferId,
                                              @RequestBody ReceiveTransferItemRequest request) {
        return service.receiveItem(transferId, request);
    }

    @PatchMapping("/{transferId}/cancel")
    public BranchTransferResponse cancel(@PathVariable Long transferId,
                                         @RequestBody(required = false) CancelBranchTransferRequest request) {
        return service.cancel(transferId, request);
    }
}