package com.hpsqsoft.ctrlropa.customerpackage;

import com.hpsqsoft.ctrlropa.branch.Branch;
import com.hpsqsoft.ctrlropa.customer.Customer;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "customer_packages")
public class CustomerPackage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 64, unique = true)
    private String folio;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CustomerPackageStatus status;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "shipping_cost_amount", precision = 12, scale = 2)
    private BigDecimal shippingCostAmount;

    @Column(name = "shipping_cost_confirmed", nullable = false)
    private boolean shippingCostConfirmed;

    @Column(name = "shipping_cost_waived", nullable = false)
    private boolean shippingCostWaived;

    @Column(name = "shipping_carrier", length = 100)
    private String shippingCarrier;

    @Column(name = "tracking_number", length = 100)
    private String trackingNumber;

    @Column(name = "shipping_notes", columnDefinition = "TEXT")
    private String shippingNotes;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "created_by_user_id", nullable = false)
    private Long createdByUserId;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @Column(name = "closed_by_user_id")
    private Long closedByUserId;

    public CustomerPackage() {
    }

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = CustomerPackageStatus.OPEN;
        }
    }

    public Long getId() {
        return id;
    }

    public String getFolio() {
        return folio;
    }

    public void setFolio(String folio) {
        this.folio = folio;
    }

    public Customer getCustomer() {
        return customer;
    }

    public void setCustomer(Customer customer) {
        this.customer = customer;
    }

    public Branch getBranch() {
        return branch;
    }

    public void setBranch(Branch branch) {
        this.branch = branch;
    }

    public CustomerPackageStatus getStatus() {
        return status;
    }

    public void setStatus(CustomerPackageStatus status) {
        this.status = status;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public BigDecimal getShippingCostAmount() {
        return shippingCostAmount;
    }

    public void setShippingCostAmount(BigDecimal shippingCostAmount) {
        this.shippingCostAmount = shippingCostAmount;
    }

    public boolean isShippingCostConfirmed() {
        return shippingCostConfirmed;
    }

    public void setShippingCostConfirmed(boolean shippingCostConfirmed) {
        this.shippingCostConfirmed = shippingCostConfirmed;
    }

    public boolean isShippingCostWaived() {
        return shippingCostWaived;
    }

    public void setShippingCostWaived(boolean shippingCostWaived) {
        this.shippingCostWaived = shippingCostWaived;
    }

    public String getShippingCarrier() {
        return shippingCarrier;
    }

    public void setShippingCarrier(String shippingCarrier) {
        this.shippingCarrier = shippingCarrier;
    }

    public String getTrackingNumber() {
        return trackingNumber;
    }

    public void setTrackingNumber(String trackingNumber) {
        this.trackingNumber = trackingNumber;
    }

    public String getShippingNotes() {
        return shippingNotes;
    }

    public void setShippingNotes(String shippingNotes) {
        this.shippingNotes = shippingNotes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public Long getCreatedByUserId() {
        return createdByUserId;
    }

    public void setCreatedByUserId(Long createdByUserId) {
        this.createdByUserId = createdByUserId;
    }

    public LocalDateTime getClosedAt() {
        return closedAt;
    }

    public void setClosedAt(LocalDateTime closedAt) {
        this.closedAt = closedAt;
    }

    public Long getClosedByUserId() {
        return closedByUserId;
    }

    public void setClosedByUserId(Long closedByUserId) {
        this.closedByUserId = closedByUserId;
    }
}
