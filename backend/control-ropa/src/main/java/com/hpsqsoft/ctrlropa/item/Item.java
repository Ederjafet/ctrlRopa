package com.hpsqsoft.ctrlropa.item;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.hpsqsoft.ctrlropa.batch.Batch;
import com.hpsqsoft.ctrlropa.branch.Branch;
import com.hpsqsoft.ctrlropa.catalog.Brand;
import com.hpsqsoft.ctrlropa.catalog.ProductType;
import com.hpsqsoft.ctrlropa.catalog.Size;
import com.hpsqsoft.ctrlropa.company.Company;
import com.hpsqsoft.ctrlropa.inventory.StorageLocation;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "items",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_items_company_code", columnNames = {"company_id", "code"}),
                @UniqueConstraint(name = "uq_items_company_qr_code", columnNames = {"company_id", "qr_code"})
        }
)
public class Item {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(nullable = false, length = 50)
    private String code;

    @Column(name = "qr_code", nullable = false, length = 100)
    private String qrCode;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id")
    private Batch batch;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "product_type_id", nullable = false)
    private ProductType productType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brand_id")
    private Brand brand;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "size_id")
    private Size size;

    @Column(length = 500)
    private String comments;

    @Column(precision = 12, scale = 2)
    private BigDecimal price;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ItemStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "storage_location_id")
    private StorageLocation storageLocation;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "created_by_user_id", nullable = false)
    private Long createdByUserId;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Item() {}

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }

    public Company getCompany() { return company; }
    public void setCompany(Company company) { this.company = company; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getQrCode() { return qrCode; }
    public void setQrCode(String qrCode) { this.qrCode = qrCode; }

    public Branch getBranch() { return branch; }
    public void setBranch(Branch branch) { this.branch = branch; }

    public Batch getBatch() { return batch; }
    public void setBatch(Batch batch) { this.batch = batch; }

    public ProductType getProductType() { return productType; }
    public void setProductType(ProductType productType) { this.productType = productType; }

    public Brand getBrand() { return brand; }
    public void setBrand(Brand brand) { this.brand = brand; }

    public Size getSize() { return size; }
    public void setSize(Size size) { this.size = size; }

    public String getComments() { return comments; }
    public void setComments(String comments) { this.comments = comments; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public ItemStatus getStatus() { return status; }
    public void setStatus(ItemStatus status) { this.status = status; }

    public StorageLocation getStorageLocation() { return storageLocation; }
    public void setStorageLocation(StorageLocation storageLocation) { this.storageLocation = storageLocation; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public Long getCreatedByUserId() { return createdByUserId; }
    public void setCreatedByUserId(Long createdByUserId) { this.createdByUserId = createdByUserId; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
