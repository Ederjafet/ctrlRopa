package com.hpsqsoft.ctrlropa.catalog;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sizes")
public class SizeController {

    private final SizeService service;

    public SizeController(SizeService service) {
        this.service = service;
    }

    @GetMapping
    public List<Size> findAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public Size findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    public Size create(@RequestBody Size entity) {
        return service.create(entity);
    }

    @PutMapping("/{id}")
    public Size update(@PathVariable Long id, @RequestBody Size entity) {
        return service.update(id, entity);
    }

    @PatchMapping("/{id}/deactivate")
    public void deactivate(@PathVariable Long id) {
        service.deactivate(id);
    }
}