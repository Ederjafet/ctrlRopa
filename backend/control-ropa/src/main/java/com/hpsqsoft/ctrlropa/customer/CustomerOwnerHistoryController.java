package com.hpsqsoft.ctrlropa.customer;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customer-owner-history")
public class CustomerOwnerHistoryController {

    private final CustomerOwnerHistoryService service;

    public CustomerOwnerHistoryController(CustomerOwnerHistoryService service) {
        this.service = service;
    }

    @GetMapping("/customer/{customerId}")
    public List<CustomerOwnerHistoryResponse> findByCustomer(@PathVariable Long customerId) {
        return service.findByCustomer(customerId);
    }

    @PostMapping("/reassign")
    public CustomerOwnerHistoryResponse reassign(@RequestBody ReassignCustomerRequest request) {
        return service.reassign(
                request.getCustomerId(),
                request.getToUserId(),
                request.getReason(),
                request.getChangedByUserId()
        );
    }

    public static class ReassignCustomerRequest {
        private Long customerId;
        private Long toUserId;
        private String reason;
        private Long changedByUserId;

        public Long getCustomerId() { return customerId; }
        public void setCustomerId(Long customerId) { this.customerId = customerId; }

        public Long getToUserId() { return toUserId; }
        public void setToUserId(Long toUserId) { this.toUserId = toUserId; }

        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }

        public Long getChangedByUserId() { return changedByUserId; }
        public void setChangedByUserId(Long changedByUserId) { this.changedByUserId = changedByUserId; }
    }
}