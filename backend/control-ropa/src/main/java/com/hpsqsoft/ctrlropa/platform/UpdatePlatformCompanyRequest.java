package com.hpsqsoft.ctrlropa.platform;

import jakarta.validation.constraints.Size;

public class UpdatePlatformCompanyRequest {

    @Size(max = 150, message = "name no puede exceder 150 caracteres")
    private String name;

    @Size(max = 20, message = "status no puede exceder 20 caracteres")
    private String status;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
