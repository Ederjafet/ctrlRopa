package com.hpsqsoft.ctrlropa.catalog;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sales-channels")
public class SalesChannelController {

    private final SalesChannelService service;

    public SalesChannelController(SalesChannelService service) {
        this.service = service;
    }

    @GetMapping
    public List<SalesChannel> findAll() {
        return service.findAll();
    }

    @GetMapping("/active")
    public List<SalesChannel> findActive() {
        return service.findActive();
    }

    @GetMapping("/{id}")
    public SalesChannel findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    public SalesChannel create(@RequestBody SalesChannel entity) {
        return service.create(entity);
    }

    @PutMapping("/{id}")
    public SalesChannel update(@PathVariable Long id, @RequestBody SalesChannel entity) {
        return service.update(id, entity);
    }

    @PatchMapping("/{id}/global-enabled")
    public SalesChannel updateGlobalEnabled(@PathVariable Long id,
                                            @RequestBody UpdateGlobalEnabledRequest request) {
        return service.updateGlobalEnabled(id, request.getGlobalEnabled());
    }

    @PatchMapping("/{id}/deactivate")
    public SalesChannel deactivate(@PathVariable Long id) {
        return service.deactivate(id);
    }

    public static class UpdateGlobalEnabledRequest {
        private Boolean globalEnabled;

        public Boolean getGlobalEnabled() { return globalEnabled; }
        public void setGlobalEnabled(Boolean globalEnabled) { this.globalEnabled = globalEnabled; }
    }
}
