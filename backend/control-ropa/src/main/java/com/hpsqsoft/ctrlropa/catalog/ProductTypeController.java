package com.hpsqsoft.ctrlropa.catalog;

import com.hpsqsoft.ctrlropa.common.Status;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/product-types")
public class ProductTypeController {

    private final ProductTypeService service;

    public ProductTypeController(ProductTypeService service) {
        this.service = service;
    }

    @GetMapping
    public List<ProductType> findAll() {
        return service.findAll();
    }

    @GetMapping("/active")
    public List<ProductType> findActive() {
        return service.findActive();
    }

    @GetMapping("/{id}")
    public ProductType findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    public ProductType create(@RequestBody ProductType entity) {
        return service.create(entity);
    }

    @PutMapping("/{id}")
    public ProductType update(@PathVariable Long id, @RequestBody ProductType entity) {
        return service.update(id, entity);
    }

    @PatchMapping("/{id}/deactivate")
    public ProductType deactivate(@PathVariable Long id) {
        return service.deactivate(id);
    }
}