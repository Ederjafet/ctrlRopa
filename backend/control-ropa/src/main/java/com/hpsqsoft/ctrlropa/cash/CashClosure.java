package com.hpsqsoft.ctrlropa.cash;

import com.hpsqsoft.ctrlropa.branch.Branch;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "cash_closures",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_cash_closure_branch_date", columnNames = {"branch_id", "closure_date"})
        }
)
public class CashClosure {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @Column(name = "closure_date", nullable = false)
    private LocalDate closureDate;

    @Column(name = "expected_cash", nullable = false, precision = 12, scale = 2)
    private BigDecimal expectedCash;

    @Column(name = "expenses_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal expensesTotal;

    @Column(name = "delivered_cash", nullable = false, precision = 12, scale = 2)
    private BigDecimal deliveredCash;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal difference;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CashClosureStatus status;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "created_by_user_id", nullable = false)
    private Long createdByUserId;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @Column(name = "closed_by_user_id")
    private Long closedByUserId;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "cancelled_by_user_id")
    private Long cancelledByUserId;

    @Column(name = "cancel_reason", columnDefinition = "TEXT")
    private String cancelReason;

    public CashClosure() {
    }

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();

        if (this.expectedCash == null) this.expectedCash = BigDecimal.ZERO;
        if (this.expensesTotal == null) this.expensesTotal = BigDecimal.ZERO;
        if (this.deliveredCash == null) this.deliveredCash = BigDecimal.ZERO;
        if (this.difference == null) this.difference = BigDecimal.ZERO;

        if (this.status == null) {
            this.status = CashClosureStatus.OPEN;
        }
    }

    public Long getId() { return id; }

    public Branch getBranch() { return branch; }
    public void setBranch(Branch branch) { this.branch = branch; }

    public LocalDate getClosureDate() { return closureDate; }
    public void setClosureDate(LocalDate closureDate) { this.closureDate = closureDate; }

    public BigDecimal getExpectedCash() { return expectedCash; }
    public void setExpectedCash(BigDecimal expectedCash) { this.expectedCash = expectedCash; }

    public BigDecimal getExpensesTotal() { return expensesTotal; }
    public void setExpensesTotal(BigDecimal expensesTotal) { this.expensesTotal = expensesTotal; }

    public BigDecimal getDeliveredCash() { return deliveredCash; }
    public void setDeliveredCash(BigDecimal deliveredCash) { this.deliveredCash = deliveredCash; }

    public BigDecimal getDifference() { return difference; }
    public void setDifference(BigDecimal difference) { this.difference = difference; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public CashClosureStatus getStatus() { return status; }
    public void setStatus(CashClosureStatus status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public Long getCreatedByUserId() { return createdByUserId; }
    public void setCreatedByUserId(Long createdByUserId) { this.createdByUserId = createdByUserId; }

    public LocalDateTime getClosedAt() { return closedAt; }
    public void setClosedAt(LocalDateTime closedAt) { this.closedAt = closedAt; }

    public Long getClosedByUserId() { return closedByUserId; }
    public void setClosedByUserId(Long closedByUserId) { this.closedByUserId = closedByUserId; }

    public LocalDateTime getCancelledAt() { return cancelledAt; }
    public void setCancelledAt(LocalDateTime cancelledAt) { this.cancelledAt = cancelledAt; }

    public Long getCancelledByUserId() { return cancelledByUserId; }
    public void setCancelledByUserId(Long cancelledByUserId) { this.cancelledByUserId = cancelledByUserId; }

    public String getCancelReason() { return cancelReason; }
    public void setCancelReason(String cancelReason) { this.cancelReason = cancelReason; }
}