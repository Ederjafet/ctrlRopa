package com.hpsqsoft.ctrlropa.transfer;

import com.hpsqsoft.ctrlropa.item.Item;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "branch_transfer_items")
public class BranchTransferItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_transfer_id", nullable = false)
    private BranchTransfer branchTransfer;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @Column(name = "received_at")
    private LocalDateTime receivedAt;

    @Column(name = "received_by_user_id")
    private Long receivedByUserId;

    public Long getId() { return id; }

    public BranchTransfer getBranchTransfer() { return branchTransfer; }
    public void setBranchTransfer(BranchTransfer branchTransfer) { this.branchTransfer = branchTransfer; }

    public Item getItem() { return item; }
    public void setItem(Item item) { this.item = item; }

    public LocalDateTime getReceivedAt() { return receivedAt; }
    public void setReceivedAt(LocalDateTime receivedAt) { this.receivedAt = receivedAt; }

    public Long getReceivedByUserId() { return receivedByUserId; }
    public void setReceivedByUserId(Long receivedByUserId) { this.receivedByUserId = receivedByUserId; }
}