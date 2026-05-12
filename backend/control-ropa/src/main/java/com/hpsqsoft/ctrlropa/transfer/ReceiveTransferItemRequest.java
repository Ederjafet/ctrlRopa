package com.hpsqsoft.ctrlropa.transfer;

public class ReceiveTransferItemRequest {

    private Long itemId;
    private String itemCode;
    private String qrCode;

    public Long getItemId() { return itemId; }
    public void setItemId(Long itemId) { this.itemId = itemId; }

    public String getItemCode() { return itemCode; }
    public void setItemCode(String itemCode) { this.itemCode = itemCode; }

    public String getQrCode() { return qrCode; }
    public void setQrCode(String qrCode) { this.qrCode = qrCode; }
}