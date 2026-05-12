package com.hpsqsoft.ctrlropa.returns;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CreateReturnRequest {

    @NotNull(message = "saleId es obligatorio")
    private Long saleId;

    @NotNull(message = "type es obligatorio")
    private ReturnType type;

    @NotBlank(message = "reason es obligatorio")
    @Size(max = 255)
    private String reason;

    @Size(max = 500)
    private String notes;

    @NotNull(message = "createdByUserId es obligatorio")
    private Long createdByUserId;

    // 🔥 IMPORTANTE: getters y setters

    public Long getSaleId() {
        return saleId;
    }

    public void setSaleId(Long saleId) {
        this.saleId = saleId;
    }

    public ReturnType getType() {
        return type;
    }

    public void setType(ReturnType type) {
        this.type = type;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Long getCreatedByUserId() {
        return createdByUserId;
    }

    public void setCreatedByUserId(Long createdByUserId) {
        this.createdByUserId = createdByUserId;
    }
}