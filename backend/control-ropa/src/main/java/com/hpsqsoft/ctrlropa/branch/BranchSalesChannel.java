package com.hpsqsoft.ctrlropa.branch;

import com.hpsqsoft.ctrlropa.catalog.SalesChannel;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "branch_sales_channels",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_branch_sales_channel", columnNames = {"branch_id", "sales_channel_id"})
    }
)
public class BranchSalesChannel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "sales_channel_id", nullable = false)
    private SalesChannel salesChannel;

    @Column(name = "is_enabled", nullable = false)
    private Boolean enabled;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "updated_by_user_id")
    private Long updatedByUserId;

    public BranchSalesChannel() {
    }

    @PrePersist
    @PreUpdate
    public void touch() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }

    public Branch getBranch() { return branch; }
    public void setBranch(Branch branch) { this.branch = branch; }

    public SalesChannel getSalesChannel() { return salesChannel; }
    public void setSalesChannel(SalesChannel salesChannel) { this.salesChannel = salesChannel; }

    public Boolean getEnabled() { return enabled; }
    public void setEnabled(Boolean enabled) { this.enabled = enabled; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public Long getUpdatedByUserId() { return updatedByUserId; }
    public void setUpdatedByUserId(Long updatedByUserId) { this.updatedByUserId = updatedByUserId; }
}