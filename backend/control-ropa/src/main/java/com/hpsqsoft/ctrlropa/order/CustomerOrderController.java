package com.hpsqsoft.ctrlropa.order;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customer-orders")
public class CustomerOrderController {

    private final CustomerOrderService service;

    public CustomerOrderController(CustomerOrderService service) {
        this.service = service;
    }

    @GetMapping("/customer/{customerId}")
    public List<CustomerOrderResponse> findByCustomer(@PathVariable Long customerId) {
        return service.findByCustomer(customerId);
    }

    @GetMapping("/branch/{branchId}/pending-payment")
    public List<CustomerOrderPendingPaymentResponse> findPendingPaymentByBranch(@PathVariable Long branchId) {
        return service.findPendingPaymentByBranch(branchId);
    }

    @GetMapping("/{id}")
    public CustomerOrderDetailResponse findDetail(@PathVariable Long id) {
        return service.findDetail(id);
    }

    @GetMapping("/{id}/settlement")
    public CustomerOrderSettlementResponse settlement(@PathVariable Long id) {
        return service.getSettlement(id);
    }
}
