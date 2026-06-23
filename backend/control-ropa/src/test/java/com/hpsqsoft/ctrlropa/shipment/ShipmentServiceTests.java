package com.hpsqsoft.ctrlropa.shipment;

import com.hpsqsoft.ctrlropa.branch.Branch;
import com.hpsqsoft.ctrlropa.branch.BranchRepository;
import com.hpsqsoft.ctrlropa.customer.Customer;
import com.hpsqsoft.ctrlropa.customer.CustomerAddressRepository;
import com.hpsqsoft.ctrlropa.customerpackage.CustomerPackage;
import com.hpsqsoft.ctrlropa.customerpackage.CustomerPackageItemRepository;
import com.hpsqsoft.ctrlropa.customerpackage.CustomerPackageRepository;
import com.hpsqsoft.ctrlropa.customerpackage.CustomerPackageStatus;
import com.hpsqsoft.ctrlropa.incident.IncidentService;
import com.hpsqsoft.ctrlropa.payment.PaymentService;
import com.hpsqsoft.ctrlropa.sale.SaleRepository;
import com.hpsqsoft.ctrlropa.security.access.AccessService;
import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import com.hpsqsoft.ctrlropa.security.access.PermissionCode;
import com.hpsqsoft.ctrlropa.tenant.TenantAccessGuard;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class ShipmentServiceTests {

    private final ShipmentRepository repository = mock(ShipmentRepository.class);
    private final ShipmentPackageRepository shipmentPackageRepository = mock(ShipmentPackageRepository.class);
    private final CustomerPackageRepository customerPackageRepository = mock(CustomerPackageRepository.class);
    private final CustomerPackageItemRepository customerPackageItemRepository = mock(CustomerPackageItemRepository.class);
    private final CustomerAddressRepository customerAddressRepository = mock(CustomerAddressRepository.class);
    private final BranchRepository branchRepository = mock(BranchRepository.class);
    private final PaymentService paymentService = mock(PaymentService.class);
    private final IncidentService incidentService = mock(IncidentService.class);
    private final SaleRepository saleRepository = mock(SaleRepository.class);
    private final TenantAccessGuard tenantAccessGuard = mock(TenantAccessGuard.class);
    private final AccessService accessService = mock(AccessService.class);
    private final CurrentUser currentUser = mock(CurrentUser.class);

    private final ShipmentService service = new ShipmentService(
            repository,
            shipmentPackageRepository,
            customerPackageRepository,
            customerPackageItemRepository,
            customerAddressRepository,
            branchRepository,
            paymentService,
            incidentService,
            saleRepository,
            tenantAccessGuard,
            accessService,
            currentUser
    );

    @Test
    void dispatchUsesPackageTrackingNumberWhenShipmentGuideIsMissing() {
        Shipment shipment = carrierShipment(null);
        ShipmentPackage shipmentPackage = shipmentPackage();
        CustomerPackage customerPackage = readyCustomerPackage("478521678");
        DispatchShipmentRequest request = new DispatchShipmentRequest();
        request.setDispatchedByUserId(77L);

        when(currentUser.getUserId()).thenReturn(77L);
        when(repository.findById(2L)).thenReturn(Optional.of(shipment));
        when(shipmentPackageRepository.findByShipmentIdOrderByIdAsc(2L)).thenReturn(List.of(shipmentPackage));
        when(customerPackageRepository.findById(4L)).thenReturn(Optional.of(customerPackage));
        when(repository.save(shipment)).thenReturn(shipment);
        when(customerPackageRepository.save(customerPackage)).thenReturn(customerPackage);

        ShipmentDetailResponse response = service.dispatch(2L, request);

        verify(accessService, atLeastOnce()).assertCan(77L, PermissionCode.MANAGE_SHIPMENTS);
        assertEquals("478521678", response.getGuideReference());
        assertEquals(ShipmentStatus.OUT_FOR_DELIVERY.name(), response.getStatus());
        assertEquals(CustomerPackageStatus.SHIPPED, customerPackage.getStatus());
        assertNotNull(response.getDispatchedAt());
    }

    @Test
    void dispatchBlocksCarrierShipmentWithoutShipmentOrPackageGuide() {
        Shipment shipment = carrierShipment(null);
        ShipmentPackage shipmentPackage = shipmentPackage();
        CustomerPackage customerPackage = readyCustomerPackage(null);
        DispatchShipmentRequest request = new DispatchShipmentRequest();
        request.setDispatchedByUserId(77L);

        when(currentUser.getUserId()).thenReturn(77L);
        when(repository.findById(2L)).thenReturn(Optional.of(shipment));
        when(shipmentPackageRepository.findByShipmentIdOrderByIdAsc(2L)).thenReturn(List.of(shipmentPackage));
        when(customerPackageRepository.findById(4L)).thenReturn(Optional.of(customerPackage));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.dispatch(2L, request));

        assertEquals("Captura la guia o referencia antes de marcar como enviado.", ex.getMessage());
        verify(repository, never()).save(shipment);
    }

    @Test
    void dispatchRequiresManageShipmentsPermission() {
        DispatchShipmentRequest request = new DispatchShipmentRequest();
        request.setDispatchedByUserId(77L);

        when(currentUser.getUserId()).thenReturn(77L);
        doThrow(new AccessDeniedException("missing"))
                .when(accessService)
                .assertCan(77L, PermissionCode.MANAGE_SHIPMENTS);

        assertThrows(AccessDeniedException.class, () -> service.dispatch(2L, request));

        verify(repository, never()).findById(2L);
    }

    @Test
    void confirmReceivedUpdatesShipmentAndPackageWithoutTouchingPayments() {
        Shipment shipment = carrierShipment("478521678");
        shipment.setStatus(ShipmentStatus.OUT_FOR_DELIVERY);
        ShipmentPackage shipmentPackage = shipmentPackage();
        CustomerPackage customerPackage = readyCustomerPackage("478521678");
        customerPackage.setStatus(CustomerPackageStatus.SHIPPED);
        ConfirmShipmentReceivedRequest request = new ConfirmShipmentReceivedRequest();
        request.setDeliveryConfirmedByUserId(77L);
        request.setNotes("Cliente confirmo recibido por WhatsApp");

        when(currentUser.getUserId()).thenReturn(77L);
        when(repository.findById(2L)).thenReturn(Optional.of(shipment));
        when(shipmentPackageRepository.findByShipmentIdOrderByIdAsc(2L)).thenReturn(List.of(shipmentPackage));
        when(customerPackageRepository.findById(4L)).thenReturn(Optional.of(customerPackage));
        when(repository.save(shipment)).thenReturn(shipment);
        when(customerPackageRepository.save(customerPackage)).thenReturn(customerPackage);
        when(shipmentPackageRepository.save(shipmentPackage)).thenReturn(shipmentPackage);

        ShipmentDetailResponse response = service.confirmReceived(2L, request);

        verify(accessService, atLeastOnce()).assertCan(77L, PermissionCode.MANAGE_SHIPMENTS);
        assertEquals(ShipmentStatus.DELIVERED.name(), response.getStatus());
        assertEquals(ShipmentPackageStatus.DELIVERED, shipmentPackage.getStatus());
        assertEquals(CustomerPackageStatus.DELIVERED, customerPackage.getStatus());
        assertEquals("Cliente confirmo recibido por WhatsApp", shipmentPackage.getCollectionNotes());
        assertNotNull(shipmentPackage.getDeliveredAt());
        verifyNoInteractions(paymentService);
    }

    @Test
    void confirmReceivedBlocksShipmentThatWasNotDispatched() {
        Shipment shipment = carrierShipment("478521678");
        ConfirmShipmentReceivedRequest request = new ConfirmShipmentReceivedRequest();
        request.setDeliveryConfirmedByUserId(77L);

        when(currentUser.getUserId()).thenReturn(77L);
        when(repository.findById(2L)).thenReturn(Optional.of(shipment));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.confirmReceived(2L, request));

        assertEquals("El envio debe estar marcado como enviado antes de confirmar recibido.", ex.getMessage());
        verify(shipmentPackageRepository, never()).findByShipmentIdOrderByIdAsc(2L);
    }

    @Test
    void confirmReceivedBlocksCodPackagesToAvoidImplicitPayments() {
        Shipment shipment = carrierShipment("478521678");
        shipment.setStatus(ShipmentStatus.OUT_FOR_DELIVERY);
        ShipmentPackage shipmentPackage = shipmentPackage();
        shipmentPackage.setPaymentMode(ShipmentPackagePaymentMode.COD);
        ConfirmShipmentReceivedRequest request = new ConfirmShipmentReceivedRequest();
        request.setDeliveryConfirmedByUserId(77L);

        when(currentUser.getUserId()).thenReturn(77L);
        when(repository.findById(2L)).thenReturn(Optional.of(shipment));
        when(shipmentPackageRepository.findByShipmentIdOrderByIdAsc(2L)).thenReturn(List.of(shipmentPackage));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.confirmReceived(2L, request));

        assertEquals("Este envio tiene cobro contra entrega. Resuelve la entrega capturando el monto cobrado.", ex.getMessage());
        verifyNoInteractions(paymentService);
    }

    private Shipment carrierShipment(String guideReference) {
        Branch branch = new Branch();
        branch.setId(10L);
        branch.setCode("QA");

        Shipment shipment = new Shipment();
        setId(shipment, 2L);
        shipment.setBranch(branch);
        shipment.setFolio("SHP-2");
        shipment.setDeliveryType(ShipmentDeliveryType.CARRIER);
        shipment.setGuideReference(guideReference);
        shipment.setStatus(ShipmentStatus.OPEN);
        shipment.setCreatedByUserId(77L);
        return shipment;
    }

    private ShipmentPackage shipmentPackage() {
        ShipmentPackage shipmentPackage = new ShipmentPackage();
        setId(shipmentPackage, 20L);
        shipmentPackage.setShipmentId(2L);
        shipmentPackage.setCustomerPackageId(4L);
        shipmentPackage.setCustomerId(8L);
        shipmentPackage.setPaymentMode(ShipmentPackagePaymentMode.PREPAID);
        shipmentPackage.setStatus(ShipmentPackageStatus.PENDING);
        return shipmentPackage;
    }

    private CustomerPackage readyCustomerPackage(String trackingNumber) {
        Branch branch = new Branch();
        branch.setId(10L);
        branch.setCode("QA");

        Customer customer = new Customer();
        setId(customer, 8L);
        customer.setName("Cliente QA");
        customer.setBranch(branch);

        CustomerPackage customerPackage = new CustomerPackage();
        setId(customerPackage, 4L);
        customerPackage.setFolio("PKG-4");
        customerPackage.setCustomer(customer);
        customerPackage.setBranch(branch);
        customerPackage.setStatus(CustomerPackageStatus.READY);
        customerPackage.setTrackingNumber(trackingNumber);
        customerPackage.setCreatedByUserId(77L);
        return customerPackage;
    }

    private void setId(Object target, Long id) {
        try {
            java.lang.reflect.Field idField = target.getClass().getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(target, id);
        } catch (ReflectiveOperationException ex) {
            throw new IllegalStateException(ex);
        }
    }
}
