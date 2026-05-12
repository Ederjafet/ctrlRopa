package com.hpsqsoft.ctrlropa.useradmin;

import java.util.List;

public class SaveRoleRequest {

    private String code;
    private String name;
    private List<Long> permissionIds;

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public List<Long> getPermissionIds() { return permissionIds; }
    public void setPermissionIds(List<Long> permissionIds) { this.permissionIds = permissionIds; }
}
