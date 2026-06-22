package com.hpsqsoft.ctrlropa.customerpackage;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customer-packages")
public class CustomerPackageController {

    private final CustomerPackageService service;

    public CustomerPackageController(CustomerPackageService service) {
        this.service = service;
    }

    @PostMapping
    public CustomerPackageResponse create(@Valid @RequestBody CreateCustomerPackageRequest request) {
        return service.create(request);
    }

    @PostMapping("/from-order/{orderId}")
    public CustomerPackageDetailResponse prepareFromOrder(@PathVariable Long orderId,
                                                          @Valid @RequestBody PrepareCustomerPackageFromOrderRequest request) {
        return service.prepareFromOrder(orderId, request);
    }

    @PostMapping("/from-reservation/{reservationId}")
    public CustomerPackageDetailResponse prepareFromReservation(@PathVariable Long reservationId,
                                                                @Valid @RequestBody PrepareCustomerPackageFromReservationRequest request) {
        return service.prepareFromReservation(reservationId, request);
    }

    @GetMapping("/customer/{customerId}")
    public List<CustomerPackageResponse> findByCustomer(@PathVariable Long customerId) {
        return service.findByCustomer(customerId);
    }

    @GetMapping("/branch/{branchId}/details")
    public List<CustomerPackageDetailResponse> findDetailsByBranch(@PathVariable Long branchId) {
        return service.findDetailsByBranch(branchId);
    }

    @GetMapping("/branch/{branchId}/ready-for-shipment")
    public List<CustomerPackageDetailResponse> findReadyForShipmentByBranch(@PathVariable Long branchId) {
        return service.findReadyForShipmentByBranch(branchId);
    }

    @GetMapping("/customer/{customerId}/details")
    public List<CustomerPackageDetailResponse> findDetailsByCustomer(@PathVariable Long customerId) {
        return service.findDetailsByCustomer(customerId);
    }

    @GetMapping("/{id}")
    public CustomerPackageDetailResponse findDetail(@PathVariable Long id) {
        return service.findDetail(id);
    }

    @GetMapping("/folio/{folio}")
    public CustomerPackageDetailResponse findDetailByFolio(@PathVariable String folio) {
        return service.findDetailByFolio(folio);
    }

    @PostMapping("/{id}/items")
    public CustomerPackageDetailResponse addItem(@PathVariable Long id,
                                                 @Valid @RequestBody AddCustomerPackageItemRequest request) {
        return service.addItem(id, request);
    }

    @DeleteMapping("/{id}/items/{packageItemId}")
    public CustomerPackageDetailResponse removeItem(@PathVariable Long id,
                                                    @PathVariable Long packageItemId,
                                                    @RequestParam(defaultValue = "false") boolean confirmCredit) {
        return service.removeItem(id, packageItemId, confirmCredit);
    }

    @PostMapping("/folio/{folio}/items/item-code/{code}")
    public CustomerPackageDetailResponse addItemByItemCode(@PathVariable String folio,
                                                           @PathVariable String code) {
        return service.addItemByItemCode(folio, code);
    }

    @PostMapping("/folio/{folio}/items/qr/{qrCode}")
    public CustomerPackageDetailResponse addItemByQrCode(@PathVariable String folio,
                                                         @PathVariable String qrCode) {
        return service.addItemByQrCode(folio, qrCode);
    }

    @PatchMapping("/{id}/ready")
    public CustomerPackageDetailResponse markReady(@PathVariable Long id,
                                                   @Valid @RequestBody CloseCustomerPackageRequest request) {
        return service.markReady(id, request);
    }

    @PatchMapping("/{id}/shipping-cost")
    public CustomerPackageDetailResponse updateShippingCost(@PathVariable Long id,
                                                            @RequestBody UpdateCustomerPackageShippingRequest request) {
        return service.updateShippingCost(id, request);
    }

    @PatchMapping("/folio/{folio}/ready")
    public CustomerPackageDetailResponse markReadyByFolio(@PathVariable String folio,
                                                          @Valid @RequestBody CloseCustomerPackageRequest request) {
        return service.markReadyByFolio(folio, request);
    }

    @PatchMapping("/{id}/cancel")
    public CustomerPackageDetailResponse cancel(@PathVariable Long id,
                                                @Valid @RequestBody CancelCustomerPackageRequest request) {
        return service.cancel(id, request);
    }

    @PatchMapping("/folio/{folio}/cancel")
    public CustomerPackageDetailResponse cancelByFolio(@PathVariable String folio,
                                                       @Valid @RequestBody CancelCustomerPackageRequest request) {
        return service.cancelByFolio(folio, request);
    }
}
