package com.hpsqsoft.ctrlropa.consignment;

import com.hpsqsoft.ctrlropa.item.Item;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "consignment_items")
public class ConsignmentItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "consignment_id", nullable = false)
    private Consignment consignment;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @Column(name = "suggested_price", precision = 12, scale = 2)
    private BigDecimal suggestedPrice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ConsignmentItemStatus status;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public ConsignmentItem() {
    }

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();

        if (this.status == null) {
            this.status = ConsignmentItemStatus.OUT_ON_CONSIGNMENT;
        }
    }

    public Long getId() { return id; }

    public Consignment getConsignment() { return consignment; }
    public void setConsignment(Consignment consignment) { this.consignment = consignment; }

    public Item getItem() { return item; }
    public void setItem(Item item) { this.item = item; }

    public BigDecimal getSuggestedPrice() { return suggestedPrice; }
    public void setSuggestedPrice(BigDecimal suggestedPrice) { this.suggestedPrice = suggestedPrice; }

    public ConsignmentItemStatus getStatus() { return status; }
    public void setStatus(ConsignmentItemStatus status) { this.status = status; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}