package com.hpsqsoft.ctrlropa.consignment;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/consignees")
public class ConsigneeController {

    private final ConsigneeService service;

    public ConsigneeController(ConsigneeService service) {
        this.service = service;
    }

    @GetMapping("/branch/{branchId}")
    public List<ConsigneeResponse> findByBranch(@PathVariable Long branchId) {
        return service.findByBranch(branchId);
    }

    @GetMapping("/branch/{branchId}/active")
    public List<ConsigneeResponse> findActiveByBranch(@PathVariable Long branchId) {
        return service.findActiveByBranch(branchId);
    }

    @GetMapping("/{id}")
    public ConsigneeResponse findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    public ConsigneeResponse create(@Valid @RequestBody CreateConsigneeRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public ConsigneeResponse update(@PathVariable Long id,
                                    @Valid @RequestBody UpdateConsigneeRequest request) {
        return service.update(id, request);
    }

    @PatchMapping("/{id}/deactivate")
    public ConsigneeResponse deactivate(@PathVariable Long id) {
        return service.deactivate(id);
    }
}