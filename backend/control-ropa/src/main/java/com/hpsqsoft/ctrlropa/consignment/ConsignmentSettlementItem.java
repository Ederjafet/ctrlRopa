package com.hpsqsoft.ctrlropa.consignment;

import com.hpsqsoft.ctrlropa.customer.Customer;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "consignment_settlement_items")
public class ConsignmentSettlementItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "consignment_settlement_id", nullable = false)
    private ConsignmentSettlement consignmentSettlement;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "consignment_item_id", nullable = false)
    private ConsignmentItem consignmentItem;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ConsignmentSettlementResult result;

    @Column(name = "sale_price", precision = 12, scale = 2)
    private BigDecimal salePrice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public ConsignmentSettlementItem() {
    }

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }

    public ConsignmentSettlement getConsignmentSettlement() { return consignmentSettlement; }
    public void setConsignmentSettlement(ConsignmentSettlement consignmentSettlement) {
        this.consignmentSettlement = consignmentSettlement;
    }

    public ConsignmentItem getConsignmentItem() { return consignmentItem; }
    public void setConsignmentItem(ConsignmentItem consignmentItem) {
        this.consignmentItem = consignmentItem;
    }

    public ConsignmentSettlementResult getResult() { return result; }
    public void setResult(ConsignmentSettlementResult result) { this.result = result; }

    public BigDecimal getSalePrice() { return salePrice; }
    public void setSalePrice(BigDecimal salePrice) { this.salePrice = salePrice; }

    public Customer getCustomer() { return customer; }
    public void setCustomer(Customer customer) { this.customer = customer; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}