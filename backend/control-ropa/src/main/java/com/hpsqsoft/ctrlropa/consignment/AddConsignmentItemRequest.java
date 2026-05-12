package com.hpsqsoft.ctrlropa.consignment;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public class AddConsignmentItemRequest {

    private Long itemId;
    private String itemCode;
    private String qrCode;

    @DecimalMin(value = "0.01", message = "suggestedPrice debe ser mayor a 0")
    private BigDecimal suggestedPrice;

    @Size(max = 500, message = "notes no puede exceder 500 caracteres")
    private String notes;

    public Long getItemId() {
        return itemId;
    }

    public void setItemId(Long itemId) {
        this.itemId = itemId;
    }

    public String getItemCode() {
        return itemCode;
    }

    public void setItemCode(String itemCode) {
        this.itemCode = itemCode;
    }

    public String getQrCode() {
        return qrCode;
    }

    public void setQrCode(String qrCode) {
        this.qrCode = qrCode;
    }

    public BigDecimal getSuggestedPrice() {
        return suggestedPrice;
    }

    public void setSuggestedPrice(BigDecimal suggestedPrice) {
        this.suggestedPrice = suggestedPrice;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}