package com.hpsqsoft.ctrlropa.consignment;

import jakarta.validation.constraints.Size;

public class CancelConsignmentRequest {

    @Size(max = 500, message = "reason no puede exceder 500 caracteres")
    private String reason;

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}