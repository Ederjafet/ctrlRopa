package com.hpsqsoft.ctrlropa.useradmin;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserAdminController {

    private final UserAdminService service;

    public UserAdminController(UserAdminService service) {
        this.service = service;
    }

    @GetMapping
    public List<UserAdminResponse> findAll(@RequestParam(required = false) String search) {
        return service.findAll(search);
    }

    @GetMapping("/{id}")
    public UserAdminResponse findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    public UserAdminResponse create(@Valid @RequestBody CreateUserRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public UserAdminResponse update(@PathVariable Long id,
                                    @Valid @RequestBody UpdateUserRequest request) {
        return service.update(id, request);
    }

    @PatchMapping("/{id}/deactivate")
    public UserAdminResponse deactivate(@PathVariable Long id) {
        return service.deactivate(id);
    }

    @PutMapping("/{id}/roles")
    public UserAdminResponse updateRoles(@PathVariable Long id,
                                         @RequestBody UpdateUserRolesRequest request) {
        return service.updateRoles(id, request);
    }

    @PutMapping("/{id}/permissions")
    public UserAdminResponse updatePermissions(@PathVariable Long id,
                                               @RequestBody UpdateUserPermissionsRequest request) {
        return service.updatePermissions(id, request);
    }
}