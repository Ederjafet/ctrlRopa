package com.hpsqsoft.ctrlropa.refund;

import java.math.BigDecimal;

public class RefundLookupResponse {

    private Long itemId;
    private String itemCode;

    private Long saleId;
    private BigDecimal salePrice;

    private BigDecimal totalPaid;
    private BigDecimal totalRefunded;
    private BigDecimal refundableAvailable;

    private Long returnId;
    private String returnStatus;

    public RefundLookupResponse(Long itemId,
                                String itemCode,
                                Long saleId,
                                BigDecimal salePrice,
                                BigDecimal totalPaid,
                                BigDecimal totalRefunded,
                                BigDecimal refundableAvailable,
                                Long returnId,
                                String returnStatus) {
        this.itemId = itemId;
        this.itemCode = itemCode;
        this.saleId = saleId;
        this.salePrice = salePrice;
        this.totalPaid = totalPaid;
        this.totalRefunded = totalRefunded;
        this.refundableAvailable = refundableAvailable;
        this.returnId = returnId;
        this.returnStatus = returnStatus;
    }

    public Long getItemId() { return itemId; }
    public String getItemCode() { return itemCode; }
    public Long getSaleId() { return saleId; }
    public BigDecimal getSalePrice() { return salePrice; }
    public BigDecimal getTotalPaid() { return totalPaid; }
    public BigDecimal getTotalRefunded() { return totalRefunded; }
    public BigDecimal getRefundableAvailable() { return refundableAvailable; }
    public Long getReturnId() { return returnId; }
    public String getReturnStatus() { return returnStatus; }
}