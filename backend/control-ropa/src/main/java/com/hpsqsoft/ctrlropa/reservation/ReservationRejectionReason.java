package com.hpsqsoft.ctrlropa.reservation;

public enum ReservationRejectionReason {
    ITEM_NOT_AVAILABLE,
    ACTIVE_RESERVATION_EXISTS,
    IDEMPOTENCY_PAYLOAD_MISMATCH,
    IDEMPOTENCY_CONFLICT_OR_IN_PROGRESS,
    VALIDATION_REJECTED
}
