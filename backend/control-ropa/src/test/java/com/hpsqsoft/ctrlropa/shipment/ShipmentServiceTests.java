package com.hpsqsoft.ctrlropa.shipment;

import com.hpsqsoft.ctrlropa.branch.Branch;
import com.hpsqsoft.ctrlropa.branch.BranchRepository;
import com.hpsqsoft.ctrlropa.customer.Customer;
import com.hpsqsoft.ctrlropa.customer.CustomerAddressRepository;
import com.hpsqsoft.ctrlropa.customerpackage.CustomerPackage;
import com.hpsqsoft.ctrlropa.customerpackage.CustomerPackageItem;
import com.hpsqsoft.ctrlropa.customerpackage.CustomerPackageItemRepository;
import com.hpsqsoft.ctrlropa.customerpackage.CustomerPackageRepository;
import com.hpsqsoft.ctrlropa.customerpackage.CustomerPackageDeliveryType;
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
    private final ShipmentCostShareRepository shipmentCostShareRepository = mock(ShipmentCostShareRepository.class);
    private final ShipmentPaymentRepository shipmentPaymentRepository = mock(ShipmentPaymentRepository.class);
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
            shipmentCostShareRepository,
            shipmentPaymentRepository,
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
        request.setRecipientName("Ana Logistica");
        request.setRecipientPhone("5551112222");
        request.setDestinationSummary("Calle del envio 12, Centro");
        request.setDestinationCity("Tuxtla");
        request.setDestinationState("Chiapas");
        request.setDestinationPostalCode("29000");
        request.setShippingCarrier("Reparto local");
        request.setRealShippingCost(new BigDecimal("80.00"));
        request.setShippingNotes("Tocar timbre azul");
        request.setCreatedByUserId(77L);

        AtomicReference<Shipment> savedShipment = new AtomicReference<>();
        AtomicReference<ShipmentPackage> savedLine = new AtomicReference<>();

        when(currentUser.getUserId()).thenReturn(77L);
        when(branchRepository.findById(10L)).thenReturn(Optional.of(branch));
        when(repository.existsByFolio(any())).thenReturn(false);
        when(repository.save(any(Shipment.class))).thenAnswer(invocation -> {
            Shipment shipment = invocation.getArgument(0);
            setId(shipment, 2L);
            savedShipment.set(shipment);
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
        assertEquals("Calle del envio 12, Centro", response.getDestinationSummary());
        assertEquals("Reparto local", response.getShippingCarrier());
        assertEquals(new BigDecimal("80.00"), response.getShippingCostAmount());
        assertEquals("SHIPMENT", response.getLogisticsSource());
        assertEquals("Tocar timbre azul", savedShipment.get().getShippingNotes());
        assertNotNull(savedShipment.get().getQuotedAt());
        assertNotNull(savedShipment.get().getReadyAt());
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
        assertEquals(new BigDecimal("190.00"), response.getShippingCostAmount());
        assertEquals("LEGACY_PACKAGE", response.getLogisticsSource());
        assertEquals("478521678", response.getPackageTrackingNumber());
    }

    @Test
    void findByBranchUsesShipmentLogisticsBeforeLegacyPackageData() {
        Shipment shipment = carrierShipment("478521678");
        shipment.setRecipientName("Operacion envios");
        shipment.setDestinationSummary("Destino definido en envio");
        shipment.setShippingCarrier("DHL");
        shipment.setRealShippingCost(new BigDecimal("210.00"));
        shipment.setShippingNotes("Dato del envio");
        ShipmentPackage shipmentPackage = shipmentPackage();
        CustomerPackage customerPackage = readyCustomerPackage("478521678");
        customerPackage.setShippingAddressConfirmed(true);
        customerPackage.setShipToLine1("Destino legacy distinto");
        customerPackage.setShippingCostConfirmed(true);
        customerPackage.setShippingCostAmount(new BigDecimal("190.00"));
        CustomerPackageItem packageItem = packageItem("1600.00");

        when(currentUser.getUserId()).thenReturn(77L);
        when(repository.findByBranchIdOrderByCreatedAtDesc(10L)).thenReturn(List.of(shipment));
        when(shipmentPackageRepository.findByShipmentIdOrderByIdAsc(2L)).thenReturn(List.of(shipmentPackage));
        when(customerPackageRepository.findById(4L)).thenReturn(Optional.of(customerPackage));
        when(customerPackageItemRepository.findByCustomerPackageIdOrderByCreatedAtAsc(4L)).thenReturn(List.of(packageItem));

        ShipmentResponse response = service.findByBranch(10L).get(0);

        assertEquals("Destino definido en envio", response.getDestinationSummary());
        assertEquals("DHL", response.getShippingCarrier());
        assertEquals(new BigDecimal("210.00"), response.getShippingCostAmount());
        assertEquals("SHIPMENT", response.getLogisticsSource());
        assertEquals("Dato del envio", response.getShippingNotes());
    }

    @Test
    void dispatchBlocksMixedLegacyDestinationsWithoutShipmentDestination() {
        Shipment shipment = carrierShipment("478521678");
        ShipmentPackage firstPackageLine = shipmentPackage();
        ShipmentPackage secondPackageLine = shipmentPackage();
        setId(secondPackageLine, 21L);
        secondPackageLine.setCustomerPackageId(5L);
        CustomerPackage firstPackage = readyCustomerPackage("478521678");
        firstPackage.setShippingAddressConfirmed(true);
        firstPackage.setDeliveryType(CustomerPackageDeliveryType.PARCEL_SERVICE);
        firstPackage.setShipToLine1("Calle 1");
        firstPackage.setShipToCity("CDMX");
        CustomerPackage secondPackage = readyCustomerPackage("478521678");
        setId(secondPackage, 5L);
        secondPackage.setFolio("PKG-5");
        secondPackage.setShippingAddressConfirmed(true);
        secondPackage.setDeliveryType(CustomerPackageDeliveryType.PARCEL_SERVICE);
        secondPackage.setShipToLine1("Calle 2");
        secondPackage.setShipToCity("CDMX");
        DispatchShipmentRequest request = new DispatchShipmentRequest();
        request.setDispatchedByUserId(77L);

        when(currentUser.getUserId()).thenReturn(77L);
        when(repository.findById(2L)).thenReturn(Optional.of(shipment));
        when(shipmentPackageRepository.findByShipmentIdOrderByIdAsc(2L)).thenReturn(List.of(firstPackageLine, secondPackageLine));
        when(customerPackageRepository.findById(4L)).thenReturn(Optional.of(firstPackage));
        when(customerPackageRepository.findById(5L)).thenReturn(Optional.of(secondPackage));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.dispatch(2L, request));

        assertEquals("Este envio tiene datos legacy diferentes entre paquetes. Define una direccion del envio antes de marcarlo enviado.", ex.getMessage());
        verify(repository, never()).save(shipment);
    }

    @Test
    void updateLogisticsUpdatesShipmentAsPrimaryLogisticsSource() {
        Shipment shipment = carrierShipment(null);
        ShipmentPackage shipmentPackage = shipmentPackage();
        CustomerPackage customerPackage = readyCustomerPackage(null);
        UpdateShipmentLogisticsRequest request = new UpdateShipmentLogisticsRequest();
        request.setDeliveryType(ShipmentDeliveryType.CARRIER);
        request.setRecipientName("Ana Lopez");
        request.setRecipientPhone("5551112222");
        request.setDestinationSummary("Destino definido despues de cotizar");
        request.setDestinationCity("Tuxtla");
        request.setDestinationState("Chiapas");
        request.setDestinationPostalCode("29000");
        request.setShippingCarrier("Estafeta");
        request.setTrackingNumber("GUIA-123");
        request.setRealShippingCost(new BigDecimal("180.00"));
        request.setShippingNotes("Costo confirmado por paqueteria");

        when(currentUser.getUserId()).thenReturn(77L);
        when(repository.findById(2L)).thenReturn(Optional.of(shipment));
        when(repository.save(shipment)).thenReturn(shipment);
        when(shipmentPackageRepository.findByShipmentIdOrderByIdAsc(2L)).thenReturn(List.of(shipmentPackage));
        when(customerPackageRepository.findById(4L)).thenReturn(Optional.of(customerPackage));

        ShipmentDetailResponse response = service.updateLogistics(2L, request);

        verify(accessService, atLeastOnce()).assertCan(77L, PermissionCode.MANAGE_SHIPMENTS);
        assertEquals("Ana Lopez", response.getRecipientName());
        assertEquals("Destino definido despues de cotizar", response.getDestinationSummary());
        assertEquals("Estafeta", response.getShippingCarrier());
        assertEquals("GUIA-123", response.getGuideReference());
        assertEquals(new BigDecimal("180.00"), response.getShippingCostAmount());
        assertEquals("SHIPMENT", response.getLogisticsSource());
        assertNotNull(shipment.getQuotedAt());
        assertNotNull(shipment.getReadyAt());
    }

    @Test
    void updateLogisticsBlocksNegativeRealShippingCost() {
        Shipment shipment = carrierShipment(null);
        UpdateShipmentLogisticsRequest request = new UpdateShipmentLogisticsRequest();
        request.setRealShippingCost(new BigDecimal("-1.00"));

        when(currentUser.getUserId()).thenReturn(77L);
        when(repository.findById(2L)).thenReturn(Optional.of(shipment));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.updateLogistics(2L, request));

        assertEquals("El costo real del envio no puede ser negativo.", ex.getMessage());
        verify(repository, never()).save(shipment);
    }

    @Test
    void updateLogisticsResolvesMixedLegacyWithExplicitDestination() {
        Shipment shipment = carrierShipment("GUIA-123");
        ShipmentPackage firstPackageLine = shipmentPackage();
        ShipmentPackage secondPackageLine = shipmentPackage();
        setId(secondPackageLine, 21L);
        secondPackageLine.setCustomerPackageId(5L);
        CustomerPackage firstPackage = readyCustomerPackage("GUIA-123");
        firstPackage.setShippingAddressConfirmed(true);
        firstPackage.setDeliveryType(CustomerPackageDeliveryType.PARCEL_SERVICE);
        firstPackage.setShipToLine1("Calle 1");
        firstPackage.setShipToCity("CDMX");
        CustomerPackage secondPackage = readyCustomerPackage("GUIA-123");
        setId(secondPackage, 5L);
        secondPackage.setFolio("PKG-5");
        secondPackage.setShippingAddressConfirmed(true);
        secondPackage.setDeliveryType(CustomerPackageDeliveryType.PARCEL_SERVICE);
        secondPackage.setShipToLine1("Calle 2");
        secondPackage.setShipToCity("CDMX");
        UpdateShipmentLogisticsRequest request = new UpdateShipmentLogisticsRequest();
        request.setDeliveryType(ShipmentDeliveryType.CARRIER);
        request.setDestinationSummary("Destino comun del envio compartido");
        request.setTrackingNumber("GUIA-123");
        request.setShippingCarrier("DHL");

        when(currentUser.getUserId()).thenReturn(77L);
        when(repository.findById(2L)).thenReturn(Optional.of(shipment));
        when(repository.save(shipment)).thenReturn(shipment);
        when(shipmentPackageRepository.findByShipmentIdOrderByIdAsc(2L)).thenReturn(List.of(firstPackageLine, secondPackageLine));
        when(customerPackageRepository.findById(4L)).thenReturn(Optional.of(firstPackage));
        when(customerPackageRepository.findById(5L)).thenReturn(Optional.of(secondPackage));

        ShipmentDetailResponse response = service.updateLogistics(2L, request);

        assertEquals("Destino comun del envio compartido", response.getDestinationSummary());
        assertEquals("SHIPMENT", response.getLogisticsSource());
        assertEquals(null, response.getLogisticsWarning());
    }

    @Test
    void dispatchAllowsMixedLegacyPackagesWhenShipmentHasExplicitDestination() {
        Shipment shipment = carrierShipment("GUIA-123");
        shipment.setDestinationSummary("Destino comun del envio compartido");
        ShipmentPackage firstPackageLine = shipmentPackage();
        ShipmentPackage secondPackageLine = shipmentPackage();
        setId(secondPackageLine, 21L);
        secondPackageLine.setCustomerPackageId(5L);
        CustomerPackage firstPackage = readyCustomerPackage("GUIA-123");
        firstPackage.setShippingAddressConfirmed(true);
        firstPackage.setDeliveryType(CustomerPackageDeliveryType.PARCEL_SERVICE);
        firstPackage.setShipToLine1("Calle 1");
        firstPackage.setShipToCity("CDMX");
        CustomerPackage secondPackage = readyCustomerPackage("GUIA-123");
        setId(secondPackage, 5L);
        secondPackage.setFolio("PKG-5");
        secondPackage.setShippingAddressConfirmed(true);
        secondPackage.setDeliveryType(CustomerPackageDeliveryType.PARCEL_SERVICE);
        secondPackage.setShipToLine1("Calle 2");
        secondPackage.setShipToCity("CDMX");
        DispatchShipmentRequest request = new DispatchShipmentRequest();
        request.setDispatchedByUserId(77L);

        when(currentUser.getUserId()).thenReturn(77L);
        when(repository.findById(2L)).thenReturn(Optional.of(shipment));
        when(shipmentPackageRepository.findByShipmentIdOrderByIdAsc(2L)).thenReturn(List.of(firstPackageLine, secondPackageLine));
        when(customerPackageRepository.findById(4L)).thenReturn(Optional.of(firstPackage));
        when(customerPackageRepository.findById(5L)).thenReturn(Optional.of(secondPackage));
        when(repository.save(shipment)).thenReturn(shipment);
        when(customerPackageRepository.save(firstPackage)).thenReturn(firstPackage);
        when(customerPackageRepository.save(secondPackage)).thenReturn(secondPackage);

        ShipmentDetailResponse response = service.dispatch(2L, request);

        assertEquals(ShipmentStatus.OUT_FOR_DELIVERY.name(), response.getStatus());
        assertEquals(CustomerPackageStatus.SHIPPED, firstPackage.getStatus());
        assertEquals(CustomerPackageStatus.SHIPPED, secondPackage.getStatus());
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

        assertEquals("No se puede despachar un shipment vacio", ex.getMessage());
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

    @Test
    void updateCostSharesCreatesEqualSplit() {
        Shipment shipment = carrierShipment("GUIA-123");
        shipment.setRealShippingCost(new BigDecimal("100.00"));
        ShipmentPackage first = shipmentPackage(20L, 4L, 8L);
        ShipmentPackage second = shipmentPackage(21L, 5L, 9L);
        ShipmentPackage third = shipmentPackage(22L, 6L, 10L);
        ShipmentCostShareRequest request = new ShipmentCostShareRequest();
        request.setShareMethod(ShipmentCostShareMethod.EQUAL_SPLIT);

        when(currentUser.getUserId()).thenReturn(77L);
        when(repository.findById(2L)).thenReturn(Optional.of(shipment));
        when(shipmentPackageRepository.findByShipmentIdOrderByIdAsc(2L)).thenReturn(List.of(first, second, third));
        when(customerPackageRepository.findById(4L)).thenReturn(Optional.of(readyCustomerPackage(4L, 8L, "PKG-4", "GUIA-123")));
        when(customerPackageRepository.findById(5L)).thenReturn(Optional.of(readyCustomerPackage(5L, 9L, "PKG-5", "GUIA-123")));
        when(customerPackageRepository.findById(6L)).thenReturn(Optional.of(readyCustomerPackage(6L, 10L, "PKG-6", "GUIA-123")));
        when(shipmentCostShareRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));

        ShipmentCostShareResponse response = service.updateCostShares(2L, request);

        assertEquals("EQUAL_SPLIT", response.getShareMethod());
        assertEquals(new BigDecimal("100.00"), response.getAssignedTotal());
        assertEquals(new BigDecimal("0.00"), response.getAbsorbedAmount());
        assertEquals(new BigDecimal("0.00"), response.getOverAssignedAmount());
        assertEquals(new BigDecimal("33.33"), response.getShares().get(0).getAssignedAmount());
        assertEquals(new BigDecimal("33.33"), response.getShares().get(1).getAssignedAmount());
        assertEquals(new BigDecimal("33.34"), response.getShares().get(2).getAssignedAmount());
        verify(shipmentCostShareRepository).deleteByShipmentId(2L);
        verifyNoInteractions(paymentService);
    }

    @Test
    void updateCostSharesCreatesManualShareAndAbsorbedDifference() {
        Shipment shipment = carrierShipment("GUIA-123");
        shipment.setRealShippingCost(new BigDecimal("180.00"));
        ShipmentPackage first = shipmentPackage(20L, 4L, 8L);
        ShipmentPackage second = shipmentPackage(21L, 5L, 9L);
        ShipmentCostShareRequest request = new ShipmentCostShareRequest();
        request.setShareMethod(ShipmentCostShareMethod.MANUAL);
        request.setShares(List.of(shareLine(4L, "100.00", "Ana paga mas"), shareLine(5L, "50.00", null)));

        when(currentUser.getUserId()).thenReturn(77L);
        when(repository.findById(2L)).thenReturn(Optional.of(shipment));
        when(shipmentPackageRepository.findByShipmentIdOrderByIdAsc(2L)).thenReturn(List.of(first, second));
        when(customerPackageRepository.findById(4L)).thenReturn(Optional.of(readyCustomerPackage(4L, 8L, "PKG-4", "GUIA-123")));
        when(customerPackageRepository.findById(5L)).thenReturn(Optional.of(readyCustomerPackage(5L, 9L, "PKG-5", "GUIA-123")));
        when(shipmentCostShareRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));

        ShipmentCostShareResponse response = service.updateCostShares(2L, request);

        assertEquals("MANUAL", response.getShareMethod());
        assertEquals(new BigDecimal("150.00"), response.getAssignedTotal());
        assertEquals(new BigDecimal("30.00"), response.getAbsorbedAmount());
        assertEquals(new BigDecimal("0.00"), response.getOverAssignedAmount());
        assertEquals("Ana paga mas", response.getShares().get(0).getNotes());
        verifyNoInteractions(paymentService);
    }

    @Test
    void updateCostSharesCalculatesOverAssignedDifference() {
        Shipment shipment = carrierShipment("GUIA-123");
        shipment.setRealShippingCost(new BigDecimal("180.00"));
        ShipmentPackage first = shipmentPackage(20L, 4L, 8L);
        ShipmentPackage second = shipmentPackage(21L, 5L, 9L);
        ShipmentCostShareRequest request = new ShipmentCostShareRequest();
        request.setShareMethod(ShipmentCostShareMethod.MANUAL);
        request.setShares(List.of(shareLine(4L, "100.00", null), shareLine(5L, "100.00", null)));

        when(currentUser.getUserId()).thenReturn(77L);
        when(repository.findById(2L)).thenReturn(Optional.of(shipment));
        when(shipmentPackageRepository.findByShipmentIdOrderByIdAsc(2L)).thenReturn(List.of(first, second));
        when(customerPackageRepository.findById(4L)).thenReturn(Optional.of(readyCustomerPackage(4L, 8L, "PKG-4", "GUIA-123")));
        when(customerPackageRepository.findById(5L)).thenReturn(Optional.of(readyCustomerPackage(5L, 9L, "PKG-5", "GUIA-123")));
        when(shipmentCostShareRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));

        ShipmentCostShareResponse response = service.updateCostShares(2L, request);

        assertEquals(new BigDecimal("200.00"), response.getAssignedTotal());
        assertEquals(new BigDecimal("0.00"), response.getAbsorbedAmount());
        assertEquals(new BigDecimal("20.00"), response.getOverAssignedAmount());
    }

    @Test
    void updateCostSharesStoresStoreAbsorbedShare() {
        Shipment shipment = carrierShipment("GUIA-123");
        shipment.setRealShippingCost(new BigDecimal("180.00"));
        ShipmentPackage first = shipmentPackage(20L, 4L, 8L);
        ShipmentPackage second = shipmentPackage(21L, 5L, 9L);
        ShipmentCostShareRequest request = new ShipmentCostShareRequest();
        request.setShareMethod(ShipmentCostShareMethod.STORE_ABSORBED);

        when(currentUser.getUserId()).thenReturn(77L);
        when(repository.findById(2L)).thenReturn(Optional.of(shipment));
        when(shipmentPackageRepository.findByShipmentIdOrderByIdAsc(2L)).thenReturn(List.of(first, second));
        when(customerPackageRepository.findById(4L)).thenReturn(Optional.of(readyCustomerPackage(4L, 8L, "PKG-4", "GUIA-123")));
        when(customerPackageRepository.findById(5L)).thenReturn(Optional.of(readyCustomerPackage(5L, 9L, "PKG-5", "GUIA-123")));
        when(shipmentCostShareRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));

        ShipmentCostShareResponse response = service.updateCostShares(2L, request);

        assertEquals("STORE_ABSORBED", response.getShareMethod());
        assertEquals(new BigDecimal("0.00"), response.getAssignedTotal());
        assertEquals(new BigDecimal("180.00"), response.getAbsorbedAmount());
        assertEquals(new BigDecimal("0.00"), response.getOverAssignedAmount());
    }

    @Test
    void updateCostSharesBlocksNegativeAssignedAmount() {
        Shipment shipment = carrierShipment("GUIA-123");
        shipment.setRealShippingCost(new BigDecimal("180.00"));
        ShipmentPackage first = shipmentPackage(20L, 4L, 8L);
        ShipmentCostShareRequest request = new ShipmentCostShareRequest();
        request.setShareMethod(ShipmentCostShareMethod.MANUAL);
        request.setShares(List.of(shareLine(4L, "-1.00", null)));

        when(currentUser.getUserId()).thenReturn(77L);
        when(repository.findById(2L)).thenReturn(Optional.of(shipment));
        when(shipmentPackageRepository.findByShipmentIdOrderByIdAsc(2L)).thenReturn(List.of(first));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.updateCostShares(2L, request));

        assertEquals("El monto asignado no puede ser negativo.", ex.getMessage());
        verify(shipmentCostShareRepository, never()).saveAll(any());
    }

    @Test
    void updateCostSharesBlocksCancelledShipment() {
        Shipment shipment = carrierShipment("GUIA-123");
        shipment.setStatus(ShipmentStatus.CANCELLED);
        ShipmentCostShareRequest request = new ShipmentCostShareRequest();
        request.setShareMethod(ShipmentCostShareMethod.STORE_ABSORBED);

        when(currentUser.getUserId()).thenReturn(77L);
        when(repository.findById(2L)).thenReturn(Optional.of(shipment));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.updateCostShares(2L, request));

        assertEquals("No se puede modificar el reparto de un envio finalizado o cancelado.", ex.getMessage());
        verify(shipmentCostShareRepository, never()).saveAll(any());
    }

    @Test
    void updateCostSharesRequiresRealCostForEqualSplit() {
        Shipment shipment = carrierShipment("GUIA-123");
        ShipmentPackage first = shipmentPackage(20L, 4L, 8L);
        ShipmentCostShareRequest request = new ShipmentCostShareRequest();
        request.setShareMethod(ShipmentCostShareMethod.EQUAL_SPLIT);

        when(currentUser.getUserId()).thenReturn(77L);
        when(repository.findById(2L)).thenReturn(Optional.of(shipment));
        when(shipmentPackageRepository.findByShipmentIdOrderByIdAsc(2L)).thenReturn(List.of(first));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.updateCostShares(2L, request));

        assertEquals("Captura el costo real del envio antes de calcular el reparto.", ex.getMessage());
    }

    @Test
    void updateCostSharesRejectsPackageOutsideShipment() {
        Shipment shipment = carrierShipment("GUIA-123");
        shipment.setRealShippingCost(new BigDecimal("180.00"));
        ShipmentPackage first = shipmentPackage(20L, 4L, 8L);
        ShipmentCostShareRequest request = new ShipmentCostShareRequest();
        request.setShareMethod(ShipmentCostShareMethod.MANUAL);
        request.setShares(List.of(shareLine(999L, "10.00", null)));

        when(currentUser.getUserId()).thenReturn(77L);
        when(repository.findById(2L)).thenReturn(Optional.of(shipment));
        when(shipmentPackageRepository.findByShipmentIdOrderByIdAsc(2L)).thenReturn(List.of(first));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.updateCostShares(2L, request));

        assertEquals("El reparto incluye paquetes que no pertenecen al envio.", ex.getMessage());
    }

    @Test
    void getCostSharesKeepsTenantBranchValidation() {
        Shipment shipment = carrierShipment("GUIA-123");
        ShipmentPackage first = shipmentPackage(20L, 4L, 8L);
        ShipmentCostShare share = new ShipmentCostShare();
        share.setShipmentId(2L);
        share.setCustomerPackageId(4L);
        share.setCustomerId(8L);
        share.setAssignedAmount(new BigDecimal("40.00"));
        share.setShareMethod(ShipmentCostShareMethod.MANUAL);

        when(currentUser.getUserId()).thenReturn(77L);
        when(repository.findById(2L)).thenReturn(Optional.of(shipment));
        when(shipmentPackageRepository.findByShipmentIdOrderByIdAsc(2L)).thenReturn(List.of(first));
        when(shipmentCostShareRepository.findByShipmentIdOrderByIdAsc(2L)).thenReturn(List.of(share));
        when(customerPackageRepository.findById(4L)).thenReturn(Optional.of(readyCustomerPackage(4L, 8L, "PKG-4", "GUIA-123")));

        ShipmentCostShareResponse response = service.getCostShares(2L);

        verify(tenantAccessGuard).requireBranch(10L, "El envio no pertenece a la sucursal activa");
        assertEquals("MANUAL", response.getShareMethod());
        assertEquals(new BigDecimal("40.00"), response.getAssignedTotal());
    }
    @Test
    void registerShippingPaymentCreatesPartialPaymentAndBalance() {
        Shipment shipment = carrierShipment("GUIA-123");
        shipment.setRealShippingCost(new BigDecimal("60.00"));
        ShipmentCostShare share = costShare(30L, 4L, 8L, "60.00");
        RegisterShipmentPaymentRequest request = shippingPaymentRequest(30L, "30.00");
        AtomicReference<ShipmentPayment> saved = new AtomicReference<>();

        when(currentUser.getUserId()).thenReturn(77L);
        when(repository.findById(2L)).thenReturn(Optional.of(shipment));
        when(shipmentCostShareRepository.findByShipmentIdOrderByIdAsc(2L)).thenReturn(List.of(share));
        when(shipmentPaymentRepository.findByShipmentIdOrderByRegisteredAtDescIdDesc(2L))
                .thenReturn(List.of())
                .thenAnswer(invocation -> List.of(saved.get()));
        when(customerPackageRepository.findById(4L)).thenReturn(Optional.of(readyCustomerPackage(4L, 8L, "PKG-4", "GUIA-123")));
        when(shipmentPaymentRepository.save(any())).thenAnswer(invocation -> {
            ShipmentPayment payment = invocation.getArgument(0);
            setId(payment, 90L);
            saved.set(payment);
            return payment;
        });

        ShipmentPaymentsResponse response = service.registerShippingPayment(2L, request);

        assertEquals(new BigDecimal("30.00"), response.getPaidTotal());
        assertEquals(new BigDecimal("30.00"), response.getShippingBalance());
        assertEquals(new BigDecimal("30.00"), response.getShares().get(0).getPaidAmount());
        assertEquals(new BigDecimal("30.00"), response.getShares().get(0).getBalanceAmount());
        assertEquals("TRANSFERENCIA", response.getPayments().get(0).getPaymentMethod());
        verifyNoInteractions(paymentService);
    }

    @Test
    void registerShippingPaymentBlocksZeroAmount() {
        Shipment shipment = carrierShipment("GUIA-123");
        ShipmentCostShare share = costShare(30L, 4L, 8L, "60.00");
        RegisterShipmentPaymentRequest request = shippingPaymentRequest(30L, "0.00");

        when(currentUser.getUserId()).thenReturn(77L);
        when(repository.findById(2L)).thenReturn(Optional.of(shipment));
        when(shipmentCostShareRepository.findByShipmentIdOrderByIdAsc(2L)).thenReturn(List.of(share));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.registerShippingPayment(2L, request));

        assertEquals("El pago de envio debe ser mayor a cero.", ex.getMessage());
        verify(shipmentPaymentRepository, never()).save(any());
    }

    @Test
    void registerShippingPaymentBlocksShareFromOtherShipment() {
        Shipment shipment = carrierShipment("GUIA-123");
        ShipmentCostShare share = costShare(30L, 4L, 8L, "60.00");
        RegisterShipmentPaymentRequest request = shippingPaymentRequest(999L, "10.00");

        when(currentUser.getUserId()).thenReturn(77L);
        when(repository.findById(2L)).thenReturn(Optional.of(shipment));
        when(shipmentCostShareRepository.findByShipmentIdOrderByIdAsc(2L)).thenReturn(List.of(share));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.registerShippingPayment(2L, request));

        assertEquals("El reparto indicado no pertenece al envio.", ex.getMessage());
        verify(shipmentPaymentRepository, never()).save(any());
    }

    @Test
    void registerShippingPaymentBlocksCancelledShipment() {
        Shipment shipment = carrierShipment("GUIA-123");
        shipment.setStatus(ShipmentStatus.CANCELLED);
        RegisterShipmentPaymentRequest request = shippingPaymentRequest(30L, "10.00");

        when(currentUser.getUserId()).thenReturn(77L);
        when(repository.findById(2L)).thenReturn(Optional.of(shipment));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.registerShippingPayment(2L, request));

        assertEquals("No se pueden registrar pagos de envio en un envio cancelado.", ex.getMessage());
        verify(shipmentPaymentRepository, never()).save(any());
    }

    @Test
    void registerShippingPaymentBlocksOverpayment() {
        Shipment shipment = carrierShipment("GUIA-123");
        ShipmentCostShare share = costShare(30L, 4L, 8L, "60.00");
        ShipmentPayment previous = shippingPayment(90L, 30L, 4L, 8L, "50.00", ShipmentPaymentStatus.REGISTERED);
        RegisterShipmentPaymentRequest request = shippingPaymentRequest(30L, "20.00");

        when(currentUser.getUserId()).thenReturn(77L);
        when(repository.findById(2L)).thenReturn(Optional.of(shipment));
        when(shipmentCostShareRepository.findByShipmentIdOrderByIdAsc(2L)).thenReturn(List.of(share));
        when(shipmentPaymentRepository.findByShipmentIdOrderByRegisteredAtDescIdDesc(2L)).thenReturn(List.of(previous));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.registerShippingPayment(2L, request));

        assertEquals("El pago de envio no puede exceder el saldo asignado.", ex.getMessage());
        verify(shipmentPaymentRepository, never()).save(any());
    }

    @Test
    void cancelShippingPaymentMarksCancelledAndRestoresBalance() {
        Shipment shipment = carrierShipment("GUIA-123");
        ShipmentCostShare share = costShare(30L, 4L, 8L, "60.00");
        ShipmentPayment payment = shippingPayment(90L, 30L, 4L, 8L, "30.00", ShipmentPaymentStatus.REGISTERED);
        CancelShipmentPaymentRequest request = new CancelShipmentPaymentRequest();
        request.setCancelReason("Captura duplicada");

        when(currentUser.getUserId()).thenReturn(77L);
        when(repository.findById(2L)).thenReturn(Optional.of(shipment));
        when(shipmentPaymentRepository.findByShipmentIdAndId(2L, 90L)).thenReturn(Optional.of(payment));
        when(shipmentPaymentRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(shipmentCostShareRepository.findByShipmentIdOrderByIdAsc(2L)).thenReturn(List.of(share));
        when(shipmentPaymentRepository.findByShipmentIdOrderByRegisteredAtDescIdDesc(2L)).thenReturn(List.of(payment));
        when(customerPackageRepository.findById(4L)).thenReturn(Optional.of(readyCustomerPackage(4L, 8L, "PKG-4", "GUIA-123")));

        ShipmentPaymentsResponse response = service.cancelShippingPayment(2L, 90L, request);

        assertEquals(new BigDecimal("0.00"), response.getPaidTotal());
        assertEquals(new BigDecimal("60.00"), response.getShippingBalance());
        assertEquals("CANCELLED", response.getPayments().get(0).getStatus());
        assertEquals("Captura duplicada", response.getPayments().get(0).getCancelReason());
        verifyNoInteractions(paymentService);
    }


    @Test
    void registerShippingPaymentBlocksNegativeAmount() {
        Shipment shipment = carrierShipment("GUIA-123");
        ShipmentCostShare share = costShare(30L, 4L, 8L, "60.00");
        RegisterShipmentPaymentRequest request = shippingPaymentRequest(30L, "-1.00");

        when(currentUser.getUserId()).thenReturn(77L);
        when(repository.findById(2L)).thenReturn(Optional.of(shipment));
        when(shipmentCostShareRepository.findByShipmentIdOrderByIdAsc(2L)).thenReturn(List.of(share));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.registerShippingPayment(2L, request));

        assertEquals("El pago de envio debe ser mayor a cero.", ex.getMessage());
        verify(shipmentPaymentRepository, never()).save(any());
        verifyNoInteractions(paymentService);
    }

    @Test
    void registerShippingPaymentBlocksMismatchedCustomerInRequest() {
        Shipment shipment = carrierShipment("GUIA-123");
        ShipmentCostShare share = costShare(30L, 4L, 8L, "60.00");
        RegisterShipmentPaymentRequest request = shippingPaymentRequest(30L, "10.00");
        request.setCustomerId(99L);

        when(currentUser.getUserId()).thenReturn(77L);
        when(repository.findById(2L)).thenReturn(Optional.of(shipment));
        when(shipmentCostShareRepository.findByShipmentIdOrderByIdAsc(2L)).thenReturn(List.of(share));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.registerShippingPayment(2L, request));

        assertEquals("El cliente indicado no coincide con el reparto de envio.", ex.getMessage());
        verify(shipmentPaymentRepository, never()).save(any());
        verifyNoInteractions(paymentService);
    }

    @Test
    void getShippingPaymentsDoesNotCountCancelledPayments() {
        Shipment shipment = carrierShipment("GUIA-123");
        shipment.setRealShippingCost(new BigDecimal("60.00"));
        ShipmentCostShare share = costShare(30L, 4L, 8L, "60.00");
        ShipmentPayment registered = shippingPayment(90L, 30L, 4L, 8L, "20.00", ShipmentPaymentStatus.REGISTERED);
        ShipmentPayment cancelled = shippingPayment(91L, 30L, 4L, 8L, "40.00", ShipmentPaymentStatus.CANCELLED);

        when(currentUser.getUserId()).thenReturn(77L);
        when(repository.findById(2L)).thenReturn(Optional.of(shipment));
        when(shipmentCostShareRepository.findByShipmentIdOrderByIdAsc(2L)).thenReturn(List.of(share));
        when(shipmentPaymentRepository.findByShipmentIdOrderByRegisteredAtDescIdDesc(2L)).thenReturn(List.of(registered, cancelled));
        when(customerPackageRepository.findById(4L)).thenReturn(Optional.of(readyCustomerPackage(4L, 8L, "PKG-4", "GUIA-123")));

        ShipmentPaymentsResponse response = service.getShippingPayments(2L);

        assertEquals(new BigDecimal("20.00"), response.getPaidTotal());
        assertEquals(new BigDecimal("40.00"), response.getShippingBalance());
        assertEquals(new BigDecimal("20.00"), response.getShares().get(0).getPaidAmount());
        assertEquals(new BigDecimal("40.00"), response.getShares().get(0).getBalanceAmount());
        assertEquals(2, response.getPayments().size());
        verifyNoInteractions(paymentService);
    }

    @Test
    void cancelShippingPaymentBlocksAlreadyCancelled() {
        Shipment shipment = carrierShipment("GUIA-123");
        ShipmentPayment payment = shippingPayment(90L, 30L, 4L, 8L, "30.00", ShipmentPaymentStatus.CANCELLED);

        when(currentUser.getUserId()).thenReturn(77L);
        when(repository.findById(2L)).thenReturn(Optional.of(shipment));
        when(shipmentPaymentRepository.findByShipmentIdAndId(2L, 90L)).thenReturn(Optional.of(payment));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.cancelShippingPayment(2L, 90L, new CancelShipmentPaymentRequest()));

        assertEquals("El pago de envio ya esta cancelado.", ex.getMessage());
        verify(shipmentPaymentRepository, never()).save(any());
        verifyNoInteractions(paymentService);
    }

    @Test
    void updateCostSharesBlocksWhenShippingPaymentHistoryExists() {
        Shipment shipment = carrierShipment("GUIA-123");
        shipment.setRealShippingCost(new BigDecimal("60.00"));
        ShipmentPayment payment = shippingPayment(90L, 30L, 4L, 8L, "30.00", ShipmentPaymentStatus.CANCELLED);
        ShipmentCostShareRequest request = new ShipmentCostShareRequest();
        request.setShareMethod(ShipmentCostShareMethod.STORE_ABSORBED);

        when(currentUser.getUserId()).thenReturn(77L);
        when(repository.findById(2L)).thenReturn(Optional.of(shipment));
        when(shipmentPaymentRepository.findByShipmentIdOrderByRegisteredAtDescIdDesc(2L)).thenReturn(List.of(payment));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.updateCostShares(2L, request));

        assertEquals("No se puede modificar el reparto porque ya existen pagos de envio registrados o cancelados.", ex.getMessage());
        verify(shipmentCostShareRepository, never()).deleteByShipmentId(2L);
        verify(shipmentCostShareRepository, never()).saveAll(any());
        verifyNoInteractions(paymentService);
    }
    @Test
    void getShippingPaymentsKeepsTenantBranchValidation() {
        Shipment shipment = carrierShipment("GUIA-123");
        ShipmentCostShare share = costShare(30L, 4L, 8L, "60.00");

        when(currentUser.getUserId()).thenReturn(77L);
        when(repository.findById(2L)).thenReturn(Optional.of(shipment));
        when(shipmentCostShareRepository.findByShipmentIdOrderByIdAsc(2L)).thenReturn(List.of(share));
        when(shipmentPaymentRepository.findByShipmentIdOrderByRegisteredAtDescIdDesc(2L)).thenReturn(List.of());
        when(customerPackageRepository.findById(4L)).thenReturn(Optional.of(readyCustomerPackage(4L, 8L, "PKG-4", "GUIA-123")));

        ShipmentPaymentsResponse response = service.getShippingPayments(2L);

        verify(tenantAccessGuard).requireBranch(10L, "El envio no pertenece a la sucursal activa");
        assertEquals(new BigDecimal("60.00"), response.getShippingBalance());
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
        return shipmentPackage(20L, 4L, 8L);
    }

    private ShipmentPackage shipmentPackage(Long lineId, Long packageId, Long customerId) {
        ShipmentPackage shipmentPackage = new ShipmentPackage();
        setId(shipmentPackage, lineId);
        shipmentPackage.setShipmentId(2L);
        shipmentPackage.setCustomerPackageId(packageId);
        shipmentPackage.setCustomerId(customerId);
        shipmentPackage.setPaymentMode(ShipmentPackagePaymentMode.PREPAID);
        shipmentPackage.setStatus(ShipmentPackageStatus.PENDING);
        return shipmentPackage;
    }

    private CustomerPackage readyCustomerPackage(String trackingNumber) {
        return readyCustomerPackage(4L, 8L, "PKG-4", trackingNumber);
    }

    private CustomerPackage readyCustomerPackage(Long packageId, Long customerId, String folio, String trackingNumber) {
        Customer customer = new Customer();
        setId(customer, customerId);
        customer.setName("Cliente QA");
        customer.setPhone("5555555555");
        Branch branch = branch();
        customer.setBranch(branch);

        CustomerPackage customerPackage = new CustomerPackage();
        setId(customerPackage, packageId);
        customerPackage.setFolio(folio);
        customerPackage.setCustomer(customer);
        customerPackage.setBranch(branch);
        customerPackage.setStatus(CustomerPackageStatus.READY);
        customerPackage.setTrackingNumber(trackingNumber);
        customerPackage.setCreatedByUserId(77L);
        return customerPackage;
    }

    private ShipmentCostShareLineRequest shareLine(Long packageId, String amount, String notes) {
        ShipmentCostShareLineRequest line = new ShipmentCostShareLineRequest();
        line.setPackageId(packageId);
        line.setAssignedAmount(new BigDecimal(amount));
        line.setNotes(notes);
        return line;
    }
    private ShipmentCostShare costShare(Long id, Long packageId, Long customerId, String assignedAmount) {
        ShipmentCostShare share = new ShipmentCostShare();
        setId(share, id);
        share.setShipmentId(2L);
        share.setCustomerPackageId(packageId);
        share.setCustomerId(customerId);
        share.setAssignedAmount(new BigDecimal(assignedAmount));
        share.setShareMethod(ShipmentCostShareMethod.MANUAL);
        share.setCreatedByUserId(77L);
        share.setUpdatedByUserId(77L);
        return share;
    }

    private RegisterShipmentPaymentRequest shippingPaymentRequest(Long costShareId, String amount) {
        RegisterShipmentPaymentRequest request = new RegisterShipmentPaymentRequest();
        request.setCostShareId(costShareId);
        request.setAmount(new BigDecimal(amount));
        request.setPaymentMethod("TRANSFERENCIA");
        request.setReference("REF-SHIP");
        request.setNotes("Pago envio");
        return request;
    }

    private ShipmentPayment shippingPayment(Long id,
            Long costShareId,
            Long packageId,
            Long customerId,
            String amount,
            ShipmentPaymentStatus status) {
        ShipmentPayment payment = new ShipmentPayment();
        setId(payment, id);
        payment.setShipmentId(2L);
        payment.setCostShareId(costShareId);
        payment.setPackageId(packageId);
        payment.setCustomerId(customerId);
        payment.setPaidByCustomerId(customerId);
        payment.setAmount(new BigDecimal(amount));
        payment.setPaymentMethod("TRANSFERENCIA");
        payment.setReference("REF-SHIP");
        payment.setStatus(status);
        payment.setRegisteredBy(77L);
        return payment;
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
