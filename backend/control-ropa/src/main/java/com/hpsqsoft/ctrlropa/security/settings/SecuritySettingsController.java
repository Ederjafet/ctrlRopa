package com.hpsqsoft.ctrlropa.security.settings;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/security/settings")
public class SecuritySettingsController {

    private final SecuritySettingsService service;

    public SecuritySettingsController(SecuritySettingsService service) {
        this.service = service;
    }

    @GetMapping("/public")
    public SecuritySettingsResponse getPublicSettings() {
        return service.getPublicSettings();
    }

    @GetMapping
    public SecuritySettingsResponse getDeveloperSettings() {
        return service.getDeveloperSettings();
    }

    @PutMapping
    public SecuritySettingsResponse updateDeveloperSettings(@Valid @RequestBody UpdateSecuritySettingsRequest request) {
        return service.updateDeveloperSettings(request);
    }
}
