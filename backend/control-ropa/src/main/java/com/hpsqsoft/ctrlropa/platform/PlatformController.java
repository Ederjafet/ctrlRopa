package com.hpsqsoft.ctrlropa.platform;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
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

    @PostMapping("/companies/{companyId}/admin-user")
    public PlatformTenantAdminResponse createTenantAdmin(@PathVariable Long companyId,
                                                         @Valid @RequestBody CreateTenantAdminRequest request) {
        return service.createTenantAdmin(companyId, request);
    }
}
