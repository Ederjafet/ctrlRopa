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
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class ShipmentService {

    private final ShipmentRepository repository;
    private final ShipmentPackageRepository shipmentPackageRepository;
    private final ShipmentCostShareRepository shipmentCostShareRepository;
    private final ShipmentPaymentRepository shipmentPaymentRepository;
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
                           ShipmentCostShareRepository shipmentCostShareRepository,
                           ShipmentPaymentRepository shipmentPaymentRepository,
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
        this.shipmentCostShareRepository = shipmentCostShareRepository;
        this.shipmentPaymentRepository = shipmentPaymentRepository;
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
        if (request.getCustomerPackageId() == null) {
            throw new IllegalArgumentException("No se puede crear un envio sin paquete asociado.");
        }

        Branch branch = branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new IllegalArgumentException("Sucursal no encontrada"));
        tenantAccessGuard.requireBranch(branch.getId(), "La sucursal del envio no pertenece al tenant activo");

        CustomerPackage initialPackage = customerPackageRepository.findById(request.getCustomerPackageId())
                .orElseThrow(() -> new IllegalArgumentException("Paquete no encontrado"));
        tenantAccessGuard.requireBranch(initialPackage.getBranch().getId(), "El paquete no pertenece a la sucursal activa");

        String effectiveGuide = firstNonBlank(request.getGuideReference(), initialPackage.getTrackingNumber());
        if (request.getDeliveryType() == ShipmentDeliveryType.CARRIER && effectiveGuide == null) {
            throw new IllegalArgumentException("La guia o referencia es obligatoria para envios por paqueteria");
        }

        Shipment shipment = new Shipment();
        shipment.setFolio(generateUniqueFolio());
        shipment.setBranch(branch);
        shipment.setDeliveryType(request.getDeliveryType());
        shipment.setGuideReference(effectiveGuide);
        shipment.setStatus(ShipmentStatus.OPEN);
        shipment.setCreatedByUserId(request.getCreatedByUserId());
        applyInitialShipmentLogistics(shipment, request, initialPackage);

        Shipment savedShipment = repository.save(shipment);

        AddShipmentPackageRequest addRequest = new AddShipmentPackageRequest();
        addRequest.setCustomerPackageId(request.getCustomerPackageId());
        addRequest.setDeliveryAddressId(request.getDeliveryAddressId());
        addRequest.setPaymentMode(request.getPaymentMode() != null ? request.getPaymentMode() : ShipmentPackagePaymentMode.PREPAID);
        addRequest.setExpectedCodAmount(request.getExpectedCodAmount());
        addPackageToShipment(savedShipment, addRequest);

        return toResponse(savedShipment);
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

        LogisticsView logistics = resolveLogisticsView(shipment, shipmentPackageRepository.findByShipmentIdOrderByIdAsc(shipmentId));

        return new ShipmentDetailResponse(
                shipment.getId(),
                shipment.getFolio(),
                shipment.getBranch().getId(),
                shipment.getBranch().getCode(),
                shipment.getDeliveryType().name(),
                shipment.getStatus().name(),
                shipment.getGuideReference(),
                logistics.recipientName,
                logistics.recipientPhone,
                logistics.destinationSummary,
                logistics.destinationCity,
                logistics.destinationState,
                logistics.destinationPostalCode,
                logistics.shippingCarrier,
                logistics.realShippingCost,
                logistics.shippingNotes,
                logistics.source,
                logistics.warning,
                shipment.getQuotedAt(),
                shipment.getReadyAt(),
                shipment.getReceivedAt(),
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

        addPackageToShipment(shipment, request);

        return findDetail(shipmentId);
    }

    @Transactional(readOnly = true)
    public ShipmentCostShareResponse getCostShares(Long shipmentId) {
        assertCanManageShipments();
        Shipment shipment = findShipment(shipmentId);
        List<ShipmentPackage> packages = shipmentPackageRepository.findByShipmentIdOrderByIdAsc(shipmentId);
        List<ShipmentCostShare> shares = shipmentCostShareRepository.findByShipmentIdOrderByIdAsc(shipmentId);
        return toCostShareResponse(shipment, packages, shares, resolveShareMethod(shares));
    }

    public ShipmentCostShareResponse updateCostShares(Long shipmentId, ShipmentCostShareRequest request) {
        assertCanManageShipments();
        Shipment shipment = findShipment(shipmentId);

        if (shipment.getStatus() == ShipmentStatus.CANCELLED
                || shipment.getStatus() == ShipmentStatus.DELIVERED
                || shipment.getStatus() == ShipmentStatus.CLOSED_WITH_INCIDENTS) {
            throw new IllegalArgumentException("No se puede modificar el reparto de un envio finalizado o cancelado.");
        }
        List<ShipmentPayment> existingShippingPayments = shipmentPaymentRepository.findByShipmentIdOrderByRegisteredAtDescIdDesc(shipmentId);
        if (existingShippingPayments != null && !existingShippingPayments.isEmpty()) {
            throw new IllegalArgumentException("No se puede modificar el reparto porque ya existen pagos de envio registrados o cancelados.");
        }

        BigDecimal realShippingCost = normalizeMoney(shipment.getRealShippingCost());
        if (realShippingCost != null && realShippingCost.signum() < 0) {
            throw new IllegalArgumentException("El costo real del envio no puede ser negativo.");
        }

        List<ShipmentPackage> packages = shipmentPackageRepository.findByShipmentIdOrderByIdAsc(shipmentId);
        if (packages.isEmpty()) {
            throw new IllegalArgumentException("El envio debe tener paquetes para repartir costo.");
        }

        ShipmentCostShareMethod method = request != null && request.getShareMethod() != null
                ? request.getShareMethod()
                : ShipmentCostShareMethod.MANUAL;
        List<ShipmentCostShare> newShares = buildCostShares(shipment, packages, method, request, realShippingCost);

        shipmentCostShareRepository.deleteByShipmentId(shipmentId);
        List<ShipmentCostShare> savedShares = shipmentCostShareRepository.saveAll(newShares);
        return toCostShareResponse(shipment, packages, savedShares, method);
    }

    @Transactional(readOnly = true)
    public ShipmentPaymentsResponse getShippingPayments(Long shipmentId) {
        assertCanManageShipments();
        Shipment shipment = findShipment(shipmentId);
        List<ShipmentCostShare> shares = shipmentCostShareRepository.findByShipmentIdOrderByIdAsc(shipmentId);
        List<ShipmentPayment> payments = shipmentPaymentRepository.findByShipmentIdOrderByRegisteredAtDescIdDesc(shipmentId);
        return toShippingPaymentsResponse(shipment, shares, payments);
    }

    public ShipmentPaymentsResponse registerShippingPayment(Long shipmentId, RegisterShipmentPaymentRequest request) {
        assertCanManageShipments();
        Shipment shipment = findShipment(shipmentId);
        if (shipment.getStatus() == ShipmentStatus.CANCELLED) {
            throw new IllegalArgumentException("No se pueden registrar pagos de envio en un envio cancelado.");
        }
        if (request == null) {
            throw new IllegalArgumentException("La solicitud de pago de envio es obligatoria.");
        }

        BigDecimal amount = normalizeMoney(request.getAmount());
        if (amount == null || amount.signum() <= 0) {
            throw new IllegalArgumentException("El pago de envio debe ser mayor a cero.");
        }

        List<ShipmentCostShare> shares = shipmentCostShareRepository.findByShipmentIdOrderByIdAsc(shipmentId);
        ShipmentCostShare share = findRequestedShare(shipmentId, request, shares);
        if (request.getPackageId() != null && !request.getPackageId().equals(share.getCustomerPackageId())) {
            throw new IllegalArgumentException("El paquete indicado no coincide con el reparto de envio.");
        }
        if (request.getCustomerId() != null && !request.getCustomerId().equals(share.getCustomerId())) {
            throw new IllegalArgumentException("El cliente indicado no coincide con el reparto de envio.");
        }
        List<ShipmentPayment> currentPayments = shipmentPaymentRepository.findByShipmentIdOrderByRegisteredAtDescIdDesc(shipmentId);
        BigDecimal paidForShare = sumRegisteredPaymentsForShare(currentPayments, share.getId());
        BigDecimal assignedAmount = normalizeMoneyOrZero(share.getAssignedAmount());
        BigDecimal balanceAmount = assignedAmount.subtract(paidForShare).setScale(2, RoundingMode.HALF_UP);
        if (amount.compareTo(balanceAmount) > 0) {
            throw new IllegalArgumentException("El pago de envio no puede exceder el saldo asignado.");
        }

        Map<Long, String> customerNames = resolveCustomerNames(shares);
        Long paidByCustomerId = request.getPaidByCustomerId() != null ? request.getPaidByCustomerId() : share.getCustomerId();
        if (paidByCustomerId != null && !customerNames.containsKey(paidByCustomerId)) {
            throw new IllegalArgumentException("El cliente que pago no pertenece al envio.");
        }

        ShipmentPayment payment = new ShipmentPayment();
        payment.setShipmentId(shipmentId);
        payment.setCostShareId(share.getId());
        payment.setPackageId(share.getCustomerPackageId());
        payment.setCustomerId(share.getCustomerId());
        payment.setPaidByCustomerId(paidByCustomerId);
        payment.setAmount(amount);
        payment.setPaymentMethod(cleanNullable(request.getPaymentMethod()));
        payment.setReference(cleanNullable(request.getReference()));
        payment.setNotes(cleanNullable(request.getNotes()));
        payment.setStatus(ShipmentPaymentStatus.REGISTERED);
        payment.setRegisteredAt(request.getRegisteredAt() != null ? request.getRegisteredAt() : LocalDateTime.now());
        payment.setRegisteredBy(currentUser.getUserId());
        shipmentPaymentRepository.save(payment);

        return getShippingPayments(shipmentId);
    }

    public ShipmentPaymentsResponse cancelShippingPayment(Long shipmentId, Long paymentId, CancelShipmentPaymentRequest request) {
        assertCanManageShipments();
        findShipment(shipmentId);
        ShipmentPayment payment = shipmentPaymentRepository.findByShipmentIdAndId(shipmentId, paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Pago de envio no encontrado."));
        if (payment.getStatus() == ShipmentPaymentStatus.CANCELLED) {
            throw new IllegalArgumentException("El pago de envio ya esta cancelado.");
        }

        payment.setStatus(ShipmentPaymentStatus.CANCELLED);
        payment.setCancelledAt(request != null && request.getCancelledAt() != null ? request.getCancelledAt() : LocalDateTime.now());
        payment.setCancelledBy(currentUser.getUserId());
        payment.setCancelReason(request != null ? cleanNullable(request.getCancelReason()) : null);
        shipmentPaymentRepository.save(payment);

        return getShippingPayments(shipmentId);
    }
    public ShipmentDetailResponse updateLogistics(Long shipmentId, UpdateShipmentLogisticsRequest request) {
        assertCanManageShipments();
        Shipment shipment = findShipment(shipmentId);

        if (shipment.getStatus() == ShipmentStatus.CANCELLED
                || shipment.getStatus() == ShipmentStatus.DELIVERED
                || shipment.getStatus() == ShipmentStatus.CLOSED_WITH_INCIDENTS) {
            throw new IllegalArgumentException("No se pueden editar datos logisticos de un envio finalizado o cancelado.");
        }

        if (request.getRealShippingCost() != null && request.getRealShippingCost().signum() < 0) {
            throw new IllegalArgumentException("El costo real del envio no puede ser negativo.");
        }

        if (request.getDeliveryType() != null) {
            shipment.setDeliveryType(request.getDeliveryType());
        }
        shipment.setRecipientName(cleanNullable(request.getRecipientName()));
        shipment.setRecipientPhone(cleanNullable(request.getRecipientPhone()));
        shipment.setDestinationSummary(cleanNullable(request.getDestinationSummary()));
        shipment.setDestinationCity(cleanNullable(request.getDestinationCity()));
        shipment.setDestinationState(cleanNullable(request.getDestinationState()));
        shipment.setDestinationPostalCode(cleanNullable(request.getDestinationPostalCode()));
        shipment.setShippingCarrier(cleanNullable(request.getShippingCarrier()));
        shipment.setGuideReference(cleanNullable(request.getTrackingNumber()));
        shipment.setRealShippingCost(request.getRealShippingCost());
        shipment.setShippingNotes(cleanNullable(request.getShippingNotes()));

        if (request.getQuotedAt() != null) {
            shipment.setQuotedAt(request.getQuotedAt());
        } else if (request.getRealShippingCost() != null && shipment.getQuotedAt() == null) {
            shipment.setQuotedAt(LocalDateTime.now());
        } else if (request.getRealShippingCost() == null) {
            shipment.setQuotedAt(null);
        }

        boolean isReady = cleanNullable(shipment.getDestinationSummary()) != null
                && (shipment.getDeliveryType() != ShipmentDeliveryType.CARRIER || cleanNullable(shipment.getGuideReference()) != null);
        if (request.getReadyAt() != null) {
            shipment.setReadyAt(request.getReadyAt());
        } else if (isReady && shipment.getReadyAt() == null) {
            shipment.setReadyAt(LocalDateTime.now());
        } else if (!isReady) {
            shipment.setReadyAt(null);
        }

        repository.save(shipment);
        return findDetail(shipmentId);
    }

    private void addPackageToShipment(Shipment shipment, AddShipmentPackageRequest request) {
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
            throw new IllegalArgumentException("No se puede despachar un shipment vacio");
        }

        LogisticsView logistics = resolveLogisticsView(shipment, packages);
        if ("MIXED_LEGACY".equals(logistics.source)) {
            throw new IllegalArgumentException("Este envio tiene datos legacy diferentes entre paquetes. Define una direccion del envio antes de marcarlo enviado.");
        }
        if (cleanNullable(logistics.destinationSummary) == null) {
            throw new IllegalArgumentException("Define la direccion o destino del envio antes de marcarlo enviado.");
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

        if (shipment.getReadyAt() == null) {
            shipment.setReadyAt(LocalDateTime.now());
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

    public ShipmentDetailResponse confirmReceived(Long shipmentId, ConfirmShipmentReceivedRequest request) {
        assertCanManageShipments();
        Shipment shipment = findShipment(shipmentId);

        if (shipment.getStatus() == ShipmentStatus.DELIVERED) {
            throw new IllegalArgumentException("Este envio ya fue confirmado como recibido.");
        }

        if (shipment.getStatus() == ShipmentStatus.CANCELLED) {
            throw new IllegalArgumentException("No puedes confirmar un envio cancelado.");
        }

        if (shipment.getStatus() == ShipmentStatus.CLOSED_WITH_INCIDENTS) {
            throw new IllegalArgumentException("No puedes confirmar recibido en un envio cerrado con incidencias.");
        }

        if (shipment.getStatus() != ShipmentStatus.OUT_FOR_DELIVERY) {
            throw new IllegalArgumentException("El envio debe estar marcado como enviado antes de confirmar recibido.");
        }

        List<ShipmentPackage> packages = shipmentPackageRepository.findByShipmentIdOrderByIdAsc(shipmentId);
        if (packages.isEmpty()) {
            throw new IllegalArgumentException("El envio no tiene paquetes relacionados.");
        }

        List<ShipmentPackage> pendingPackages = packages.stream()
                .filter(sp -> sp.getStatus() == ShipmentPackageStatus.PENDING)
                .toList();

        if (pendingPackages.isEmpty()) {
            throw new IllegalArgumentException("Este envio ya no tiene paquetes pendientes por recibir.");
        }

        boolean hasCodPackage = pendingPackages.stream()
                .anyMatch(sp -> sp.getPaymentMode() == ShipmentPackagePaymentMode.COD);
        if (hasCodPackage) {
            throw new IllegalArgumentException("Este envio tiene cobro contra entrega. Resuelve la entrega capturando el monto cobrado.");
        }

        LocalDateTime receivedAt = request.getReceivedAt() != null
                ? request.getReceivedAt()
                : LocalDateTime.now();
        String notes = cleanNullable(request.getNotes());

        for (ShipmentPackage shipmentPackage : pendingPackages) {
            CustomerPackage customerPackage = customerPackageRepository.findById(shipmentPackage.getCustomerPackageId())
                    .orElseThrow(() -> new IllegalArgumentException("Paquete no encontrado"));

            shipmentPackage.setStatus(ShipmentPackageStatus.DELIVERED);
            shipmentPackage.setCollectedAmount(BigDecimal.ZERO);
            shipmentPackage.setCollectionDifference(BigDecimal.ZERO);
            shipmentPackage.setCollectionStatus(CollectionStatus.BALANCED);
            shipmentPackage.setCollectionNotes(notes);
            shipmentPackage.setDeliveryConfirmedByUserId(request.getDeliveryConfirmedByUserId());
            shipmentPackage.setDeliveredAt(receivedAt);

            customerPackage.setStatus(CustomerPackageStatus.DELIVERED);

            shipmentPackageRepository.save(shipmentPackage);
            customerPackageRepository.save(customerPackage);
        }

        refreshShipmentStatus(shipment);

        return findDetail(shipmentId);
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

    private List<ShipmentCostShare> buildCostShares(Shipment shipment,
            List<ShipmentPackage> packages,
            ShipmentCostShareMethod method,
            ShipmentCostShareRequest request,
            BigDecimal realShippingCost) {
        if ((method == ShipmentCostShareMethod.EQUAL_SPLIT || method == ShipmentCostShareMethod.STORE_ABSORBED)
                && realShippingCost == null) {
            throw new IllegalArgumentException("Captura el costo real del envio antes de calcular el reparto.");
        }

        if (method == ShipmentCostShareMethod.EQUAL_SPLIT) {
            return buildEqualSplitShares(shipment, packages, realShippingCost);
        }

        if (method == ShipmentCostShareMethod.STORE_ABSORBED) {
            return packages.stream()
                    .map(sp -> newCostShare(shipment, sp, BigDecimal.ZERO, method, null))
                    .toList();
        }

        Map<Long, ShipmentCostShareLineRequest> requestedByPackage = new HashMap<>();
        if (request != null && request.getShares() != null) {
            for (ShipmentCostShareLineRequest line : request.getShares()) {
                if (line.getPackageId() == null) {
                    throw new IllegalArgumentException("El reparto debe indicar el paquete.");
                }
                requestedByPackage.put(line.getPackageId(), line);
            }
        }

        List<ShipmentCostShare> result = new ArrayList<>();
        for (ShipmentPackage shipmentPackage : packages) {
            ShipmentCostShareLineRequest line = requestedByPackage.remove(shipmentPackage.getCustomerPackageId());
            BigDecimal assignedAmount = line != null ? normalizeMoneyOrZero(line.getAssignedAmount()) : BigDecimal.ZERO.setScale(2);
            if (assignedAmount.signum() < 0) {
                throw new IllegalArgumentException("El monto asignado no puede ser negativo.");
            }
            result.add(newCostShare(shipment, shipmentPackage, assignedAmount, method, line != null ? line.getNotes() : null));
        }

        if (!requestedByPackage.isEmpty()) {
            throw new IllegalArgumentException("El reparto incluye paquetes que no pertenecen al envio.");
        }

        return result;
    }

    private List<ShipmentCostShare> buildEqualSplitShares(Shipment shipment,
            List<ShipmentPackage> packages,
            BigDecimal realShippingCost) {
        long totalCents = realShippingCost.movePointRight(2).setScale(0, RoundingMode.HALF_UP).longValueExact();
        long baseCents = totalCents / packages.size();
        long remainderCents = totalCents % packages.size();

        List<ShipmentCostShare> result = new ArrayList<>();
        for (int index = 0; index < packages.size(); index++) {
            long cents = baseCents + (index == packages.size() - 1 ? remainderCents : 0L);
            BigDecimal amount = BigDecimal.valueOf(cents, 2).setScale(2, RoundingMode.HALF_UP);
            result.add(newCostShare(shipment, packages.get(index), amount, ShipmentCostShareMethod.EQUAL_SPLIT, null));
        }
        return result;
    }

    private ShipmentCostShare newCostShare(Shipment shipment,
            ShipmentPackage shipmentPackage,
            BigDecimal assignedAmount,
            ShipmentCostShareMethod method,
            String notes) {
        ShipmentCostShare share = new ShipmentCostShare();
        share.setShipmentId(shipment.getId());
        share.setCustomerPackageId(shipmentPackage.getCustomerPackageId());
        share.setCustomerId(shipmentPackage.getCustomerId());
        share.setAssignedAmount(normalizeMoneyOrZero(assignedAmount));
        share.setShareMethod(method);
        share.setNotes(cleanNullable(notes));
        share.setCreatedByUserId(currentUser.getUserId());
        share.setUpdatedByUserId(currentUser.getUserId());
        return share;
    }

    private ShipmentCostShareResponse toCostShareResponse(Shipment shipment,
            List<ShipmentPackage> packages,
            List<ShipmentCostShare> shares,
            ShipmentCostShareMethod method) {
        Map<Long, ShipmentCostShare> sharesByPackage = new HashMap<>();
        for (ShipmentCostShare share : shares) {
            sharesByPackage.put(share.getCustomerPackageId(), share);
        }

        List<ShipmentCostShareLineResponse> lines = packages.stream()
                .map(sp -> toCostShareLineResponse(sp, sharesByPackage.get(sp.getCustomerPackageId())))
                .toList();
        BigDecimal assignedTotal = lines.stream()
                .map(ShipmentCostShareLineResponse::getAssignedAmount)
                .reduce(BigDecimal.ZERO.setScale(2), BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal realShippingCost = normalizeMoney(shipment.getRealShippingCost());
        BigDecimal absorbedAmount = BigDecimal.ZERO.setScale(2);
        BigDecimal overAssignedAmount = BigDecimal.ZERO.setScale(2);
        if (realShippingCost != null) {
            int comparison = assignedTotal.compareTo(realShippingCost);
            if (comparison < 0) {
                absorbedAmount = realShippingCost.subtract(assignedTotal).setScale(2, RoundingMode.HALF_UP);
            } else if (comparison > 0) {
                overAssignedAmount = assignedTotal.subtract(realShippingCost).setScale(2, RoundingMode.HALF_UP);
            }
        }

        return new ShipmentCostShareResponse(
                shipment.getId(),
                realShippingCost,
                method != null ? method.name() : null,
                assignedTotal,
                absorbedAmount,
                overAssignedAmount,
                lines
        );
    }

    private ShipmentCostShareLineResponse toCostShareLineResponse(ShipmentPackage shipmentPackage, ShipmentCostShare share) {
        CustomerPackage customerPackage = customerPackageRepository.findById(shipmentPackage.getCustomerPackageId())
                .orElseThrow(() -> new IllegalArgumentException("Paquete no encontrado"));
        BigDecimal assignedAmount = share != null ? normalizeMoneyOrZero(share.getAssignedAmount()) : BigDecimal.ZERO.setScale(2);
        return new ShipmentCostShareLineResponse(
                customerPackage.getId(),
                customerPackage.getFolio(),
                customerPackage.getCustomer().getId(),
                customerPackage.getCustomer().getName(),
                assignedAmount,
                share != null ? share.getNotes() : null
        );
    }

    private ShipmentCostShareMethod resolveShareMethod(List<ShipmentCostShare> shares) {
        return shares.stream()
                .findFirst()
                .map(ShipmentCostShare::getShareMethod)
                .orElse(null);
    }

    private BigDecimal normalizeMoney(BigDecimal amount) {
        return amount != null ? amount.setScale(2, RoundingMode.HALF_UP) : null;
    }

    private BigDecimal normalizeMoneyOrZero(BigDecimal amount) {
        return amount != null ? normalizeMoney(amount) : BigDecimal.ZERO.setScale(2);
    }
    private ShipmentCostShare findRequestedShare(Long shipmentId,
            RegisterShipmentPaymentRequest request,
            List<ShipmentCostShare> shares) {
        if (shares.isEmpty()) {
            throw new IllegalArgumentException("Primero define el reparto del costo de envio.");
        }

        if (request.getCostShareId() != null) {
            return shares.stream()
                    .filter(share -> request.getCostShareId().equals(share.getId()))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("El reparto indicado no pertenece al envio."));
        }

        if (request.getPackageId() != null) {
            return shares.stream()
                    .filter(share -> request.getPackageId().equals(share.getCustomerPackageId()))
                    .filter(share -> request.getCustomerId() == null || request.getCustomerId().equals(share.getCustomerId()))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("El reparto indicado no pertenece al envio."));
        }

        throw new IllegalArgumentException("Indica el reparto o paquete al que se aplica el pago de envio.");
    }

    private ShipmentPaymentsResponse toShippingPaymentsResponse(Shipment shipment,
            List<ShipmentCostShare> shares,
            List<ShipmentPayment> payments) {
        Map<Long, String> packageReferences = resolvePackageReferences(shares);
        Map<Long, String> customerNames = resolveCustomerNames(shares);
        Map<Long, List<ShipmentPayment>> paymentsByShare = new HashMap<>();
        for (ShipmentPayment payment : payments) {
            paymentsByShare.computeIfAbsent(payment.getCostShareId(), key -> new ArrayList<>()).add(payment);
        }

        List<ShipmentPaymentShareResponse> shareResponses = shares.stream()
                .map(share -> toShippingPaymentShareResponse(share,
                        packageReferences,
                        customerNames,
                        paymentsByShare.getOrDefault(share.getId(), List.of())))
                .toList();

        BigDecimal assignedTotal = shareResponses.stream()
                .map(ShipmentPaymentShareResponse::getAssignedAmount)
                .reduce(BigDecimal.ZERO.setScale(2), BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal paidTotal = shareResponses.stream()
                .map(ShipmentPaymentShareResponse::getPaidAmount)
                .reduce(BigDecimal.ZERO.setScale(2), BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal shippingBalance = assignedTotal.subtract(paidTotal).setScale(2, RoundingMode.HALF_UP);

        BigDecimal realShippingCost = normalizeMoney(shipment.getRealShippingCost());
        BigDecimal absorbedAmount = BigDecimal.ZERO.setScale(2);
        BigDecimal overAssignedAmount = BigDecimal.ZERO.setScale(2);
        if (realShippingCost != null) {
            int comparison = assignedTotal.compareTo(realShippingCost);
            if (comparison < 0) {
                absorbedAmount = realShippingCost.subtract(assignedTotal).setScale(2, RoundingMode.HALF_UP);
            } else if (comparison > 0) {
                overAssignedAmount = assignedTotal.subtract(realShippingCost).setScale(2, RoundingMode.HALF_UP);
            }
        }

        List<ShipmentPaymentLineResponse> paymentResponses = payments.stream()
                .map(payment -> toShipmentPaymentLineResponse(payment, packageReferences, customerNames))
                .toList();

        return new ShipmentPaymentsResponse(
                shipment.getId(),
                realShippingCost,
                assignedTotal,
                paidTotal,
                shippingBalance,
                absorbedAmount,
                overAssignedAmount,
                shareResponses,
                paymentResponses
        );
    }

    private ShipmentPaymentShareResponse toShippingPaymentShareResponse(ShipmentCostShare share,
            Map<Long, String> packageReferences,
            Map<Long, String> customerNames,
            List<ShipmentPayment> payments) {
        List<ShipmentPaymentLineResponse> paymentResponses = payments.stream()
                .map(payment -> toShipmentPaymentLineResponse(payment, packageReferences, customerNames))
                .toList();
        BigDecimal paidAmount = sumRegisteredPaymentsForShare(payments, share.getId());
        BigDecimal assignedAmount = normalizeMoneyOrZero(share.getAssignedAmount());
        BigDecimal balanceAmount = assignedAmount.subtract(paidAmount).setScale(2, RoundingMode.HALF_UP);
        return new ShipmentPaymentShareResponse(
                share.getId(),
                share.getCustomerPackageId(),
                packageReferences.getOrDefault(share.getCustomerPackageId(), "Paquete #" + share.getCustomerPackageId()),
                share.getCustomerId(),
                customerNames.getOrDefault(share.getCustomerId(), "Cliente #" + share.getCustomerId()),
                assignedAmount,
                paidAmount,
                balanceAmount,
                paymentResponses
        );
    }

    private ShipmentPaymentLineResponse toShipmentPaymentLineResponse(ShipmentPayment payment,
            Map<Long, String> packageReferences,
            Map<Long, String> customerNames) {
        return new ShipmentPaymentLineResponse(
                payment.getId(),
                payment.getCostShareId(),
                payment.getPackageId(),
                packageReferences.getOrDefault(payment.getPackageId(), "Paquete #" + payment.getPackageId()),
                payment.getCustomerId(),
                customerNames.getOrDefault(payment.getCustomerId(), "Cliente #" + payment.getCustomerId()),
                payment.getPaidByCustomerId(),
                payment.getPaidByCustomerId() != null ? customerNames.getOrDefault(payment.getPaidByCustomerId(), "Cliente #" + payment.getPaidByCustomerId()) : null,
                normalizeMoneyOrZero(payment.getAmount()),
                payment.getPaymentMethod(),
                payment.getReference(),
                payment.getNotes(),
                payment.getStatus() != null ? payment.getStatus().name() : null,
                payment.getRegisteredAt(),
                payment.getRegisteredBy(),
                payment.getCancelledAt(),
                payment.getCancelledBy(),
                payment.getCancelReason()
        );
    }

    private BigDecimal sumRegisteredPaymentsForShare(List<ShipmentPayment> payments, Long costShareId) {
        return payments.stream()
                .filter(payment -> payment.getStatus() == ShipmentPaymentStatus.REGISTERED)
                .filter(payment -> costShareId != null && costShareId.equals(payment.getCostShareId()))
                .map(ShipmentPayment::getAmount)
                .map(this::normalizeMoneyOrZero)
                .reduce(BigDecimal.ZERO.setScale(2), BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
    }

    private Map<Long, String> resolvePackageReferences(List<ShipmentCostShare> shares) {
        Map<Long, String> references = new HashMap<>();
        for (ShipmentCostShare share : shares) {
            CustomerPackage customerPackage = customerPackageRepository.findById(share.getCustomerPackageId())
                    .orElseThrow(() -> new IllegalArgumentException("Paquete no encontrado"));
            references.put(share.getCustomerPackageId(), customerPackage.getFolio());
        }
        return references;
    }

    private Map<Long, String> resolveCustomerNames(List<ShipmentCostShare> shares) {
        Map<Long, String> names = new HashMap<>();
        for (ShipmentCostShare share : shares) {
            CustomerPackage customerPackage = customerPackageRepository.findById(share.getCustomerPackageId())
                    .orElseThrow(() -> new IllegalArgumentException("Paquete no encontrado"));
            names.put(share.getCustomerId(), customerPackage.getCustomer().getName());
        }
        return names;
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
            if (shipment.getReceivedAt() == null) {
                shipment.setReceivedAt(LocalDateTime.now());
            }
        } else {
            shipment.setStatus(ShipmentStatus.CLOSED_WITH_INCIDENTS);
        }

        repository.save(shipment);
    }

    private void applyInitialShipmentLogistics(Shipment shipment, CreateShipmentRequest request, CustomerPackage initialPackage) {
        BigDecimal realShippingCost = request.getRealShippingCost() != null
                ? request.getRealShippingCost()
                : resolvePackageRealShippingCost(initialPackage);
        if (realShippingCost != null && realShippingCost.signum() < 0) {
            throw new IllegalArgumentException("El costo real del envio no puede ser negativo.");
        }

        shipment.setRecipientName(firstNonBlank(request.getRecipientName(), initialPackage.getShipToName(), initialPackage.getCustomer().getName()));
        shipment.setRecipientPhone(firstNonBlank(request.getRecipientPhone(), initialPackage.getShipToPhone(), initialPackage.getCustomer().getPhone()));
        shipment.setDestinationSummary(firstNonBlank(request.getDestinationSummary(), resolvePackageDestinationSummary(initialPackage)));
        shipment.setDestinationCity(firstNonBlank(request.getDestinationCity(), initialPackage.getShipToCity()));
        shipment.setDestinationState(firstNonBlank(request.getDestinationState(), initialPackage.getShipToState()));
        shipment.setDestinationPostalCode(firstNonBlank(request.getDestinationPostalCode(), initialPackage.getShipToPostalCode()));
        shipment.setShippingCarrier(firstNonBlank(request.getShippingCarrier(), initialPackage.getShippingCarrier()));
        shipment.setRealShippingCost(realShippingCost);
        shipment.setShippingNotes(firstNonBlank(request.getShippingNotes(), initialPackage.getShippingNotes()));

        if (realShippingCost != null) {
            shipment.setQuotedAt(LocalDateTime.now());
        }
        if (cleanNullable(shipment.getDestinationSummary()) != null
                && (shipment.getDeliveryType() != ShipmentDeliveryType.CARRIER || cleanNullable(shipment.getGuideReference()) != null)) {
            shipment.setReadyAt(LocalDateTime.now());
        }
    }

    private LogisticsView resolveLogisticsView(Shipment shipment, List<ShipmentPackage> packages) {
        CustomerPackage primaryPackage = packages.isEmpty()
                ? null
                : customerPackageRepository.findById(packages.get(0).getCustomerPackageId()).orElse(null);
        boolean hasShipmentLogistics = hasShipmentLogistics(shipment);
        boolean hasLegacyConflict = hasLegacyLogisticsConflict(packages);

        if (!hasShipmentLogistics && hasLegacyConflict) {
            return new LogisticsView(null, null, null, null, null, null, null, null, null, "MIXED_LEGACY",
                    "Este envio tiene datos legacy diferentes entre paquetes. Define una direccion del envio.");
        }

        String fallbackDestination = primaryPackage == null || hasLegacyConflict ? null : resolvePackageDestinationSummary(primaryPackage);
        String recipientName = firstNonBlank(shipment.getRecipientName(), primaryPackage != null && !hasLegacyConflict ? primaryPackage.getShipToName() : null, primaryPackage != null && !hasLegacyConflict ? primaryPackage.getCustomer().getName() : null);
        String recipientPhone = firstNonBlank(shipment.getRecipientPhone(), primaryPackage != null && !hasLegacyConflict ? primaryPackage.getShipToPhone() : null, primaryPackage != null && !hasLegacyConflict ? primaryPackage.getCustomer().getPhone() : null);
        String destinationSummary = firstNonBlank(shipment.getDestinationSummary(), fallbackDestination);
        String destinationCity = firstNonBlank(shipment.getDestinationCity(), primaryPackage != null && !hasLegacyConflict ? primaryPackage.getShipToCity() : null);
        String destinationState = firstNonBlank(shipment.getDestinationState(), primaryPackage != null && !hasLegacyConflict ? primaryPackage.getShipToState() : null);
        String destinationPostalCode = firstNonBlank(shipment.getDestinationPostalCode(), primaryPackage != null && !hasLegacyConflict ? primaryPackage.getShipToPostalCode() : null);
        String shippingCarrier = firstNonBlank(shipment.getShippingCarrier(), primaryPackage != null && !hasLegacyConflict ? primaryPackage.getShippingCarrier() : null);
        BigDecimal realShippingCost = shipment.getRealShippingCost() != null
                ? shipment.getRealShippingCost()
                : primaryPackage != null && !hasLegacyConflict ? resolvePackageRealShippingCost(primaryPackage) : null;
        String shippingNotes = firstNonBlank(shipment.getShippingNotes(), primaryPackage != null && !hasLegacyConflict ? primaryPackage.getShippingNotes() : null);

        boolean usedLegacy = !hasShipmentLogistics && primaryPackage != null;
        boolean usedPartialLegacy = hasShipmentLogistics && primaryPackage != null && !hasLegacyConflict
                && (cleanNullable(shipment.getDestinationSummary()) == null
                || cleanNullable(shipment.getRecipientName()) == null
                || cleanNullable(shipment.getShippingCarrier()) == null
                || shipment.getRealShippingCost() == null);
        String source = hasShipmentLogistics ? (usedPartialLegacy ? "SHIPMENT_WITH_LEGACY_FALLBACK" : "SHIPMENT") : (usedLegacy ? "LEGACY_PACKAGE" : "MISSING");
        String warning = null;
        if ("LEGACY_PACKAGE".equals(source)) {
            warning = "Datos logisticos tomados del paquete legacy. Define los datos del envio para convertirlo en fuente principal.";
        } else if ("SHIPMENT_WITH_LEGACY_FALLBACK".equals(source)) {
            warning = "El envio tiene datos propios, pero aun usa algunos datos legacy del paquete.";
        }

        return new LogisticsView(recipientName, recipientPhone, destinationSummary, destinationCity, destinationState,
                destinationPostalCode, shippingCarrier, realShippingCost, shippingNotes, source, warning);
    }

    private boolean hasShipmentLogistics(Shipment shipment) {
        return cleanNullable(shipment.getRecipientName()) != null
                || cleanNullable(shipment.getRecipientPhone()) != null
                || cleanNullable(shipment.getDestinationSummary()) != null
                || cleanNullable(shipment.getDestinationCity()) != null
                || cleanNullable(shipment.getDestinationState()) != null
                || cleanNullable(shipment.getDestinationPostalCode()) != null
                || cleanNullable(shipment.getShippingCarrier()) != null
                || shipment.getRealShippingCost() != null
                || cleanNullable(shipment.getShippingNotes()) != null;
    }

    private boolean hasLegacyLogisticsConflict(List<ShipmentPackage> packages) {
        String destination = null;
        String carrier = null;
        BigDecimal cost = null;

        for (ShipmentPackage shipmentPackage : packages) {
            CustomerPackage customerPackage = customerPackageRepository.findById(shipmentPackage.getCustomerPackageId()).orElse(null);
            if (customerPackage == null) {
                continue;
            }

            String currentDestination = cleanNullable(resolvePackageDestinationSummary(customerPackage));
            if (currentDestination != null) {
                if (destination != null && !destination.equalsIgnoreCase(currentDestination)) {
                    return true;
                }
                destination = currentDestination;
            }

            String currentCarrier = cleanNullable(customerPackage.getShippingCarrier());
            if (currentCarrier != null) {
                if (carrier != null && !carrier.equalsIgnoreCase(currentCarrier)) {
                    return true;
                }
                carrier = currentCarrier;
            }

            BigDecimal currentCost = resolvePackageRealShippingCost(customerPackage);
            if (currentCost != null) {
                if (cost != null && cost.compareTo(currentCost) != 0) {
                    return true;
                }
                cost = currentCost;
            }
        }

        return false;
    }

    private String resolvePackageDestinationSummary(CustomerPackage customerPackage) {
        String address = cleanNullable(resolveDeliveryAddressText(customerPackage, null));
        if (address != null) {
            return address;
        }
        return resolveDeliveryAddressLabel(customerPackage, null);
    }

    private BigDecimal resolvePackageRealShippingCost(CustomerPackage customerPackage) {
        if (!customerPackage.isShippingCostConfirmed()) {
            return null;
        }
        if (customerPackage.isShippingCostWaived()) {
            return BigDecimal.ZERO;
        }
        if (customerPackage.isShippingCollect() || customerPackage.isCustomerProvidedLabel()) {
            return null;
        }
        return customerPackage.getShippingCostAmount();
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            String cleaned = cleanNullable(value);
            if (cleaned != null) {
                return cleaned;
            }
        }
        return null;
    }

    private static class LogisticsView {
        private final String recipientName;
        private final String recipientPhone;
        private final String destinationSummary;
        private final String destinationCity;
        private final String destinationState;
        private final String destinationPostalCode;
        private final String shippingCarrier;
        private final BigDecimal realShippingCost;
        private final String shippingNotes;
        private final String source;
        private final String warning;

        private LogisticsView(String recipientName,
                              String recipientPhone,
                              String destinationSummary,
                              String destinationCity,
                              String destinationState,
                              String destinationPostalCode,
                              String shippingCarrier,
                              BigDecimal realShippingCost,
                              String shippingNotes,
                              String source,
                              String warning) {
            this.recipientName = recipientName;
            this.recipientPhone = recipientPhone;
            this.destinationSummary = destinationSummary;
            this.destinationCity = destinationCity;
            this.destinationState = destinationState;
            this.destinationPostalCode = destinationPostalCode;
            this.shippingCarrier = shippingCarrier;
            this.realShippingCost = realShippingCost;
            this.shippingNotes = shippingNotes;
            this.source = source;
            this.warning = warning;
        }
    }
    private ShipmentResponse toResponse(Shipment shipment) {
        List<ShipmentPackage> packages = shipmentPackageRepository.findByShipmentIdOrderByIdAsc(shipment.getId());
        ShipmentPackage primaryPackageLine = packages.isEmpty() ? null : packages.get(0);
        CustomerPackage primaryPackage = null;
        Integer packageItemCount = null;
        BigDecimal packageTotalAmount = null;

        if (primaryPackageLine != null) {
            primaryPackage = customerPackageRepository.findById(primaryPackageLine.getCustomerPackageId())
                    .orElse(null);
            if (primaryPackage != null) {
                List<CustomerPackageItem> packageItems = customerPackageItemRepository
                        .findByCustomerPackageIdOrderByCreatedAtAsc(primaryPackage.getId());
                packageItemCount = packageItems.size();
                packageTotalAmount = packageItems.stream()
                        .map(item -> item.getItem().getPrice() == null ? BigDecimal.ZERO : item.getItem().getPrice())
                        .reduce(BigDecimal.ZERO, BigDecimal::add)
                        .add(resolvePackageShippingAmount(primaryPackage));
            }
        }

        String effectiveGuide = cleanNullable(shipment.getGuideReference());
        if (effectiveGuide == null && primaryPackage != null) {
            effectiveGuide = cleanNullable(primaryPackage.getTrackingNumber());
        }

        LogisticsView logistics = resolveLogisticsView(shipment, packages);
        String attentionReason = resolveAttentionReason(shipment, packages, effectiveGuide, logistics);
        String blockedReason = resolveBlockedReason(shipment, packages, effectiveGuide, logistics);

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
                (long) packages.size(),
                primaryPackage != null ? primaryPackage.getId() : null,
                primaryPackage != null ? primaryPackage.getFolio() : null,
                primaryPackage != null ? primaryPackage.getStatus().name() : null,
                packageItemCount,
                primaryPackage != null ? primaryPackage.getCustomer().getId() : null,
                primaryPackage != null ? primaryPackage.getCustomer().getName() : null,
                primaryPackage != null ? primaryPackage.getCustomer().getPhone() : null,
                primaryPackage != null && primaryPackage.getDeliveryType() != null ? primaryPackage.getDeliveryType().name() : null,
                logistics.recipientName,
                logistics.recipientPhone,
                logistics.destinationSummary,
                logistics.destinationCity,
                logistics.destinationState,
                logistics.destinationPostalCode,
                logistics.shippingCarrier,
                primaryPackage != null ? primaryPackage.getTrackingNumber() : null,
                logistics.realShippingCost,
                logistics.shippingNotes,
                logistics.source,
                logistics.warning,
                packageTotalAmount,
                primaryPackageLine != null ? primaryPackageLine.getPaymentMode().name() : null,
                attentionReason != null,
                attentionReason,
                resolveNextStep(shipment, packages, attentionReason),
                shipment.getStatus() == ShipmentStatus.OPEN && blockedReason == null,
                shipment.getStatus() == ShipmentStatus.OUT_FOR_DELIVERY && !packages.isEmpty(),
                blockedReason
        );
    }

    private BigDecimal resolvePackageShippingAmount(CustomerPackage customerPackage) {
        if (!customerPackage.isShippingCostConfirmed()
                || customerPackage.isShippingCostWaived()
                || customerPackage.isShippingCollect()
                || customerPackage.isCustomerProvidedLabel()) {
            return BigDecimal.ZERO;
        }

        return customerPackage.getShippingCostAmount() == null
                ? BigDecimal.ZERO
                : customerPackage.getShippingCostAmount();
    }

    private String resolveAttentionReason(Shipment shipment, List<ShipmentPackage> packages, String effectiveGuide, LogisticsView logistics) {
        if (packages.isEmpty()) {
            return "Sin paquete asociado";
        }

        if (shipment.getStatus() == ShipmentStatus.OPEN && "MIXED_LEGACY".equals(logistics.source)) {
            return "Definir destino del envio";
        }

        if (shipment.getStatus() == ShipmentStatus.OPEN && cleanNullable(logistics.destinationSummary) == null) {
            return "Falta destino del envio";
        }

        if (shipment.getStatus() == ShipmentStatus.OPEN
                && shipment.getDeliveryType() == ShipmentDeliveryType.CARRIER
                && effectiveGuide == null) {
            return "Falta guia";
        }

        return null;
    }

    private String resolveBlockedReason(Shipment shipment, List<ShipmentPackage> packages, String effectiveGuide, LogisticsView logistics) {
        if (packages.isEmpty()) {
            return "Este envio no tiene paquete asociado. No puede operarse hasta corregirse o cancelarse.";
        }

        if (shipment.getStatus() == ShipmentStatus.OPEN && "MIXED_LEGACY".equals(logistics.source)) {
            return "Este envio tiene datos legacy diferentes entre paquetes. Define una direccion del envio antes de marcarlo enviado.";
        }

        if (shipment.getStatus() == ShipmentStatus.OPEN && cleanNullable(logistics.destinationSummary) == null) {
            return "Define la direccion o destino del envio antes de marcarlo enviado.";
        }

        if (shipment.getStatus() == ShipmentStatus.OPEN
                && shipment.getDeliveryType() == ShipmentDeliveryType.CARRIER
                && effectiveGuide == null) {
            return "Captura la guia o referencia antes de marcar como enviado.";
        }

        return null;
    }

    private String resolveNextStep(Shipment shipment, List<ShipmentPackage> packages, String attentionReason) {
        if (attentionReason != null) {
            return attentionReason;
        }

        if (shipment.getStatus() == ShipmentStatus.OPEN) {
            return "Marcar enviado";
        }

        if (shipment.getStatus() == ShipmentStatus.OUT_FOR_DELIVERY) {
            return "Confirmar recibido";
        }

        if (shipment.getStatus() == ShipmentStatus.DELIVERED) {
            return "Entregado";
        }

        if (shipment.getStatus() == ShipmentStatus.CANCELLED) {
            return "Cancelado";
        }

        if (shipment.getStatus() == ShipmentStatus.CLOSED_WITH_INCIDENTS) {
            return "Revisar incidencias";
        }

        return packages.isEmpty() ? "Revisar incidencia" : "Revisar detalle";
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
