package com.hpsqsoft.ctrlropa.operationauth;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/operational-authorizations")
public class OperationalAuthorizationController {

    private final OperationalAuthorizationService service;

    public OperationalAuthorizationController(OperationalAuthorizationService service) {
        this.service = service;
    }

    @PostMapping
    public OperationalAuthorizationResponse create(@RequestBody OperationalAuthorizationCreateRequest request) {
        return service.create(request);
    }

    @GetMapping("/branch/{branchId}")
    public List<OperationalAuthorizationResponse> findByBranch(@PathVariable Long branchId) {
        return service.findByBranch(branchId);
    }

    @GetMapping("/pending/branch/{branchId}")
    public List<OperationalAuthorizationResponse> findPending(@PathVariable Long branchId) {
        return service.findPending(branchId);
    }

    @GetMapping("/mine/branch/{branchId}")
    public List<OperationalAuthorizationResponse> findMine(@PathVariable Long branchId) {
        return service.findMine(branchId);
    }

    @GetMapping("/{id}")
    public OperationalAuthorizationResponse findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PatchMapping("/{id}/approve")
    public OperationalAuthorizationResponse approve(@PathVariable Long id,
                                                    @RequestBody OperationalAuthorizationDecisionRequest request) {
        return service.approve(id, request);
    }

    @PatchMapping("/{id}/reject")
    public OperationalAuthorizationResponse reject(@PathVariable Long id,
                                                   @RequestBody OperationalAuthorizationDecisionRequest request) {
        return service.reject(id, request);
    }

    @PatchMapping("/{id}/cancel")
    public OperationalAuthorizationResponse cancel(@PathVariable Long id,
                                                   @RequestBody OperationalAuthorizationDecisionRequest request) {
        return service.cancel(id, request);
    }

    @PostMapping("/{id}/apply")
    public OperationalAuthorizationResponse apply(@PathVariable Long id,
                                                  @RequestBody OperationalAuthorizationDecisionRequest request) {
        return service.apply(id, request);
    }
}
