package com.hpsqsoft.ctrlropa.useradmin;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/permissions")
public class PermissionAdminController {

    private final UserAdminService service;

    public PermissionAdminController(UserAdminService service) {
        this.service = service;
    }

    @GetMapping
    public List<PermissionResponse> findPermissions() {
        return service.findPermissions();
    }
}