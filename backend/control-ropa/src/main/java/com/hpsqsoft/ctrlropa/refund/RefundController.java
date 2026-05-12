package com.hpsqsoft.ctrlropa.refund;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/refunds")
public class RefundController {

    private final RefundService service;

    public RefundController(RefundService service) {
        this.service = service;
    }

    @PostMapping
    public RefundResponse create(@Valid @RequestBody CreateRefundRequest request) {
        return service.create(request);
    }

    @PatchMapping("/{id}/approve")
    public RefundResponse approve(@PathVariable Long id,
                                  @Valid @RequestBody ApproveRefundRequest request) {
        return service.approve(id, request);
    }

    @PatchMapping("/{id}/process")
    public RefundResponse process(@PathVariable Long id,
                                  @Valid @RequestBody ProcessRefundRequest request) {
        return service.process(id, request);
    }

    @PatchMapping("/{id}/cancel")
    public RefundResponse cancel(@PathVariable Long id,
                                 @Valid @RequestBody CancelRefundRequest request) {
        return service.cancel(id, request);
    }

    @GetMapping("/{id}")
    public RefundResponse findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @GetMapping("/return/{returnId}")
    public List<RefundResponse> findByReturn(@PathVariable Long returnId) {
        return service.findByReturn(returnId);
    }

    @GetMapping("/customer/{customerId}")
    public List<RefundResponse> findByCustomer(@PathVariable Long customerId) {
        return service.findByCustomer(customerId);
    }

    @GetMapping
    public List<RefundResponse> findByStatus(@RequestParam RefundStatus status) {
        return service.findByStatus(status);
    }
    
    @GetMapping("/lookup/code/{code}")
    public RefundLookupResponse lookupByCode(@PathVariable String code) {
        return service.lookupByItemCode(code);
    }

    @GetMapping("/lookup/qr/{qrCode}")
    public RefundLookupResponse lookupByQr(@PathVariable String qrCode) {
        return service.lookupByQrCode(qrCode);
    }
}