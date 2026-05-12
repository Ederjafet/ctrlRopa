package com.hpsqsoft.ctrlropa.inventory;

import jakarta.validation.constraints.Size;

public class UpdateBoxRequest {

    @Size(max = 50, message = "code no puede exceder 50 caracteres")
    private String code;

    @Size(max = 255, message = "description no puede exceder 255 caracteres")
    private String description;

    @Size(max = 100, message = "qrCode no puede exceder 100 caracteres")
    private String qrCode;

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    } 

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getQrCode() {
        return qrCode;
    }

    public void setQrCode(String qrCode) {
        this.qrCode = qrCode;
    }
}