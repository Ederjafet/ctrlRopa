package com.hpsqsoft.ctrlropa.shipment;

import com.hpsqsoft.ctrlropa.branch.Branch;
import com.hpsqsoft.ctrlropa.branch.BranchRepository;
import com.hpsqsoft.ctrlropa.customer.Customer;
import com.hpsqsoft.ctrlropa.customer.CustomerAddressRepository;
import com.hpsqsoft.ctrlropa.customerpackage.CustomerPackage;
import com.hpsqsoft.ctrlropa.customerpackage.CustomerPackageItem;
import com.hpsqsoft.ctrlropa.customerpackage.CustomerPackageItemRepository;
import com.hpsqsoft.ctrlropa.customerpackage.CustomerPackageRepository;
import com.hpsqsoft.ctrlropa.customerpackage.CustomerPackageStatus;
import com.hpsqsoft.ctrlropa.incident.IncidentService;
import com.hpsqsoft.ctrlropa.item.Item;
import com.hpsqsoft.ctrlropa.payment.PaymentService;
import com.hpsqsoft.ctrlropa.sale.SaleRepository;
import com.hpsqsoft.ctrlropa.security.access.AccessService;
import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import com.hpsqsoft.ctrlropa.security.access.PermissionCode;
import com.hpsqsoft.ctrlropa.tenant.TenantAccessGuard;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.any;
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
    void createBlocksShipmentWithoutPackage() {
        CreateShipmentRequest request = new CreateShipmentRequest();
        request.setBranchId(10L);
        request.setDeliveryType(ShipmentDeliveryType.LOCAL);
        request.setCreatedByUserId(77L);

        when(currentUser.getUserId()).thenReturn(77L);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.create(request));

        assertEquals("No se puede crear un envio sin paquete asociado.", ex.getMessage());
        verify(repository, never()).save(any(Shipment.class));
    }

    @Test
    void createWithReadyPackageCreatesShipmentAndAssociation() {
        Branch branch = branch();
        CustomerPackage customerPackage = readyCustomerPackage("478521678");
        customerPackage.setShippingAddressConfirmed(true);
        CreateShipmentRequest request = new CreateShipmentRequest();
        request.setBranchId(10L);
        request.setCustomerPackageId(4L);
        request.setDeliveryType(ShipmentDeliveryType.LOCAL);
        request.setCreatedByUserId(77L);

        AtomicReference<ShipmentPackage> savedLine = new AtomicReference<>();

        when(currentUser.getUserId()).thenReturn(77L);
        when(branchRepository.findById(10L)).thenReturn(Optional.of(branch));
        when(repository.existsByFolio(any())).thenReturn(false);
        when(repository.save(any(Shipment.class))).thenAnswer(invocation -> {
            Shipment shipment = invocation.getArgument(0);
            setId(shipment, 2L);
            return shipment;
        });
        when(customerPackageRepository.findById(4L)).thenReturn(Optional.of(customerPackage));
        when(shipmentPackageRepository.findByCustomerPackageIdOrderByIdDesc(4L)).thenReturn(List.of());
        when(shipmentPackageRepository.save(any(ShipmentPackage.class))).thenAnswer(invocation -> {
            ShipmentPackage shipmentPackage = invocation.getArgument(0);
            setId(shipmentPackage, 20L);
            savedLine.set(shipmentPackage);
            return shipmentPackage;
        });
        when(shipmentPackageRepository.findByShipmentIdOrderByIdAsc(2L)).thenAnswer(invocation -> List.of(savedLine.get()));
        when(customerPackageItemRepository.findByCustomerPackageIdOrderByCreatedAtAsc(4L)).thenReturn(List.of());

        ShipmentResponse response = service.create(request);

        assertEquals(2L, response.getId());
        assertEquals(1L, response.getPackageCount());
        assertEquals(4L, response.getPrimaryPackageId());
        assertEquals("PKG-4", response.getPrimaryPackageFolio());
        assertEquals("Cliente QA", response.getCustomerName());
        assertEquals("5555555555", response.getCustomerPhone());
        assertEquals("Marcar enviado", response.getNextStep());
        assertEquals(ShipmentPackagePaymentMode.PREPAID, savedLine.get().getPaymentMode());
    }

    @Test
    void findByBranchMarksShipmentWithoutPackageAsAttention() {
        Shipment shipment = carrierShipment("478521678");

        when(currentUser.getUserId()).thenReturn(77L);
        when(repository.findByBranchIdOrderByCreatedAtDesc(10L)).thenReturn(List.of(shipment));
        when(shipmentPackageRepository.findByShipmentIdOrderByIdAsc(2L)).thenReturn(List.of());

        List<ShipmentResponse> response = service.findByBranch(10L);

        assertEquals(1, response.size());
        assertEquals(0L, response.get(0).getPackageCount());
        assertEquals("Sin paquete asociado", response.get(0).getAttentionReason());
        assertEquals("Este envio no tiene paquete asociado. No puede operarse hasta corregirse o cancelarse.", response.get(0).getBlockedReason());
    }

    @Test
    void findByBranchEnrichesShipmentWithPrimaryPackageData() {
        Shipment shipment = carrierShipment("478521678");
        ShipmentPackage shipmentPackage = shipmentPackage();
        CustomerPackage customerPackage = readyCustomerPackage("478521678");
        customerPackage.setShippingAddressConfirmed(true);
        customerPackage.setShipToName("Maria Lopez");
        customerPackage.setShipToPhone("5550001111");
        customerPackage.setShipToLine1("Calle 1");
        customerPackage.setShipToCity("CDMX");
        customerPackage.setShipToState("CDMX");
        customerPackage.setShipToPostalCode("01000");
        customerPackage.setShippingCostConfirmed(true);
        customerPackage.setShippingCostAmount(new BigDecimal("190.00"));
        CustomerPackageItem packageItem = packageItem("1600.00");

        when(currentUser.getUserId()).thenReturn(77L);
        when(repository.findByBranchIdOrderByCreatedAtDesc(10L)).thenReturn(List.of(shipment));
        when(shipmentPackageRepository.findByShipmentIdOrderByIdAsc(2L)).thenReturn(List.of(shipmentPackage));
        when(customerPackageRepository.findById(4L)).thenReturn(Optional.of(customerPackage));
        when(customerPackageItemRepository.findByCustomerPackageIdOrderByCreatedAtAsc(4L)).thenReturn(List.of(packageItem));

        ShipmentResponse response = service.findByBranch(10L).get(0);

        assertEquals("Cliente QA", response.getCustomerName());
        assertEquals("5555555555", response.getCustomerPhone());
        assertEquals("PKG-4", response.getPrimaryPackageFolio());
        assertEquals(1, response.getPackageItemCount());
        assertEquals(new BigDecimal("1790.00"), response.getPackageTotalAmount());
        assertEquals("Calle 1, CDMX, CDMX, 01000", response.getDestinationSummary());
        assertEquals("478521678", response.getPackageTrackingNumber());
    }

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
    void dispatchBlocksShipmentWithoutPackages() {
        Shipment shipment = carrierShipment("478521678");
        DispatchShipmentRequest request = new DispatchShipmentRequest();
        request.setDispatchedByUserId(77L);

        when(currentUser.getUserId()).thenReturn(77L);
        when(repository.findById(2L)).thenReturn(Optional.of(shipment));
        when(shipmentPackageRepository.findByShipmentIdOrderByIdAsc(2L)).thenReturn(List.of());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.dispatch(2L, request));

        assertEquals("No se puede despachar un shipment vacío", ex.getMessage());
        verify(customerPackageRepository, never()).save(any(CustomerPackage.class));
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

    @Test
    void confirmReceivedBlocksShipmentWithoutPackages() {
        Shipment shipment = carrierShipment("478521678");
        shipment.setStatus(ShipmentStatus.OUT_FOR_DELIVERY);
        ConfirmShipmentReceivedRequest request = new ConfirmShipmentReceivedRequest();
        request.setDeliveryConfirmedByUserId(77L);

        when(currentUser.getUserId()).thenReturn(77L);
        when(repository.findById(2L)).thenReturn(Optional.of(shipment));
        when(shipmentPackageRepository.findByShipmentIdOrderByIdAsc(2L)).thenReturn(List.of());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.confirmReceived(2L, request));

        assertEquals("El envio no tiene paquetes relacionados.", ex.getMessage());
        verifyNoInteractions(paymentService);
    }

    private Branch branch() {
        Branch branch = new Branch();
        branch.setId(10L);
        branch.setCode("QA");
        return branch;
    }

    private Shipment carrierShipment(String guideReference) {
        Shipment shipment = new Shipment();
        setId(shipment, 2L);
        shipment.setBranch(branch());
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
        Customer customer = new Customer();
        setId(customer, 8L);
        customer.setName("Cliente QA");
        customer.setPhone("5555555555");
        Branch branch = branch();
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

    private CustomerPackageItem packageItem(String price) {
        Item item = new Item();
        item.setPrice(new BigDecimal(price));

        CustomerPackageItem packageItem = new CustomerPackageItem();
        packageItem.setCustomerPackageId(4L);
        packageItem.setItem(item);
        return packageItem;
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
