package com.hpsqsoft.ctrlropa.inventory;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/storage-locations")
public class StorageLocationController {

    private final StorageLocationService service;

    public StorageLocationController(StorageLocationService service) {
        this.service = service;
    }

    @GetMapping("/branch/{branchId}")
    public List<StorageLocationResponse> findByBranch(@PathVariable Long branchId) {
        return service.findByBranch(branchId);
    }

    @GetMapping("/branch/{branchId}/active")
    public List<StorageLocationResponse> findActiveByBranch(@PathVariable Long branchId) {
        return service.findActiveByBranch(branchId);
    }

    @GetMapping("/{id}")
    public StorageLocationResponse findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @GetMapping("/{id}/detail")
    public StorageLocationDetailResponse findDetail(@PathVariable Long id) {
        return service.findDetail(id);
    }

    @PostMapping("/branch/{branchId}")
    public StorageLocationResponse create(@PathVariable Long branchId,
                                          @RequestBody StorageLocation entity) {
        return service.create(branchId, entity);
    }

    @PutMapping("/{id}")
    public StorageLocationResponse update(@PathVariable Long id,
                                          @Valid @RequestBody UpdateStorageLocationRequest request) {
        return service.update(id, request);
    }

    @PatchMapping("/{id}/deactivate")
    public StorageLocationResponse deactivate(@PathVariable Long id) {
        return service.deactivate(id);
    }

    @PatchMapping("/{id}/activate")
    public StorageLocationResponse activate(@PathVariable Long id) {
        return service.activate(id);
    }
}