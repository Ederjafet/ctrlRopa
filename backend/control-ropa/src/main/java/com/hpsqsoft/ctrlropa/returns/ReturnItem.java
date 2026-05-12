package com.hpsqsoft.ctrlropa.returns;

import com.hpsqsoft.ctrlropa.item.Item;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "return_items")
public class ReturnItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "return_id", nullable = false)
    private CustomerReturn customerReturn;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @Enumerated(EnumType.STRING)
    @Column(name = "condition_status", nullable = false, length = 20)
    private ReturnItemCondition condition;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public ReturnItem() {
    }

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public CustomerReturn getCustomerReturn() {
        return customerReturn;
    }

    public void setCustomerReturn(CustomerReturn customerReturn) {
        this.customerReturn = customerReturn;
    }

    public Item getItem() {
        return item;
    }

    public void setItem(Item item) {
        this.item = item;
    }

    public ReturnItemCondition getCondition() {
        return condition;
    }

    public void setCondition(ReturnItemCondition condition) {
        this.condition = condition;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}