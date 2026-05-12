package com.hpsqsoft.ctrlropa.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ChangePasswordRequest {

    @NotBlank(message = "currentPassword es obligatorio")
    private String currentPassword;

    @NotBlank(message = "newPassword es obligatorio")
    @Size(max = 120, message = "newPassword no puede exceder 120 caracteres")
    private String newPassword;

    public String getCurrentPassword() { return currentPassword; }
    public void setCurrentPassword(String currentPassword) { this.currentPassword = currentPassword; }

    public String getNewPassword() { return newPassword; }
    public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
}
