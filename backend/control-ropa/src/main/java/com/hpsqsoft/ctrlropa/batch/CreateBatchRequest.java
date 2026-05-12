package com.hpsqsoft.ctrlropa.batch;

public class CreateBatchRequest {

    private Integer expectedQuantity;
    private Long supplierId;
    private String notes;

    public CreateBatchRequest() {
    }

    public Integer getExpectedQuantity() { return expectedQuantity; }
    public void setExpectedQuantity(Integer expectedQuantity) { this.expectedQuantity = expectedQuantity; }

    public Long getSupplierId() { return supplierId; }
    public void setSupplierId(Long supplierId) { this.supplierId = supplierId; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
