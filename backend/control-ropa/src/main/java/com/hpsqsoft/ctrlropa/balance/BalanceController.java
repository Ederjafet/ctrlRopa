package com.hpsqsoft.ctrlropa.balance;

import com.hpsqsoft.ctrlropa.order.CustomerOrderSettlementResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/balance")
public class BalanceController {

    private final BalanceService service;

    public BalanceController(BalanceService service) {
        this.service = service;
    }

    @PostMapping("/apply-to-order")
    public CustomerOrderSettlementResponse applyToOrder(@Valid @RequestBody ApplyBalanceToOrderRequest request) {
        return service.applyToOrder(request);
    }

    @PostMapping("/reverse-application")
    public ReverseBalanceApplicationResponse reverseApplication(@Valid @RequestBody ReverseBalanceApplicationRequest request) {
        return service.reverseApplication(request);
    }

    @GetMapping("/{customerId}")
    public BigDecimal getBalance(@PathVariable Long customerId) {
        return service.getAvailableBalance(customerId);
    }

    @GetMapping("/{customerId}/history")
    public List<CustomerBalanceMovement> history(@PathVariable Long customerId) {
        return service.history(customerId);
    }
    
    @GetMapping("/branch/{branchId}/customer-phone/{phone}")
    public BalanceSummaryResponse getBalanceByCustomerPhone(@PathVariable Long branchId,
                                                            @PathVariable String phone) {
        return service.getBalanceByCustomerPhone(branchId, phone);
    }

    @GetMapping("/package-folio/{folio}")
    public BalanceSummaryResponse findByPackageFolio(@PathVariable String folio) {
        return service.getBalanceByPackageFolio(folio);
    }
}