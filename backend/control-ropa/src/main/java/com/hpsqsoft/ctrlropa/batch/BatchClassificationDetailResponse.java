package com.hpsqsoft.ctrlropa.batch;

public class BatchClassificationDetailResponse {

    private Long id;
    private Long productTypeId;
    private String productTypeCode;
    private String productTypeName;
    private Integer quantity;

    public BatchClassificationDetailResponse() {
    }

    public BatchClassificationDetailResponse(Long id,
                                             Long productTypeId,
                                             String productTypeCode,
                                             String productTypeName,
                                             Integer quantity) {
        this.id = id;
        this.productTypeId = productTypeId;
        this.productTypeCode = productTypeCode;
        this.productTypeName = productTypeName;
        this.quantity = quantity;
    }

    public Long getId() { return id; }
    public Long getProductTypeId() { return productTypeId; }
    public String getProductTypeCode() { return productTypeCode; }
    public String getProductTypeName() { return productTypeName; }
    public Integer getQuantity() { return quantity; }
}
