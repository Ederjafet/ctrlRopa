package com.hpsqsoft.ctrlropa.consignment;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public class CreateConsignmentRequest {

    @NotNull(message = "branchId es obligatorio")
    private Long branchId;

    @NotNull(message = "consigneeId es obligatorio")
    private Long consigneeId;

    @Size(max = 500, message = "notes no puede exceder 500 caracteres")
    private String notes;

    private List<AddConsignmentItemRequest> items;

    public Long getBranchId() {
        return branchId;
    }

    public void setBranchId(Long branchId) {
        this.branchId = branchId;
    }

    public Long getConsigneeId() {
        return consigneeId;
    }

    public void setConsigneeId(Long consigneeId) {
        this.consigneeId = consigneeId;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public List<AddConsignmentItemRequest> getItems() {
        return items;
    }

    public void setItems(List<AddConsignmentItemRequest> items) {
        this.items = items;
    }
}