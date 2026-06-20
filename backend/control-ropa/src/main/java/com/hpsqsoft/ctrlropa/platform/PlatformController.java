package com.hpsqsoft.ctrlropa.platform;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/platform")
public class PlatformController {

    private final PlatformService service;

    public PlatformController(PlatformService service) {
        this.service = service;
    }

    @GetMapping("/companies")
    public List<PlatformCompanyResponse> findCompanies() {
        return service.findCompanies();
    }

    @PostMapping("/companies")
    public PlatformCompanyResponse createCompany(@Valid @RequestBody CreatePlatformCompanyRequest request) {
        return service.createCompany(request);
    }

    @GetMapping("/companies/{companyId}")
    public PlatformCompanyDetailResponse findCompany(@PathVariable Long companyId) {
        return service.findCompanyDetail(companyId);
    }

    @PatchMapping("/companies/{companyId}")
    public PlatformCompanyDetailResponse updateCompany(@PathVariable Long companyId,
                                                       @Valid @RequestBody UpdatePlatformCompanyRequest request) {
        return service.updateCompany(companyId, request);
    }

    @GetMapping("/companies/{companyId}/settings")
    public PlatformCompanySettingsResponse findCompanySettings(@PathVariable Long companyId) {
        return service.findCompanySettings(companyId);
    }

    @PatchMapping("/companies/{companyId}/settings")
    public PlatformCompanySettingsResponse updateCompanySettings(
            @PathVariable Long companyId,
            @RequestBody UpdatePlatformCompanySettingsRequest request) {
        return service.updateCompanySettings(companyId, request);
    }

    @GetMapping("/companies/{companyId}/branches")
    public List<PlatformBranchResponse> findBranches(@PathVariable Long companyId) {
        return service.findBranches(companyId);
    }

    @PostMapping("/companies/{companyId}/branches")
    public PlatformBranchResponse createBranch(@PathVariable Long companyId,
                                               @Valid @RequestBody CreatePlatformBranchRequest request) {
        return service.createBranch(companyId, request);
    }

    @PatchMapping("/companies/{companyId}/branches/{branchId}")
    public PlatformBranchResponse updateBranch(@PathVariable Long companyId,
                                               @PathVariable Long branchId,
                                               @Valid @RequestBody UpdatePlatformBranchRequest request) {
        return service.updateBranch(companyId, branchId, request);
    }

    @GetMapping("/companies/{companyId}/users")
    public List<PlatformCompanyUserResponse> findUsers(@PathVariable Long companyId) {
        return service.findUsers(companyId);
    }

    @PostMapping("/companies/{companyId}/users")
    public PlatformCompanyUserResponse createUser(@PathVariable Long companyId,
                                                  @Valid @RequestBody CreatePlatformCompanyUserRequest request) {
        return service.createCompanyUser(companyId, request);
    }

    @PatchMapping("/companies/{companyId}/users/{userId}")
    public PlatformCompanyUserResponse updateUser(@PathVariable Long companyId,
                                                  @PathVariable Long userId,
                                                  @Valid @RequestBody UpdatePlatformCompanyUserRequest request) {
        return service.updateCompanyUser(companyId, userId, request);
    }

    @PostMapping("/companies/{companyId}/admin-user")
    public PlatformTenantAdminResponse createTenantAdmin(@PathVariable Long companyId,
                                                         @Valid @RequestBody CreateTenantAdminRequest request) {
        return service.createTenantAdmin(companyId, request);
    }
}
