package com.hpsqsoft.ctrlropa.tenant;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tenant")
public class TenantController {

    private final TenantResolver tenantResolver;

    public TenantController(TenantResolver tenantResolver) {
        this.tenantResolver = tenantResolver;
    }

    @GetMapping("/current")
    public CurrentTenantContext current() {
        return tenantResolver.resolveCurrent();
    }
}
