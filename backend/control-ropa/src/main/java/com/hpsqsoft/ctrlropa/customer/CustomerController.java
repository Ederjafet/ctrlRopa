package com.hpsqsoft.ctrlropa.customer;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final CustomerService service;

    public CustomerController(CustomerService service) {
        this.service = service;
    }

    @GetMapping("/branch/{branchId}")
    public List<CustomerResponse> findByBranch(@PathVariable Long branchId) {
        return service.findByBranch(branchId);
    }

    @GetMapping("/{id}")
    public CustomerResponse findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @GetMapping("/branch/{branchId}/phone/{phone}")
    public CustomerResponse findByPhone(@PathVariable Long branchId, @PathVariable String phone) {
        return service.findByBranchAndPhone(branchId, phone);
    }

    @GetMapping("/branch/{branchId}/generic/{genericType}")
    public CustomerResponse findGenericByType(@PathVariable Long branchId,
                                              @PathVariable GenericType genericType) {
        return service.findGenericByType(branchId, genericType);
    }

    @PostMapping("/branch/{branchId}")
    public CustomerResponse create(@PathVariable Long branchId, @RequestBody Customer entity) {
        return service.create(branchId, entity);
    }

    @PutMapping("/{id}")
    public CustomerResponse update(@PathVariable Long id, @RequestBody Customer entity) {
        return service.update(id, entity);
    }

    @PatchMapping("/{id}/deactivate")
    public CustomerResponse deactivate(@PathVariable Long id) {
        return service.deactivate(id);
    }
}