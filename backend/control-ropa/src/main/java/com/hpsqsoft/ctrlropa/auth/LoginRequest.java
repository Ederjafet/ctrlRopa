package com.hpsqsoft.ctrlropa.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class LoginRequest {

    @NotBlank(message = "email es obligatorio")
    @Email(message = "email inválido")
    private String email;

    @NotBlank(message = "password es obligatorio")
    private String password;

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}