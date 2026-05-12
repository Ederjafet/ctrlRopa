package com.hpsqsoft.ctrlropa.batch;

import java.time.LocalDateTime;
import java.util.List;

public class BatchResponse {

    private Long id;
    private Long branchId;
    private String branchCode;
    private String branchName;
    private Long supplierId;
    private String supplierName;
    private String folio;
    private Integer expectedQuantity;
    private Integer receivedQuantity;
    private LocalDateTime receivedAt;
    private Integer classifiedQuantity;
    private Integer itemCount;
    private String status;
    private Integer qualityScore;
    private String qualityNotes;
    private String notes;
    private Long createdByUserId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<BatchClassificationDetailResponse> classificationDetails;

    public BatchResponse() {
    }

    public BatchResponse(Long id,
                         Long branchId,
                         String branchCode,
                         String branchName,
                         Long supplierId,
                         String supplierName,
                         String folio,
                         Integer expectedQuantity,
                         Integer receivedQuantity,
                         LocalDateTime receivedAt,
                         Integer classifiedQuantity,
                         Integer itemCount,
                         String status,
                         Integer qualityScore,
                         String qualityNotes,
                         String notes,
                         Long createdByUserId,
                         LocalDateTime createdAt,
                         LocalDateTime updatedAt,
                         List<BatchClassificationDetailResponse> classificationDetails) {
        this.id = id;
        this.branchId = branchId;
        this.branchCode = branchCode;
        this.branchName = branchName;
        this.supplierId = supplierId;
        this.supplierName = supplierName;
        this.folio = folio;
        this.expectedQuantity = expectedQuantity;
        this.receivedQuantity = receivedQuantity;
        this.receivedAt = receivedAt;
        this.classifiedQuantity = classifiedQuantity;
        this.itemCount = itemCount;
        this.status = status;
        this.qualityScore = qualityScore;
        this.qualityNotes = qualityNotes;
        this.notes = notes;
        this.createdByUserId = createdByUserId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.classificationDetails = classificationDetails;
    }

    public Long getId() { return id; }
    public Long getBranchId() { return branchId; }
    public String getBranchCode() { return branchCode; }
    public String getBranchName() { return branchName; }
    public Long getSupplierId() { return supplierId; }
    public String getSupplierName() { return supplierName; }
    public String getFolio() { return folio; }
    public Integer getExpectedQuantity() { return expectedQuantity; }
    public Integer getReceivedQuantity() { return receivedQuantity; }
    public LocalDateTime getReceivedAt() { return receivedAt; }
    public Integer getClassifiedQuantity() { return classifiedQuantity; }
    public Integer getItemCount() { return itemCount; }
    public String getStatus() { return status; }
    public Integer getQualityScore() { return qualityScore; }
    public String getQualityNotes() { return qualityNotes; }
    public String getNotes() { return notes; }
    public Long getCreatedByUserId() { return createdByUserId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public List<BatchClassificationDetailResponse> getClassificationDetails() { return classificationDetails; }
}
