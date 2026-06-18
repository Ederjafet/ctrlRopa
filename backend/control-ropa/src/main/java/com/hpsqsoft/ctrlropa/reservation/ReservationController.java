package com.hpsqsoft.ctrlropa.reservation;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private static final String IDEMPOTENCY_KEY_HEADER = "X-Idempotency-Key";

    private final ReservationService service;

    public ReservationController(ReservationService service) {
        this.service = service;
    }

    @GetMapping("/branch/{branchId}")
    public List<ReservationResponse> findByBranch(@PathVariable Long branchId) {
        return service.findByBranch(branchId);
    }

    @GetMapping("/branch/{branchId}/without-box")
    public List<ReservationResponse> findActiveWithoutBox(@PathVariable Long branchId) {
        return service.findActiveWithoutBox(branchId);
    }

    @GetMapping("/box/{boxId}")
    public List<ReservationResponse> findByBox(@PathVariable Long boxId) {
        return service.findByBox(boxId);
    }

    @GetMapping("/{id}")
    public ReservationResponse findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    public ReservationResponse create(
            @RequestBody ReservationService.CreateReservationRequest request,
            @RequestHeader(value = IDEMPOTENCY_KEY_HEADER, required = false) String idempotencyKey
    ) {
        return service.create(request, idempotencyKey);
    }

    @PatchMapping("/{reservationId}/box/{boxId}")
    public ReservationResponse assignBox(@PathVariable Long reservationId,
                                         @PathVariable Long boxId) {
        return service.assignBox(reservationId, boxId);
    }

    @PatchMapping("/{reservationId}/remove-box")
    public ReservationResponse removeBox(@PathVariable Long reservationId) {
        return service.removeBox(reservationId);
    }

    @PatchMapping("/{reservationId}/cancel")
    public ReservationResponse cancel(@PathVariable Long reservationId,
                                      @RequestBody CancelReservationRequest request) {
        return service.cancel(reservationId, request.getReason());
    }

    @PatchMapping("/{reservationId}/live-operational-status")
    public ReservationResponse updateLiveOperationalStatus(
            @PathVariable Long reservationId,
            @RequestBody ReservationService.UpdateLiveOperationalStatusRequest request
    ) {
        return service.updateLiveOperationalStatus(reservationId, request);
    }

    public static class CancelReservationRequest {
        private String reason;

        public String getReason() {
            return reason;
        }

        public void setReason(String reason) {
            this.reason = reason;
        }
    }
}
