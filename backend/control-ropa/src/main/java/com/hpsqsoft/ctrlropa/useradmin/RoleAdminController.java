package com.hpsqsoft.ctrlropa.useradmin;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/roles")
public class RoleAdminController {

    private final UserAdminService service;

    public RoleAdminController(UserAdminService service) {
        this.service = service;
    }

    @GetMapping
    public List<RoleResponse> findRoles() {
        return service.findRoles();
    }

    @PostMapping
    public RoleResponse createRole(@RequestBody SaveRoleRequest request) {
        return service.createRole(request);
    }

    @PutMapping("/{id}")
    public RoleResponse updateRole(@PathVariable Long id,
                                   @RequestBody SaveRoleRequest request) {
        return service.updateRole(id, request);
    }

    @PutMapping("/{id}/permissions")
    public RoleResponse updateRolePermissions(@PathVariable Long id,
                                              @RequestBody SaveRoleRequest request) {
        return service.updateRolePermissions(id, request);
    }
}
