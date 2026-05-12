package com.hpsqsoft.ctrlropa.inventory;

import jakarta.validation.constraints.Size;

public class UpdateStorageLocationRequest {

    @Size(max = 50, message = "code no puede exceder 50 caracteres")
    private String code;

    @Size(max = 150, message = "name no puede exceder 150 caracteres")
    private String name;

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    } 

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    } 
}