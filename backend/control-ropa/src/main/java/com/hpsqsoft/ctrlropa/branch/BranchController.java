package com.hpsqsoft.ctrlropa.branch;

import com.hpsqsoft.ctrlropa.common.Status;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/branches")
public class BranchController {

    private final BranchService service;

    public BranchController(BranchService service) {
        this.service = service;
    }

    @GetMapping
    public List<Branch> findAll() {
        return service.findAll();
    }

    @GetMapping("/active")
    public List<Branch> findActive() {
        return service.findByStatus(Status.ACTIVE);
    }

    @GetMapping("/{id}")
    public Branch findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    public Branch create(@RequestBody Branch entity) {
        return service.create(entity);
    }

    @PutMapping("/{id}")
    public Branch update(@PathVariable Long id, @RequestBody Branch entity) {
        return service.update(id, entity);
    }

    @PatchMapping("/{id}/deactivate")
    public Branch deactivate(@PathVariable Long id) {
        return service.deactivate(id);
    }
}