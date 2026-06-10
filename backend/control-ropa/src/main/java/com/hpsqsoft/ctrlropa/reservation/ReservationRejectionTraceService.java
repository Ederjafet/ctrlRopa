package com.hpsqsoft.ctrlropa.reservation;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReservationRejectionTraceService {

    private final ReservationRejectionEventRepository repository;

    public ReservationRejectionTraceService(ReservationRejectionEventRepository repository) {
        this.repository = repository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(Long companyId,
                       Long branchId,
                       Long userId,
                       Long itemId,
                       Long liveId,
                       Long reservationId,
                       ReservationRejectionReason reason,
                       String message,
                       String idempotencyKeyHash,
                       String requestHash) {
        if (reason == null || message == null || message.isBlank()) {
            return;
        }

        ReservationRejectionEvent event = new ReservationRejectionEvent();
        event.setCompanyId(companyId);
        event.setBranchId(branchId);
        event.setUserId(userId);
        event.setItemId(itemId);
        event.setLiveId(liveId);
        event.setReservationId(reservationId);
        event.setReasonCode(reason);
        event.setMessage(truncate(message, 255));
        event.setIdempotencyKeyHash(idempotencyKeyHash);
        event.setRequestHash(requestHash);
        repository.save(event);
    }

    private String truncate(String value, int maxLength) {
        if (value.length() <= maxLength) {
            return value;
        }

        return value.substring(0, maxLength);
    }
}
