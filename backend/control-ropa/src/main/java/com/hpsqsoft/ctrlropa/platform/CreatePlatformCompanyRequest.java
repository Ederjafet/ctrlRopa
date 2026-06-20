package com.hpsqsoft.ctrlropa.platform;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreatePlatformCompanyRequest {

    @NotBlank(message = "name es obligatorio")
    @Size(max = 150, message = "name no puede exceder 150 caracteres")
    private String name;

    @Size(max = 150, message = "legalName no puede exceder 150 caracteres")
    private String legalName;

    @NotBlank(message = "branchName es obligatorio")
    @Size(max = 150, message = "branchName no puede exceder 150 caracteres")
    private String branchName;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getLegalName() { return legalName; }
    public void setLegalName(String legalName) { this.legalName = legalName; }

    public String getBranchName() { return branchName; }
    public void setBranchName(String branchName) { this.branchName = branchName; }
}
