package com.hpsqsoft.ctrlropa.catalog;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payment-methods")
public class PaymentMethodController {

    private final PaymentMethodService service;

    public PaymentMethodController(PaymentMethodService service) {
        this.service = service;
    }

    @GetMapping
    public List<PaymentMethod> findAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public PaymentMethod findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    public PaymentMethod create(@RequestBody PaymentMethod entity) {
        return service.create(entity);
    }

    @PutMapping("/{id}")
    public PaymentMethod update(@PathVariable Long id, @RequestBody PaymentMethod entity) {
        return service.update(id, entity);
    }

    @PatchMapping("/{id}/deactivate")
    public void deactivate(@PathVariable Long id) {
        service.deactivate(id);
    }
}