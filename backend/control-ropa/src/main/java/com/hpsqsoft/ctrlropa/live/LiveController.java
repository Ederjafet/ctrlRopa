package com.hpsqsoft.ctrlropa.live;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import java.util.List;
import com.hpsqsoft.ctrlropa.item.ItemResponse;

@RestController
@RequestMapping("/api/lives")
public class LiveController {

    private final LiveService service;

    public LiveController(LiveService service) {
        this.service = service;
    }

    @GetMapping("/branch/{branchId}")
    public List<LiveResponse> findByBranch(@PathVariable Long branchId) {
        return service.findByBranch(branchId);
    }

    @GetMapping("/{id}")
    public LiveResponse findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping("/branch/{branchId}")
    public LiveResponse create(@PathVariable Long branchId, @RequestBody Live entity) {
        return service.create(branchId, entity);
    }

    @PatchMapping("/{id}/activate")
    public LiveResponse activate(@PathVariable Long id) {
        return service.activate(id);
    }

    @PatchMapping("/{id}/close")
    public LiveResponse close(@PathVariable Long id) {
        return service.close(id);
    }

    @GetMapping("/{id}/active-item")
    public ResponseEntity<ItemResponse> getActiveItem(@PathVariable Long id) {
        ItemResponse activeItem = service.getActiveItem(id);
        return activeItem == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(activeItem);
    }

    @PatchMapping("/{id}/active-item")
    public LiveResponse setActiveItem(@PathVariable Long id, @RequestBody LiveActiveItemRequest request) {
        return service.setActiveItem(id, request);
    }
}
