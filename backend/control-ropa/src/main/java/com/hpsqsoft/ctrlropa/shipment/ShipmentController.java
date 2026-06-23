package com.hpsqsoft.ctrlropa.shipment;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shipments")
public class ShipmentController {

    private final ShipmentService service;

    public ShipmentController(ShipmentService service) {
        this.service = service;
    }

    @PostMapping
    public ShipmentResponse create(@Valid @RequestBody CreateShipmentRequest request) {
        return service.create(request);
    }

    @GetMapping("/{id}")
    public ShipmentDetailResponse findDetail(@PathVariable Long id) {
        return service.findDetail(id);
    }

    @GetMapping("/folio/{folio}")
    public ShipmentDetailResponse findDetailByFolio(@PathVariable String folio) {
        return service.findDetailByFolio(folio);
    }

    @GetMapping("/branch/{branchId}")
    public List<ShipmentResponse> findByBranch(@PathVariable Long branchId) {
        return service.findByBranch(branchId);
    }

    @PostMapping("/{id}/packages")
    public ShipmentDetailResponse addPackage(@PathVariable Long id,
                                             @Valid @RequestBody AddShipmentPackageRequest request) {
        return service.addPackage(id, request);
    }

    @PostMapping("/folio/{shipmentFolio}/packages/package-folio/{packageFolio}")
    public ShipmentDetailResponse addPackageByFolio(@PathVariable String shipmentFolio,
                                                    @PathVariable String packageFolio,
                                                    @Valid @RequestBody AddShipmentPackageByFolioRequest request) {
        return service.addPackageByFolio(shipmentFolio, packageFolio, request);
    }

    @PatchMapping("/{id}/dispatch")
    public ShipmentDetailResponse dispatch(@PathVariable Long id,
                                           @Valid @RequestBody DispatchShipmentRequest request) {
        return service.dispatch(id, request);
    }

    @PatchMapping("/folio/{folio}/dispatch")
    public ShipmentDetailResponse dispatchByFolio(@PathVariable String folio,
                                                  @Valid @RequestBody DispatchShipmentRequest request) {
        return service.dispatchByFolio(folio, request);
    }

    @PatchMapping("/{shipmentId}/packages/{shipmentPackageId}/resolve")
    public ShipmentDetailResponse resolvePackage(@PathVariable Long shipmentId,
                                                 @PathVariable Long shipmentPackageId,
                                                 @Valid @RequestBody ResolveShipmentPackageRequest request) {
        return service.resolvePackage(shipmentId, shipmentPackageId, request);
    }

    @PatchMapping("/{id}/confirm-received")
    public ShipmentDetailResponse confirmReceived(@PathVariable Long id,
                                                  @Valid @RequestBody ConfirmShipmentReceivedRequest request) {
        return service.confirmReceived(id, request);
    }

    @PatchMapping("/folio/{shipmentFolio}/packages/{shipmentPackageId}/resolve")
    public ShipmentDetailResponse resolvePackageByFolio(@PathVariable String shipmentFolio,
                                                        @PathVariable Long shipmentPackageId,
                                                        @Valid @RequestBody ResolveShipmentPackageRequest request) {
        return service.resolvePackageByFolio(shipmentFolio, shipmentPackageId, request);
    }

    @PatchMapping("/{id}/cancel")
    public ShipmentDetailResponse cancel(@PathVariable Long id,
                                         @Valid @RequestBody CancelShipmentRequest request) {
        return service.cancel(id, request);
    }

    @PatchMapping("/folio/{folio}/cancel")
    public ShipmentDetailResponse cancelByFolio(@PathVariable String folio,
                                                @Valid @RequestBody CancelShipmentRequest request) {
        return service.cancelByFolio(folio, request);
    }

    @PatchMapping("/{id}/reopen")
    public ShipmentDetailResponse reopen(@PathVariable Long id,
                                         @Valid @RequestBody ReopenShipmentRequest request) {
        return service.reopen(id, request);
    }

    @PatchMapping("/folio/{folio}/reopen")
    public ShipmentDetailResponse reopenByFolio(@PathVariable String folio,
                                                @Valid @RequestBody ReopenShipmentRequest request) {
        return service.reopenByFolio(folio, request);
    }
}
