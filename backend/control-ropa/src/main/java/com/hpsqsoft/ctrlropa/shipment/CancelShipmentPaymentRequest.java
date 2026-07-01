package com.hpsqsoft.ctrlropa.shipment;

import java.time.LocalDateTime;

public class CancelShipmentPaymentRequest {
    private String cancelReason;
    private LocalDateTime cancelledAt;

    public String getCancelReason() { return cancelReason; }
    public void setCancelReason(String cancelReason) { this.cancelReason = cancelReason; }
    public LocalDateTime getCancelledAt() { return cancelledAt; }
    public void setCancelledAt(LocalDateTime cancelledAt) { this.cancelledAt = cancelledAt; }
}
