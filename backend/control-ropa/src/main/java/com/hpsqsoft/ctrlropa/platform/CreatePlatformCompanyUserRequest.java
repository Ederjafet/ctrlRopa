package com.hpsqsoft.ctrlropa.platform;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreatePlatformCompanyUserRequest {

    @NotBlank(message = "name es obligatorio")
    @Size(max = 150, message = "name no puede exceder 150 caracteres")
    private String name;

    @NotBlank(message = "email es obligatorio")
    @Email(message = "email invalido")
    @Size(max = 190, message = "email no puede exceder 190 caracteres")
    private String email;

    @Size(max = 40, message = "phone no puede exceder 40 caracteres")
    private String phone;

    @NotBlank(message = "password es obligatorio")
    @Size(max = 120, message = "password no puede exceder 120 caracteres")
    private String password;

    @NotBlank(message = "role es obligatorio")
    @Size(max = 64, message = "role no puede exceder 64 caracteres")
    private String role;

    private Long branchId;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public Long getBranchId() { return branchId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }
}
