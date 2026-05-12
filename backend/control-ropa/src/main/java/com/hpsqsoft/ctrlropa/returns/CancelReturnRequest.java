package com.hpsqsoft.ctrlropa.returns;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CancelReturnRequest {

    @NotBlank(message = "reason es obligatorio")
    @Size(max = 255, message = "reason no puede exceder 255 caracteres")
    private String reason;

    @NotNull(message = "cancelledByUserId es obligatorio")
    private Long cancelledByUserId;

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public Long getCancelledByUserId() {
        return cancelledByUserId;
    }

    public void setCancelledByUserId(Long cancelledByUserId) {
        this.cancelledByUserId = cancelledByUserId;
    }
}