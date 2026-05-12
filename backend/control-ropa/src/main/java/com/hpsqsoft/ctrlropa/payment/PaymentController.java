package com.hpsqsoft.ctrlropa.payment;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService service;

    public PaymentController(PaymentService service) {
        this.service = service;
    }

    @PostMapping
    public PaymentResponse create(@Valid @RequestBody CreatePaymentRequest request) {
        return service.create(request);
    }

    @PostMapping("/item-code/{code}")
    public PaymentResponse createByItemCode(@PathVariable String code,
                                            @Valid @RequestBody CreatePaymentByItemRequest request) {
        return service.createByItemCode(code, request);
    }

    @PostMapping("/qr/{qrCode}")
    public PaymentResponse createByQrCode(@PathVariable String qrCode,
                                          @Valid @RequestBody CreatePaymentByItemRequest request) {
        return service.createByQrCode(qrCode, request);
    }
    
    @PostMapping("/package-folio/{folio}")
    public PaymentResponse createByPackageFolio(
            @PathVariable String folio,
            @Valid @RequestBody CreatePaymentByPackageFolioRequest request
    ) {
        return service.createByPackageFolio(folio, request);
    }

    @GetMapping("/{id}")
    public PaymentResponse findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @GetMapping("/customer/{customerId}")
    public List<PaymentResponse> findByCustomer(@PathVariable Long customerId) {
        return service.findByCustomer(customerId);
    }
    
    @GetMapping("/reservation/{reservationId}")
    public List<PaymentResponse> findByReservation(@PathVariable Long reservationId) {
        return service.findByReservation(reservationId);
    }

    @PatchMapping("/{paymentId}/void")
    public PaymentResponse voidPayment(@PathVariable Long paymentId,
                                       @RequestBody VoidPaymentRequest request) {
        return service.voidPayment(paymentId, request.getReason(), request.getVoidedByUserId());
    }

    public static class VoidPaymentRequest {
        private String reason;
        private Long voidedByUserId;

        public String getReason() {
            return reason;
        }

        public void setReason(String reason) {
            this.reason = reason;
        }

        public Long getVoidedByUserId() {
            return voidedByUserId;
        }

        public void setVoidedByUserId(Long voidedByUserId) {
            this.voidedByUserId = voidedByUserId;
        }
    }
}