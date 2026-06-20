package com.hpsqsoft.ctrlropa.platform;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateTenantAdminRequest {

    @NotBlank(message = "name es obligatorio")
    @Size(max = 150, message = "name no puede exceder 150 caracteres")
    private String name;

    @NotBlank(message = "email es obligatorio")
    @Email(message = "email invalido")
    @Size(max = 190, message = "email no puede exceder 190 caracteres")
    private String email;

    @NotBlank(message = "password es obligatorio")
    @Size(max = 120, message = "password no puede exceder 120 caracteres")
    private String password;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
