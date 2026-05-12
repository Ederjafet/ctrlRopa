package com.hpsqsoft.ctrlropa.item;

import java.math.BigDecimal;

public class ItemResponse {

    private Long id;
    private String code;
    private String qrCode;
    private Long branchId;
    private String branchCode;
    private Long batchId;
    private String batchFolio;
    private Long productTypeId;
    private String productTypeCode;
    private String productTypeName;
    private Long brandId;
    private String brandCode;
    private String brandName;
    private Long sizeId;
    private String sizeCode;
    private String sizeName;
    private String comments;
    private BigDecimal price;
    private String status;
    private Long storageLocationId;
    private String storageLocationCode;
    private String storageLocationName;
    private Long createdByUserId;

    public ItemResponse() {
    }

    public ItemResponse(Long id,
                        String code,
                        String qrCode,
                        Long branchId,
                        String branchCode,
                        Long batchId,
                        String batchFolio,
                        Long productTypeId,
                        String productTypeCode,
                        String productTypeName,
                        Long brandId,
                        String brandCode,
                        String brandName,
                        Long sizeId,
                        String sizeCode,
                        String sizeName,
                        String comments,
                        BigDecimal price,
                        String status,
                        Long storageLocationId,
                        String storageLocationCode,
                        String storageLocationName,
                        Long createdByUserId) {
        this.id = id;
        this.code = code;
        this.qrCode = qrCode;
        this.branchId = branchId;
        this.branchCode = branchCode;
        this.batchId = batchId;
        this.batchFolio = batchFolio;
        this.productTypeId = productTypeId;
        this.productTypeCode = productTypeCode;
        this.productTypeName = productTypeName;
        this.brandId = brandId;
        this.brandCode = brandCode;
        this.brandName = brandName;
        this.sizeId = sizeId;
        this.sizeCode = sizeCode;
        this.sizeName = sizeName;
        this.comments = comments;
        this.price = price;
        this.status = status;
        this.storageLocationId = storageLocationId;
        this.storageLocationCode = storageLocationCode;
        this.storageLocationName = storageLocationName;
        this.createdByUserId = createdByUserId;
    }

    public Long getId() { return id; }
    public String getCode() { return code; }
    public String getQrCode() { return qrCode; }
    public Long getBranchId() { return branchId; }
    public String getBranchCode() { return branchCode; }
    public Long getBatchId() { return batchId; }
    public String getBatchFolio() { return batchFolio; }
    public Long getProductTypeId() { return productTypeId; }
    public String getProductTypeCode() { return productTypeCode; }
    public String getProductTypeName() { return productTypeName; }
    public Long getBrandId() { return brandId; }
    public String getBrandCode() { return brandCode; }
    public String getBrandName() { return brandName; }
    public Long getSizeId() { return sizeId; }
    public String getSizeCode() { return sizeCode; }
    public String getSizeName() { return sizeName; }
    public String getComments() { return comments; }
    public BigDecimal getPrice() { return price; }
    public String getStatus() { return status; }
    public Long getStorageLocationId() { return storageLocationId; }
    public String getStorageLocationCode() { return storageLocationCode; }
    public String getStorageLocationName() { return storageLocationName; }
    public Long getCreatedByUserId() { return createdByUserId; }
}