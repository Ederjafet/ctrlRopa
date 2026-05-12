package com.hpsqsoft.ctrlropa.useradmin;

import java.util.List;

public class UpdateUserPermissionsRequest {

    private List<Long> permissionIds;

    public List<Long> getPermissionIds() {
        return permissionIds;
    }

    public void setPermissionIds(List<Long> permissionIds) {
        this.permissionIds = permissionIds;
    }
}