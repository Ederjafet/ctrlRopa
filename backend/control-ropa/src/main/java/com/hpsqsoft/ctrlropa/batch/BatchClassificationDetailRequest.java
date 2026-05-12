package com.hpsqsoft.ctrlropa.batch;

public class BatchClassificationDetailRequest {

    private Long productTypeId;
    private Integer quantity;

    public BatchClassificationDetailRequest() {
    }

    public Long getProductTypeId() { return productTypeId; }
    public void setProductTypeId(Long productTypeId) { this.productTypeId = productTypeId; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
}
