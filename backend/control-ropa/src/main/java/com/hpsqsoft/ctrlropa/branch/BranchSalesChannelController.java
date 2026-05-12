package com.hpsqsoft.ctrlropa.branch;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/branch-sales-channels")
public class BranchSalesChannelController {

    private final BranchSalesChannelService service;

    public BranchSalesChannelController(BranchSalesChannelService service) {
        this.service = service;
    }

    @GetMapping("/branch/{branchId}")
    public List<BranchSalesChannelResponse> findByBranch(@PathVariable Long branchId) {
        return service.findByBranch(branchId);
    }

    @PostMapping
    public BranchSalesChannelResponse create(@RequestBody CreateBranchSalesChannelRequest request) {
        return service.create(
                request.getBranchId(),
                request.getSalesChannelId(),
                request.getEnabled()
        );
    }

    @PutMapping("/{id}")
    public BranchSalesChannelResponse update(@PathVariable Long id,
                                             @RequestBody UpdateBranchSalesChannelRequest request) {
        return service.update(
                id,
                request.getEnabled()
        );
    }

    public static class CreateBranchSalesChannelRequest {
        private Long branchId;
        private Long salesChannelId;
        private Boolean enabled;

        public Long getBranchId() { return branchId; }
        public void setBranchId(Long branchId) { this.branchId = branchId; }

        public Long getSalesChannelId() { return salesChannelId; }
        public void setSalesChannelId(Long salesChannelId) { this.salesChannelId = salesChannelId; }

        public Boolean getEnabled() { return enabled; }
        public void setEnabled(Boolean enabled) { this.enabled = enabled; }
    }

    public static class UpdateBranchSalesChannelRequest {
        private Boolean enabled;

        public Boolean getEnabled() { return enabled; }
        public void setEnabled(Boolean enabled) { this.enabled = enabled; }
    }
}