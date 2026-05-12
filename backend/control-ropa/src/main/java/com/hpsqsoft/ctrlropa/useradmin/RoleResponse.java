package com.hpsqsoft.ctrlropa.useradmin;

public class RoleResponse {

    private Long id;
    private String code;
    private String name;
    private java.util.List<PermissionResponse> permissions;

    public RoleResponse(Long id, String code, String name) {
        this(id, code, name, java.util.List.of());
    }

    public RoleResponse(Long id, String code, String name, java.util.List<PermissionResponse> permissions) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.permissions = permissions;
    }

    public Long getId() { return id; }
    public String getCode() { return code; }
    public String getName() { return name; }
    public java.util.List<PermissionResponse> getPermissions() { return permissions; }
}
