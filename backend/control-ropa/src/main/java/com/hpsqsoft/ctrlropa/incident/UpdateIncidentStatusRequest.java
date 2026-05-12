package com.hpsqsoft.ctrlropa.incident;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class UpdateIncidentStatusRequest {

    @NotNull(message = "status es obligatorio")
    private IncidentStatus status;

    @Size(max = 255, message = "evidenceUrl no puede exceder 255 caracteres")
    private String evidenceUrl;

    @Size(max = 2000, message = "description no puede exceder 2000 caracteres")
    private String description;

    @NotNull(message = "actedByUserId es obligatorio")
    private Long actedByUserId;

    public IncidentStatus getStatus() {
        return status;
    }

    public void setStatus(IncidentStatus status) {
        this.status = status;
    }

    public String getEvidenceUrl() {
        return evidenceUrl;
    }

    public void setEvidenceUrl(String evidenceUrl) {
        this.evidenceUrl = evidenceUrl;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Long getActedByUserId() {
        return actedByUserId;
    }

    public void setActedByUserId(Long actedByUserId) {
        this.actedByUserId = actedByUserId;
    }
}