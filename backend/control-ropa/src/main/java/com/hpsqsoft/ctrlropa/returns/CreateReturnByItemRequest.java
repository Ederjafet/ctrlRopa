package com.hpsqsoft.ctrlropa.returns;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CreateReturnByItemRequest {

    @NotNull(message = "type es obligatorio")
    private ReturnType type;

    @NotNull(message = "condition es obligatorio")
    private ReturnItemCondition condition;

    @NotBlank(message = "reason es obligatorio")
    @Size(max = 255)
    private String reason;

    @Size(max = 500)
    private String notes;

    @NotNull(message = "createdByUserId es obligatorio")
    private Long createdByUserId;

    public ReturnType getType() { return type; }
    public void setType(ReturnType type) { this.type = type; }

    public ReturnItemCondition getCondition() { return condition; }
    public void setCondition(ReturnItemCondition condition) { this.condition = condition; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public Long getCreatedByUserId() { return createdByUserId; }
    public void setCreatedByUserId(Long createdByUserId) { this.createdByUserId = createdByUserId; }
}