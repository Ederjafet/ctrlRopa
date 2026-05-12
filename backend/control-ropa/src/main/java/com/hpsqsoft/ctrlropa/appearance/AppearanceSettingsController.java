package com.hpsqsoft.ctrlropa.appearance;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/appearance")
public class AppearanceSettingsController {

    private final AppearanceSettingsService service;

    public AppearanceSettingsController(AppearanceSettingsService service) {
        this.service = service;
    }

    @GetMapping
    public AppearanceSettingsResponse getCurrent() {
        return service.getCurrent();
    }

    @PutMapping
    public AppearanceSettingsResponse update(@Valid @RequestBody UpdateAppearanceSettingsRequest request) {
        return service.update(request);
    }
}