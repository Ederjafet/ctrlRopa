package com.hpsqsoft.ctrlropa.sale;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sales")
public class SaleController {

    private final SaleService service;

    public SaleController(SaleService service) {
        this.service = service;
    }

    @GetMapping("/branch/{branchId}")
    public List<SaleResponse> findByBranch(@PathVariable Long branchId) {
        return service.findByBranch(branchId);
    }

    @GetMapping("/{id}")
    public SaleResponse findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    public SaleResponse create(@Valid @RequestBody CreateSaleRequest request) {
        return service.create(request);
    }

    @PatchMapping("/{saleId}/cancel")
    public SaleResponse cancel(@PathVariable Long saleId, @RequestBody CancelSaleRequest request) {
        return service.cancel(saleId, request.getReason(), request.getCancelledByUserId());
    }

    public static class CancelSaleRequest {
        private String reason;
        private Long cancelledByUserId;

        public String getReason() {
            return reason;
        }

        public void setReason(String reason) {
            this.reason = reason;
        }

        public Long getCancelledByUserId() {
            return cancelledByUserId;
        }

        public void setCancelledByUserId(Long cancelledByUserId) {
            this.cancelledByUserId = cancelledByUserId;
        }
    }
}