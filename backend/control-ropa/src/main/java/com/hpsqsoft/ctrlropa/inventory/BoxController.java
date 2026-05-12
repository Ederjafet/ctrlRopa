package com.hpsqsoft.ctrlropa.inventory;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/boxes")
public class BoxController {

    private final BoxService service;

    public BoxController(BoxService service) {
        this.service = service;
    }

    @GetMapping("/branch/{branchId}")
    public List<BoxResponse> findByBranch(@PathVariable Long branchId) {
        return service.findByBranch(branchId);
    }

    @GetMapping("/branch/{branchId}/active")
    public List<BoxResponse> findActiveByBranch(@PathVariable Long branchId) {
        return service.findActiveByBranch(branchId);
    }

    @GetMapping("/{id}")
    public BoxResponse findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @GetMapping("/{id}/detail")
    public BoxDetailResponse findDetail(@PathVariable Long id) {
        return service.findDetail(id);
    }

    @GetMapping("/{id}/content")
    public List<BoxContentResponse> findContent(@PathVariable Long id) {
        return service.findContent(id);
    }

    @PostMapping("/branch/{branchId}")
    public BoxResponse create(@PathVariable Long branchId,
                              @RequestBody Box entity) {
        return service.create(branchId, entity);
    }

    @PutMapping("/{id}")
    public BoxResponse update(@PathVariable Long id,
                              @Valid @RequestBody UpdateBoxRequest request) {
        return service.update(id, request);
    }

    @PatchMapping("/{id}/deactivate")
    public BoxResponse deactivate(@PathVariable Long id) {
        return service.deactivate(id);
    }

    @PatchMapping("/{id}/activate")
    public BoxResponse activate(@PathVariable Long id) {
        return service.activate(id);
    }
}