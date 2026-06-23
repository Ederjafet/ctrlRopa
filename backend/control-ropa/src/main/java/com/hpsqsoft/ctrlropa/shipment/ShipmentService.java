package com.hpsqsoft.ctrlropa.shipment;

import com.hpsqsoft.ctrlropa.branch.Branch;
import com.hpsqsoft.ctrlropa.branch.BranchRepository;
import com.hpsqsoft.ctrlropa.customer.CustomerAddress;
import com.hpsqsoft.ctrlropa.customer.CustomerAddressRepository;
import com.hpsqsoft.ctrlropa.customerpackage.CustomerPackage;
import com.hpsqsoft.ctrlropa.customerpackage.CustomerPackageDeliveryType;
import com.hpsqsoft.ctrlropa.customerpackage.CustomerPackageItem;
import com.hpsqsoft.ctrlropa.customerpackage.CustomerPackageItemRepository;
import com.hpsqsoft.ctrlropa.customerpackage.CustomerPackageRepository;
import com.hpsqsoft.ctrlropa.customerpackage.CustomerPackageStatus;
import com.hpsqsoft.ctrlropa.incident.IncidentService;
import com.hpsqsoft.ctrlropa.payment.PaymentService;
import com.hpsqsoft.ctrlropa.sale.Sale;
import com.hpsqsoft.ctrlropa.sale.SaleRepository;
import com.hpsqsoft.ctrlropa.security.access.AccessService;
import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import com.hpsqsoft.ctrlropa.security.access.PermissionCode;
import com.hpsqsoft.ctrlropa.tenant.TenantAccessGuard;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@Transactional
public class ShipmentService {

    private final ShipmentRepository repository;
    private final ShipmentPackageRepository shipmentPackageRepository;
    private final CustomerPackageRepository customerPackageRepository;
    private final CustomerPackageItemRepository customerPackageItemRepository;
    private final CustomerAddressRepository customerAddressRepository;
    private final BranchRepository branchRepository;
    private final PaymentService paymentService;
    private final IncidentService incidentService;
    private final SaleRepository saleRepository;
    private final TenantAccessGuard tenantAccessGuard;
    private final AccessService accessService;
    private final CurrentUser currentUser;

    public ShipmentService(ShipmentRepository repository,
                           ShipmentPackageRepository shipmentPackageRepository,
                           CustomerPackageRepository customerPackageRepository,
                           CustomerPackageItemRepository customerPackageItemRepository,
                           CustomerAddressRepository customerAddressRepository,
                           BranchRepository branchRepository,
                           PaymentService paymentService,
                           IncidentService incidentService,
                           SaleRepository saleRepository,
                           TenantAccessGuard tenantAccessGuard,
                           AccessService accessService,
                           CurrentUser currentUser) {
        this.repository = repository;
        this.shipmentPackageRepository = shipmentPackageRepository;
        this.customerPackageRepository = customerPackageRepository;
        this.customerPackageItemRepository = customerPackageItemRepository;
        this.customerAddressRepository = customerAddressRepository;
        this.branchRepository = branchRepository;
        this.paymentService = paymentService;
        this.incidentService = incidentService;
        this.saleRepository = saleRepository;
        this.tenantAccessGuard = tenantAccessGuard;
        this.accessService = accessService;
        this.currentUser = currentUser;
    }

    public ShipmentResponse create(CreateShipmentRequest request) {
        assertCanManageShipments();
        Branch branch = branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new IllegalArgumentException("Sucursal no encontrada"));
        tenantAccessGuard.requireBranch(branch.getId(), "La sucursal del envio no pertenece al tenant activo");

        if (request.getDeliveryType() == ShipmentDeliveryType.CARRIER
                && (request.getGuideReference() == null || request.getGuideReference().trim().isBlank())) {
            throw new IllegalArgumentException("La guia o referencia es obligatoria para envíos por paqueteria");
        }

        Shipment shipment = new Shipment();
        shipment.setFolio(generateUniqueFolio());
        shipment.setBranch(branch);
        shipment.setDeliveryType(request.getDeliveryType());
        shipment.setGuideReference(cleanNullable(request.getGuideReference()));
        shipment.setStatus(ShipmentStatus.OPEN);
        shipment.setCreatedByUserId(request.getCreatedByUserId());

        return toResponse(repository.save(shipment));
    }

    @Transactional(readOnly = true)
    public ShipmentDetailResponse findDetail(Long shipmentId) {
        assertCanManageShipments();
        Shipment shipment = findShipment(shipmentId);

        List<ShipmentDetailResponse.PackageLine> packages = shipmentPackageRepository
                .findByShipmentIdOrderByIdAsc(shipmentId)
                .stream()
                .map(this::toPackageLine)
                .toList();

        return new ShipmentDetailResponse(
                shipment.getId(),
                shipment.getFolio(),
                shipment.getBranch().getId(),
                shipment.getBranch().getCode(),
                shipment.getDeliveryType().name(),
                shipment.getStatus().name(),
                shipment.getGuideReference(),
                shipment.getCreatedAt(),
                shipment.getCreatedByUserId(),
                shipment.getDispatchedAt(),
                shipment.getDispatchedByUserId(),
                shipment.getCancelledAt(),
                shipment.getCancelledByUserId(),
                packages
        );
    }
    
    @Transactional(readOnly = true)
    public ShipmentDetailResponse findDetailByFolio(String folio) {
        Shipment shipment = findShipmentByFolio(folio);
        return findDetail(shipment.getId());
    }

    @Transactional(readOnly = true)
    public List<ShipmentResponse> findByBranch(Long branchId) {
        assertCanManageShipments();
        tenantAccessGuard.requireBranch(branchId, "La sucursal de envios no pertenece al tenant activo");
        return repository.findByBranchIdOrderByCreatedAtDesc(branchId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public ShipmentDetailResponse addPackage(Long shipmentId, AddShipmentPackageRequest request) {
        assertCanManageShipments();
        Shipment shipment = findShipment(shipmentId);

        if (shipment.getStatus() != ShipmentStatus.OPEN) {
            throw new IllegalArgumentException("Solo shipments OPEN pueden modificarse");
        }

        CustomerPackage customerPackage = customerPackageRepository.findById(request.getCustomerPackageId())
                .orElseThrow(() -> new IllegalArgumentException("Paquete no encontrado"));
        tenantAccessGuard.requireBranch(customerPackage.getBranch().getId(), "El paquete no pertenece a la sucursal activa");

        if (customerPackage.getStatus() != CustomerPackageStatus.READY) {
            throw new IllegalArgumentException("Solo paquetes READY pueden agregarse a un shipment");
        }

        if (!customerPackage.getBranch().getId().equals(shipment.getBranch().getId())) {
            throw new IllegalArgumentException("El paquete no pertenece a la sucursal del shipment");
        }

        CustomerAddress address = null;
        if (request.getDeliveryAddressId() != null) {
            address = customerAddressRepository.findById(request.getDeliveryAddressId())
                .orElseThrow(() -> new IllegalArgumentException("Dirección de entrega no encontrada"));
            tenantAccessGuard.requireBranch(address.getCustomer().getBranch().getId(), "La direccion no pertenece a la sucursal activa");

            if (!address.getCustomer().getId().equals(customerPackage.getCustomer().getId())) {
            throw new IllegalArgumentException("La dirección no pertenece al cliente del paquete");
        }

        } else if (!customerPackage.isShippingAddressConfirmed()) {
            throw new IllegalArgumentException("El paquete no tiene direccion de envio confirmada");
        } else if (deliveryTypeRequiresAddress(customerPackage.getDeliveryType())
                && (customerPackage.getShipToLine1() == null || customerPackage.getShipToLine1().isBlank())) {
            throw new IllegalArgumentException("El paquete no tiene snapshot de direccion de envio");
        }

        if (hasActiveAssignment(customerPackage.getId())) {
            throw new IllegalArgumentException("El paquete ya está en otro shipment activo");
        }

        validatePaymentMode(request);
        validateCodPackage(customerPackage, request.getPaymentMode());

        ShipmentPackage shipmentPackage = new ShipmentPackage();
        shipmentPackage.setShipmentId(shipment.getId());
        shipmentPackage.setCustomerPackageId(customerPackage.getId());
        shipmentPackage.setCustomerId(customerPackage.getCustomer().getId());
        shipmentPackage.setDeliveryAddressId(address != null ? address.getId() : null);
        shipmentPackage.setPaymentMode(request.getPaymentMode());
        shipmentPackage.setExpectedCollectionAmount(
                request.getPaymentMode() == ShipmentPackagePaymentMode.COD ? request.getExpectedCodAmount() : null
        );
        shipmentPackage.setStatus(ShipmentPackageStatus.PENDING);
        shipmentPackage.setCollectedAmount(null);
        shipmentPackage.setCollectionDifference(null);
        shipmentPackage.setCollectionStatus(null);
        shipmentPackage.setCollectionNotes(null);
        shipmentPackage.setDeliveryConfirmedByUserId(null);
        shipmentPackage.setDeliveredAt(null);
        shipmentPackage.setReturnedAt(null);

        shipmentPackageRepository.save(shipmentPackage);

        return findDetail(shipmentId);
    }
    
    public ShipmentDetailResponse addPackageByFolio(String shipmentFolio,
            String packageFolio,
            AddShipmentPackageByFolioRequest request) {
		Shipment shipment = findShipmentByFolio(shipmentFolio);
		
		CustomerPackage customerPackage = customerPackageRepository.findByFolio(packageFolio)
		.orElseThrow(() -> new IllegalArgumentException("Paquete no encontrado con folio: " + packageFolio));
		
		AddShipmentPackageRequest resolvedRequest = new AddShipmentPackageRequest();
		resolvedRequest.setCustomerPackageId(customerPackage.getId());
		resolvedRequest.setDeliveryAddressId(request.getDeliveryAddressId());
		resolvedRequest.setPaymentMode(request.getPaymentMode());
		resolvedRequest.setExpectedCodAmount(request.getExpectedCodAmount());
		
		return addPackage(shipment.getId(), resolvedRequest);
	}

    public ShipmentDetailResponse dispatch(Long shipmentId, DispatchShipmentRequest request) {
        assertCanManageShipments();
        Shipment shipment = findShipment(shipmentId);

        if (shipment.getStatus() != ShipmentStatus.OPEN) {
            throw new IllegalArgumentException("Solo shipments OPEN pueden despacharse");
        }

        List<ShipmentPackage> packages = shipmentPackageRepository.findByShipmentIdOrderByIdAsc(shipmentId);

        if (packages.isEmpty()) {
            throw new IllegalArgumentException("No se puede despachar un shipment vacío");
        }

        String resolvedGuide = cleanNullable(shipment.getGuideReference());

        for (ShipmentPackage sp : packages) {
            CustomerPackage cp = customerPackageRepository.findById(sp.getCustomerPackageId())
                    .orElseThrow(() -> new IllegalArgumentException("Paquete no encontrado"));

            if (cp.getStatus() != CustomerPackageStatus.READY) {
                throw new IllegalArgumentException("Todos los paquetes deben estar en READY para despachar");
            }

            if (shipment.getDeliveryType() == ShipmentDeliveryType.CARRIER && resolvedGuide == null) {
                resolvedGuide = cleanNullable(cp.getTrackingNumber());
            }
        }

        if (shipment.getDeliveryType() == ShipmentDeliveryType.CARRIER && resolvedGuide == null) {
            throw new IllegalArgumentException("Captura la guia o referencia antes de marcar como enviado.");
        }

        shipment.setGuideReference(resolvedGuide);
        shipment.setStatus(ShipmentStatus.OUT_FOR_DELIVERY);
        shipment.setDispatchedAt(LocalDateTime.now());
        shipment.setDispatchedByUserId(request.getDispatchedByUserId());
        repository.save(shipment);

        for (ShipmentPackage sp : packages) {
            CustomerPackage cp = customerPackageRepository.findById(sp.getCustomerPackageId())
                    .orElseThrow(() -> new IllegalArgumentException("Paquete no encontrado"));
            cp.setStatus(CustomerPackageStatus.SHIPPED);
            customerPackageRepository.save(cp);
        }

        return findDetail(shipmentId);
    }
    
    public ShipmentDetailResponse dispatchByFolio(String folio, DispatchShipmentRequest request) {
        Shipment shipment = findShipmentByFolio(folio);
        return dispatch(shipment.getId(), request);
    }

    public ShipmentDetailResponse resolvePackage(Long shipmentId,
                                                 Long shipmentPackageId,
                                                 ResolveShipmentPackageRequest request) {
        assertCanManageShipments();
        Shipment shipment = findShipment(shipmentId);

        if (shipment.getStatus() != ShipmentStatus.OUT_FOR_DELIVERY) {
            throw new IllegalArgumentException("Solo shipments OUT_FOR_DELIVERY pueden resolverse");
        }

        if (request.getStatus() == ShipmentPackageStatus.PENDING) {
            throw new IllegalArgumentException("status no puede ser PENDING");
        }

        ShipmentPackage shipmentPackage = shipmentPackageRepository.findByShipmentIdAndId(shipmentId, shipmentPackageId)
                .orElseThrow(() -> new IllegalArgumentException("Shipment package no encontrado"));

        if (shipmentPackage.getStatus() != ShipmentPackageStatus.PENDING) {
            throw new IllegalArgumentException("Ese shipment package ya fue resuelto");
        }

        validateResolutionAmounts(shipmentPackage, request);

        shipmentPackage.setStatus(request.getStatus());
        shipmentPackage.setCollectionNotes(request.getCollectionNotes());
        shipmentPackage.setDeliveryConfirmedByUserId(request.getDeliveryConfirmedByUserId());

        CustomerPackage customerPackage = customerPackageRepository.findById(shipmentPackage.getCustomerPackageId())
                .orElseThrow(() -> new IllegalArgumentException("Paquete no encontrado"));

        if (request.getStatus() == ShipmentPackageStatus.DELIVERED) {
            shipmentPackage.setDeliveredAt(LocalDateTime.now());

            if (shipmentPackage.getPaymentMode() == ShipmentPackagePaymentMode.COD) {
                BigDecimal expected = shipmentPackage.getExpectedCollectionAmount();
                BigDecimal received = request.getCollectedAmount();

                shipmentPackage.setCollectedAmount(received);
                shipmentPackage.setCollectionDifference(received.subtract(expected));
                shipmentPackage.setCollectionStatus(resolveCollectionStatus(expected, received));

                registerCodPayment(shipment, shipmentPackage, customerPackage);
                registerCollectionIncidents(shipment, shipmentPackage, customerPackage, request.getDeliveryConfirmedByUserId());
            } else {
                shipmentPackage.setCollectedAmount(BigDecimal.ZERO);
                shipmentPackage.setCollectionDifference(BigDecimal.ZERO);
                shipmentPackage.setCollectionStatus(CollectionStatus.BALANCED);
            }

            customerPackage.setStatus(CustomerPackageStatus.DELIVERED);
        } else {
            shipmentPackage.setCollectedAmount(request.getCollectedAmount());

            if (request.getStatus() == ShipmentPackageStatus.RETURNED) {
                shipmentPackage.setReturnedAt(LocalDateTime.now());
            }

            customerPackage.setStatus(CustomerPackageStatus.READY);
        }

        shipmentPackageRepository.save(shipmentPackage);
        customerPackageRepository.save(customerPackage);

        refreshShipmentStatus(shipment);

        return findDetail(shipmentId);
    }
    
    public ShipmentDetailResponse resolvePackageByFolio(String shipmentFolio,
            Long shipmentPackageId,
            ResolveShipmentPackageRequest request) {
		Shipment shipment = findShipmentByFolio(shipmentFolio);
		return resolvePackage(shipment.getId(), shipmentPackageId, request);
	}

    public ShipmentDetailResponse cancel(Long shipmentId, CancelShipmentRequest request) {
        assertCanManageShipments();
        Shipment shipment = findShipment(shipmentId);

        if (shipment.getStatus() == ShipmentStatus.CANCELLED) {
            throw new IllegalArgumentException("El shipment ya está cancelado");
        }

        if (shipment.getStatus() == ShipmentStatus.DELIVERED ||
            shipment.getStatus() == ShipmentStatus.CLOSED_WITH_INCIDENTS) {
            throw new IllegalArgumentException("No se puede cancelar un shipment ya finalizado");
        }

        if (shipment.getStatus() == ShipmentStatus.OUT_FOR_DELIVERY) {
            throw new IllegalArgumentException("No se puede cancelar un shipment ya despachado");
        }

        shipment.setStatus(ShipmentStatus.CANCELLED);
        shipment.setCancelledAt(LocalDateTime.now());
        shipment.setCancelledByUserId(request.getCancelledByUserId());
        repository.save(shipment);

        return findDetail(shipmentId);
    }
    
    public ShipmentDetailResponse cancelByFolio(String folio, CancelShipmentRequest request) {
        Shipment shipment = findShipmentByFolio(folio);
        return cancel(shipment.getId(), request);
    }

    public ShipmentDetailResponse reopen(Long shipmentId, ReopenShipmentRequest request) {
        assertCanManageShipments();
        Shipment shipment = findShipment(shipmentId);

        if (shipment.getStatus() == ShipmentStatus.OPEN) {
            throw new IllegalArgumentException("El shipment ya está en OPEN");
        }

        if (shipment.getStatus() == ShipmentStatus.OUT_FOR_DELIVERY) {
            throw new IllegalArgumentException("No se puede reabrir un shipment en tránsito");
        }

        if (shipment.getStatus() == ShipmentStatus.DELIVERED) {
            throw new IllegalArgumentException("No se puede reabrir un shipment completamente entregado");
        }

        if (shipment.getStatus() != ShipmentStatus.CANCELLED &&
            shipment.getStatus() != ShipmentStatus.CLOSED_WITH_INCIDENTS) {
            throw new IllegalArgumentException("Estado no válido para reapertura");
        }

        List<ShipmentPackage> packages = shipmentPackageRepository.findByShipmentIdOrderByIdAsc(shipmentId);

        for (ShipmentPackage sp : packages) {
            if (sp.getStatus() == ShipmentPackageStatus.DELIVERED) {
                continue;
            }

            CustomerPackage cp = customerPackageRepository.findById(sp.getCustomerPackageId())
                    .orElseThrow(() -> new IllegalArgumentException("Paquete no encontrado"));

            cp.setStatus(CustomerPackageStatus.READY);
            customerPackageRepository.save(cp);

            sp.setStatus(ShipmentPackageStatus.PENDING);
            sp.setCollectedAmount(null);
            sp.setCollectionDifference(null);
            sp.setCollectionStatus(null);
            sp.setCollectionNotes(null);
            sp.setDeliveryConfirmedByUserId(null);
            sp.setDeliveredAt(null);
            sp.setReturnedAt(null);
            shipmentPackageRepository.save(sp);
        }

        shipment.setStatus(ShipmentStatus.OPEN);
        shipment.setDispatchedAt(null);
        shipment.setDispatchedByUserId(null);

        repository.save(shipment);

        return findDetail(shipmentId);
    }
    
    public ShipmentDetailResponse reopenByFolio(String folio, ReopenShipmentRequest request) {
        Shipment shipment = findShipmentByFolio(folio);
        return reopen(shipment.getId(), request);
    }

    private Shipment findShipment(Long shipmentId) {
        Shipment shipment = repository.findById(shipmentId)
                .orElseThrow(() -> new IllegalArgumentException("Shipment no encontrado con id: " + shipmentId));
        tenantAccessGuard.requireBranch(shipment.getBranch().getId(), "El envio no pertenece a la sucursal activa");
        return shipment;
    }
    
    private Shipment findShipmentByFolio(String folio) {
        Shipment shipment = repository.findByFolio(folio)
                .orElseThrow(() -> new IllegalArgumentException("Shipment no encontrado con folio: " + folio));
        tenantAccessGuard.requireBranch(shipment.getBranch().getId(), "El envio no pertenece a la sucursal activa");
        return shipment;
    }

    private boolean hasActiveAssignment(Long customerPackageId) {
        List<ShipmentPackage> rows = shipmentPackageRepository.findByCustomerPackageIdOrderByIdDesc(customerPackageId);

        for (ShipmentPackage row : rows) {
            if (row.getStatus() != ShipmentPackageStatus.PENDING) {
                continue;
            }

            Shipment shipment = findShipment(row.getShipmentId());
            if (shipment.getStatus() == ShipmentStatus.OPEN || shipment.getStatus() == ShipmentStatus.OUT_FOR_DELIVERY) {
                return true;
            }
        }

        return false;
    }

    private void validatePaymentMode(AddShipmentPackageRequest request) {
        if (request.getPaymentMode() == ShipmentPackagePaymentMode.COD) {
            if (request.getExpectedCodAmount() == null || request.getExpectedCodAmount().signum() <= 0) {
                throw new IllegalArgumentException("expectedCodAmount es obligatorio y debe ser mayor a 0 para COD");
            }
            return;
        }

        if (request.getExpectedCodAmount() != null && request.getExpectedCodAmount().signum() != 0) {
            throw new IllegalArgumentException("expectedCodAmount debe ser null o 0 para PREPAID");
        }
    }

    private void validateCodPackage(CustomerPackage customerPackage, ShipmentPackagePaymentMode paymentMode) {
        if (paymentMode != ShipmentPackagePaymentMode.COD) {
            return;
        }

        List<CustomerPackageItem> items = customerPackageItemRepository
                .findByCustomerPackageIdOrderByCreatedAtAsc(customerPackage.getId());

        if (items.isEmpty()) {
            throw new IllegalArgumentException("No se puede usar COD en un paquete vacío");
        }

        boolean hasReservation = items.stream().anyMatch(i -> i.getReservationId() != null);
        if (hasReservation) {
            throw new IllegalArgumentException("Los paquetes COD solo pueden contener sales");
        }

        boolean hasSale = items.stream().anyMatch(i -> i.getSaleId() != null);
        if (!hasSale) {
            throw new IllegalArgumentException("El paquete COD debe contener al menos una sale");
        }
    }

    private void registerCodPayment(Shipment shipment,
                                    ShipmentPackage shipmentPackage,
                                    CustomerPackage customerPackage) {
        List<Long> saleIds = customerPackageItemRepository
                .findByCustomerPackageIdOrderByCreatedAtAsc(customerPackage.getId())
                .stream()
                .map(CustomerPackageItem::getSaleId)
                .filter(id -> id != null)
                .toList();

        if (saleIds.isEmpty()) {
            throw new IllegalArgumentException("No hay sales para cobrar en COD");
        }

        Long createdByUserId = shipment.getDispatchedByUserId() != null
                ? shipment.getDispatchedByUserId()
                : shipment.getCreatedByUserId();

        String reference = "COD-SHP-" + shipment.getFolio() + "-PKG-" + customerPackage.getFolio();

        paymentService.createCodForSales(
                saleIds,
                shipmentPackage.getExpectedCollectionAmount(),
                createdByUserId,
                reference
        );
    }

    private void registerCollectionIncidents(Shipment shipment,
                                             ShipmentPackage shipmentPackage,
                                             CustomerPackage customerPackage,
                                             Long createdByUserId) {
        if (shipmentPackage.getPaymentMode() != ShipmentPackagePaymentMode.COD) {
            return;
        }

        List<Long> orderIds = customerPackageItemRepository
                .findByCustomerPackageIdOrderByCreatedAtAsc(customerPackage.getId())
                .stream()
                .map(CustomerPackageItem::getSaleId)
                .filter(id -> id != null)
                .map(this::findSaleOrderId)
                .filter(id -> id != null)
                .distinct()
                .toList();

        if (orderIds.isEmpty()) {
            incidentService.createCollectionIncident(
                    shipment.getBranch().getId(),
                    shipment.getId(),
                    shipmentPackage.getId(),
                    customerPackage.getCustomer().getId(),
                    null,
                    shipmentPackage.getExpectedCollectionAmount(),
                    shipmentPackage.getCollectedAmount(),
                    createdByUserId
            );
            return;
        }

        for (Long orderId : orderIds) {
            incidentService.createCollectionIncident(
                    shipment.getBranch().getId(),
                    shipment.getId(),
                    shipmentPackage.getId(),
                    customerPackage.getCustomer().getId(),
                    orderId,
                    shipmentPackage.getExpectedCollectionAmount(),
                    shipmentPackage.getCollectedAmount(),
                    createdByUserId
            );
        }
    }

    private Long findSaleOrderId(Long saleId) {
        Sale sale = saleRepository.findById(saleId)
                .orElseThrow(() -> new IllegalArgumentException("Venta no encontrada con id: " + saleId));
        tenantAccessGuard.requireBranch(sale.getBranch().getId(), "La venta no pertenece a la sucursal activa");
        return sale.getCustomerOrderId();
    }

    private CollectionStatus resolveCollectionStatus(BigDecimal expected, BigDecimal received) {
        int compare = received.compareTo(expected);
        if (compare == 0) {
            return CollectionStatus.BALANCED;
        }
        return compare < 0 ? CollectionStatus.SHORT : CollectionStatus.OVER;
    }

    private void validateResolutionAmounts(ShipmentPackage shipmentPackage, ResolveShipmentPackageRequest request) {
        if (request.getStatus() == ShipmentPackageStatus.DELIVERED &&
                shipmentPackage.getPaymentMode() == ShipmentPackagePaymentMode.COD) {
            if (request.getCollectedAmount() == null) {
                throw new IllegalArgumentException("collectedAmount es obligatorio para entregas COD");
            }

            if (request.getCollectedAmount().signum() < 0) {
                throw new IllegalArgumentException("collectedAmount no puede ser negativo");
            }

            return;
        }

        if (request.getCollectedAmount() != null && request.getCollectedAmount().signum() < 0) {
            throw new IllegalArgumentException("collectedAmount no puede ser negativo");
        }
    }

    private void refreshShipmentStatus(Shipment shipment) {
        List<ShipmentPackage> packages = shipmentPackageRepository.findByShipmentIdOrderByIdAsc(shipment.getId());

        boolean hasPending = packages.stream()
                .anyMatch(p -> p.getStatus() == ShipmentPackageStatus.PENDING);

        if (hasPending) {
            shipment.setStatus(ShipmentStatus.OUT_FOR_DELIVERY);
            repository.save(shipment);
            return;
        }

        boolean allDelivered = packages.stream()
                .allMatch(p -> p.getStatus() == ShipmentPackageStatus.DELIVERED);

        if (allDelivered) {
            shipment.setStatus(ShipmentStatus.DELIVERED);
        } else {
            shipment.setStatus(ShipmentStatus.CLOSED_WITH_INCIDENTS);
        }

        repository.save(shipment);
    }

    private ShipmentResponse toResponse(Shipment shipment) {
        return new ShipmentResponse(
                shipment.getId(),
                shipment.getFolio(),
                shipment.getBranch().getId(),
                shipment.getBranch().getCode(),
                shipment.getDeliveryType().name(),
                shipment.getStatus().name(),
                shipment.getGuideReference(),
                shipment.getCreatedAt(),
                shipment.getCreatedByUserId(),
                shipment.getDispatchedAt(),
                shipment.getDispatchedByUserId(),
                shipment.getCancelledAt(),
                shipment.getCancelledByUserId(),
                shipmentPackageRepository.countByShipmentId(shipment.getId())
        );
    }

    private String cleanNullable(String value) {
        if (value == null) {
            return null;
        }

        String cleaned = value.trim();
        return cleaned.isBlank() ? null : cleaned;
    }

    private void assertCanManageShipments() {
        accessService.assertCan(currentUser.getUserId(), PermissionCode.MANAGE_SHIPMENTS);
    }

    private boolean deliveryTypeRequiresAddress(CustomerPackageDeliveryType deliveryType) {
        return deliveryType == CustomerPackageDeliveryType.PARCEL_SERVICE
                || deliveryType == CustomerPackageDeliveryType.LOCAL_DELIVERY
                || deliveryType == CustomerPackageDeliveryType.COLLECT_SHIPPING;
    }

    private ShipmentDetailResponse.PackageLine toPackageLine(ShipmentPackage shipmentPackage) {
        CustomerPackage customerPackage = customerPackageRepository.findById(shipmentPackage.getCustomerPackageId())
                .orElseThrow(() -> new IllegalArgumentException("Paquete no encontrado"));
        CustomerAddress address = shipmentPackage.getDeliveryAddressId() == null
                ? null
                : customerAddressRepository.findById(shipmentPackage.getDeliveryAddressId())
                .orElseThrow(() -> new IllegalArgumentException("Direccion no encontrada"));

        return new ShipmentDetailResponse.PackageLine(
                shipmentPackage.getId(),
                customerPackage.getId(),
                customerPackage.getFolio(),
                customerPackage.getCustomer().getId(),
                customerPackage.getCustomer().getName(),
                address != null ? address.getId() : null,
                resolveDeliveryAddressLabel(customerPackage, address),
                customerPackage.getDeliveryType() != null ? customerPackage.getDeliveryType().name() : null,
                customerPackage.getShippingAddressSource() != null ? customerPackage.getShippingAddressSource().name() : null,
                customerPackage.getShipToName(),
                customerPackage.getShipToPhone(),
                resolveDeliveryAddressText(customerPackage, address),
                customerPackage.getShipToReferences(),
                customerPackage.isShippingCostConfirmed() ? customerPackage.getShippingCostAmount() : null,
                customerPackage.isShippingCostWaived(),
                customerPackage.isShippingCollect(),
                customerPackage.isCustomerProvidedLabel(),
                shipmentPackage.getPaymentMode().name(),
                shipmentPackage.getExpectedCollectionAmount(),
                shipmentPackage.getStatus().name(),
                shipmentPackage.getCollectedAmount(),
                shipmentPackage.getCollectionDifference(),
                shipmentPackage.getCollectionStatus() != null ? shipmentPackage.getCollectionStatus().name() : null,
                shipmentPackage.getCollectionNotes(),
                shipmentPackage.getDeliveryConfirmedByUserId(),
                shipmentPackage.getDeliveredAt(),
                shipmentPackage.getReturnedAt()
        );
    }

    private String resolveDeliveryAddressLabel(CustomerPackage customerPackage, CustomerAddress address) {
        if (address != null) {
            return address.getLabel();
        }

        if (customerPackage.getDeliveryType() == CustomerPackageDeliveryType.STORE_PICKUP) {
            return "Recoleccion en tienda";
        }

        if (customerPackage.getDeliveryType() == CustomerPackageDeliveryType.CUSTOMER_PROVIDED_LABEL) {
            return "Guia proporcionada por cliente";
        }

        if (customerPackage.getDeliveryType() == CustomerPackageDeliveryType.COLLECT_SHIPPING) {
            return "Envio por cobrar";
        }

        return "Direccion del paquete";
    }

    private String resolveDeliveryAddressText(CustomerPackage customerPackage, CustomerAddress address) {
        if (address != null) {
            return joinAddress(address.getLine1(), address.getLine2(), address.getCity(), address.getState(), address.getPostalCode(), address.getCountry());
        }

        return joinAddress(
                customerPackage.getShipToLine1(),
                customerPackage.getShipToLine2(),
                customerPackage.getShipToCity(),
                customerPackage.getShipToState(),
                customerPackage.getShipToPostalCode(),
                customerPackage.getShipToCountry()
        );
    }

    private String joinAddress(String... parts) {
        StringBuilder builder = new StringBuilder();
        for (String part : parts) {
            String cleaned = cleanNullable(part);
            if (cleaned == null) {
                continue;
            }
            if (!builder.isEmpty()) {
                builder.append(", ");
            }
            builder.append(cleaned);
        }
        return builder.isEmpty() ? null : builder.toString();
    }

    private String generateUniqueFolio() {
        String candidate;
        do {
            candidate = "SHP-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS"));
        } while (repository.existsByFolio(candidate));
        return candidate;
    }
}
