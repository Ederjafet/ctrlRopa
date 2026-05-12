package com.hpsqsoft.ctrlropa.catalog;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/brands")
public class BrandController {

    private final BrandService service;

    public BrandController(BrandService service) {
        this.service = service;
    }

    @GetMapping
    public List<Brand> findAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public Brand findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    public Brand create(@RequestBody Brand entity) {
        return service.create(entity);
    }

    @PutMapping("/{id}")
    public Brand update(@PathVariable Long id, @RequestBody Brand entity) {
        return service.update(id, entity);
    }

    @PatchMapping("/{id}/deactivate")
    public void deactivate(@PathVariable Long id) {
        service.deactivate(id);
    }
}