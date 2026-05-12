package com.hpsqsoft.ctrlropa.transfer;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public class CreateBranchTransferRequest {

    @NotNull(message = "fromBranchId es obligatorio")
    private Long fromBranchId;

    @NotNull(message = "toBranchId es obligatorio")
    private Long toBranchId;

    private Long customerOrderId;

    @Size(max = 500, message = "notes no puede exceder 500 caracteres")
    private String notes;

    private List<Long> itemIds;

    public Long getFromBranchId() { return fromBranchId; }
    public void setFromBranchId(Long fromBranchId) { this.fromBranchId = fromBranchId; }

    public Long getToBranchId() { return toBranchId; }
    public void setToBranchId(Long toBranchId) { this.toBranchId = toBranchId; }

    public Long getCustomerOrderId() { return customerOrderId; }
    public void setCustomerOrderId(Long customerOrderId) { this.customerOrderId = customerOrderId; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public List<Long> getItemIds() { return itemIds; }
    public void setItemIds(List<Long> itemIds) { this.itemIds = itemIds; }
}