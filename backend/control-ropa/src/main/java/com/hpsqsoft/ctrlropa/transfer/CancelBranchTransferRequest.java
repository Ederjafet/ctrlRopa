package com.hpsqsoft.ctrlropa.transfer;

import jakarta.validation.constraints.Size;

public class CancelBranchTransferRequest {

    @Size(max = 500, message = "reason no puede exceder 500 caracteres")
    private String reason;

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}