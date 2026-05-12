package com.hpsqsoft.ctrlropa.customerpackage;

import com.hpsqsoft.ctrlropa.item.Item;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "customer_package_items",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_customer_package_items", columnNames = {"customer_package_id", "item_id"})
        }
)
public class CustomerPackageItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_package_id", nullable = false)
    private Long customerPackageId;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @Column(name = "reservation_id")
    private Long reservationId;

    @Column(name = "sale_id")
    private Long saleId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public CustomerPackageItem() {
    }

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Long getCustomerPackageId() {
        return customerPackageId;
    }

    public void setCustomerPackageId(Long customerPackageId) {
        this.customerPackageId = customerPackageId;
    }

    public Item getItem() {
        return item;
    }

    public void setItem(Item item) {
        this.item = item;
    }

    public Long getReservationId() {
        return reservationId;
    }

    public void setReservationId(Long reservationId) {
        this.reservationId = reservationId;
    }

    public Long getSaleId() {
        return saleId;
    }

    public void setSaleId(Long saleId) {
        this.saleId = saleId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}