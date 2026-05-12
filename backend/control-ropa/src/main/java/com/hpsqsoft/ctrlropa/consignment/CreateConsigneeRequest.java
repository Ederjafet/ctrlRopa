package com.hpsqsoft.ctrlropa.consignment;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CreateConsigneeRequest {

    @NotNull(message = "branchId es obligatorio")
    private Long branchId;

    @NotBlank(message = "name es obligatorio")
    @Size(max = 180, message = "name no puede exceder 180 caracteres")
    private String name;

    @NotBlank(message = "phone es obligatorio")
    @Size(max = 40, message = "phone no puede exceder 40 caracteres")
    private String phone;

    @Email(message = "email inválido")
    @Size(max = 190, message = "email no puede exceder 190 caracteres")
    private String email;

    @Size(max = 500, message = "notes no puede exceder 500 caracteres")
    private String notes;

    public Long getBranchId() {
        return branchId;
    }

    public void setBranchId(Long branchId) {
        this.branchId = branchId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
    
    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}