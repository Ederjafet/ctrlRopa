package com.hpsqsoft.ctrlropa.returns;

import jakarta.validation.constraints.NotNull;

public class ProcessReturnRequest {

    @NotNull(message = "processedByUserId es obligatorio")
    private Long processedByUserId;

    public Long getProcessedByUserId() {
        return processedByUserId;
    }

    public void setProcessedByUserId(Long processedByUserId) {
        this.processedByUserId = processedByUserId;
    }
}