package com.hpsqsoft.ctrlropa.platform;

import jakarta.validation.constraints.Size;

public class UpdatePlatformBranchRequest {

    @Size(max = 32, message = "code no puede exceder 32 caracteres")
    private String code;

    @Size(max = 150, message = "name no puede exceder 150 caracteres")
    private String name;

    @Size(max = 20, message = "status no puede exceder 20 caracteres")
    private String status;

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
