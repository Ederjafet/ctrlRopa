package com.hpsqsoft.ctrlropa.useradmin;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;

public class UpdateUserRequest {

    private Long branchId;

    @Size(max = 150, message = "name no puede exceder 150 caracteres")
    private String name;

    @Email(message = "email inválido")
    @Size(max = 190, message = "email no puede exceder 190 caracteres")
    private String email;

    @Size(max = 40, message = "phone no puede exceder 40 caracteres")
    private String phone;

    @Size(max = 120, message = "password no puede exceder 120 caracteres")
    private String password;

    private String status;
    private Boolean passwordChangeRequired;

    private List<Long> branchIds;

    private Long roleId;
    private List<Long> roleIds;

    private List<Long> permissionIds;

    public Long getBranchId() { return branchId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Boolean getPasswordChangeRequired() { return passwordChangeRequired; }
    public void setPasswordChangeRequired(Boolean passwordChangeRequired) { this.passwordChangeRequired = passwordChangeRequired; }

    public List<Long> getBranchIds() {
        if (branchId == null && branchIds == null) {
            return null;
        }

        List<Long> merged = new ArrayList<>();

        if (branchIds != null) {
            merged.addAll(branchIds);
        }

        if (branchId != null) {
            merged.add(branchId);
        }

        return new ArrayList<>(new LinkedHashSet<>(merged));
    }

    public void setBranchIds(List<Long> branchIds) { this.branchIds = branchIds; }

    public boolean hasBranchIds() { return branchIds != null; }

    public Long getRoleId() { return roleId; }
    public void setRoleId(Long roleId) { this.roleId = roleId; }

    public List<Long> getRoleIds() {
        if (roleId == null && roleIds == null) {
            return null;
        }

        List<Long> merged = new ArrayList<>();

        if (roleIds != null) {
            merged.addAll(roleIds);
        }

        if (roleId != null) {
            merged.add(roleId);
        }

        return new ArrayList<>(new LinkedHashSet<>(merged));
    }

    public void setRoleIds(List<Long> roleIds) { this.roleIds = roleIds; }

    public List<Long> getPermissionIds() { return permissionIds; }
    public void setPermissionIds(List<Long> permissionIds) { this.permissionIds = permissionIds; }
}
