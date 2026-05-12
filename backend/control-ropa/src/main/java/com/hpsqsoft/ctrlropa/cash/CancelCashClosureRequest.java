package com.hpsqsoft.ctrlropa.cash;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CancelCashClosureRequest {

    @NotBlank(message = "reason es obligatorio")
    @Size(max = 500, message = "reason no puede exceder 500 caracteres")
    private String reason;

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}