package com.hpsqsoft.ctrlropa.customer;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customer-addresses")
public class CustomerAddressController {

    private final CustomerAddressService service;

    public CustomerAddressController(CustomerAddressService service) {
        this.service = service;
    }

    @GetMapping("/customer/{customerId}")
    public List<CustomerAddressResponse> findByCustomer(@PathVariable Long customerId) {
        return service.findByCustomer(customerId);
    }

    @PostMapping("/customer/{customerId}")
    public CustomerAddressResponse create(@PathVariable Long customerId, @RequestBody CustomerAddress entity) {
        return service.create(customerId, entity);
    }

    @PutMapping("/{id}")
    public CustomerAddressResponse update(@PathVariable Long id, @RequestBody CustomerAddress entity) {
        return service.update(id, entity);
    }

    @PatchMapping("/{id}/deactivate")
    public CustomerAddressResponse deactivate(@PathVariable Long id) {
        return service.deactivate(id);
    }
}