package com.hpsqsoft.ctrlropa.useradmin;

import java.util.List;

public class UpdateUserRolesRequest {

    private List<Long> roleIds;

    public List<Long> getRoleIds() {
        return roleIds;
    }

    public void setRoleIds(List<Long> roleIds) {
        this.roleIds = roleIds;
    }
}