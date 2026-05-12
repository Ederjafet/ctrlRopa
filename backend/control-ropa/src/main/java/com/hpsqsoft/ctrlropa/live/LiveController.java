package com.hpsqsoft.ctrlropa.live;

import org.springframework.web.bind.annotation.*;

import java.util.List;

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
}