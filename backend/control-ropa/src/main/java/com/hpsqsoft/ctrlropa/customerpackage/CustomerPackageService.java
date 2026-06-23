package com.hpsqsoft.ctrlropa.customerpackage;

import com.hpsqsoft.ctrlropa.balance.BalanceService;
import com.hpsqsoft.ctrlropa.branch.Branch;
import com.hpsqsoft.ctrlropa.branch.BranchRepository;
import com.hpsqsoft.ctrlropa.catalog.SalesChannel;
import com.hpsqsoft.ctrlropa.catalog.SalesChannelRepository;
import com.hpsqsoft.ctrlropa.customer.Customer;
import com.hpsqsoft.ctrlropa.customer.CustomerAddress;
import com.hpsqsoft.ctrlropa.customer.CustomerAddressRepository;
import com.hpsqsoft.ctrlropa.customer.CustomerRepository;
import com.hpsqsoft.ctrlropa.common.Status;
import com.hpsqsoft.ctrlropa.item.Item;
import com.hpsqsoft.ctrlropa.item.ItemRepository;
import com.hpsqsoft.ctrlropa.item.ItemStatus;
import com.hpsqsoft.ctrlropa.order.CustomerOrder;
import com.hpsqsoft.ctrlropa.order.CustomerOrderItem;
import com.hpsqsoft.ctrlropa.order.CustomerOrderItemRepository;
import com.hpsqsoft.ctrlropa.order.CustomerOrderService;
import com.hpsqsoft.ctrlropa.order.CustomerOrderSettlementResponse;
import com.hpsqsoft.ctrlropa.reservation.Reservation;
import com.hpsqsoft.ctrlropa.reservation.ReservationRepository;
import com.hpsqsoft.ctrlropa.reservation.ReservationStatus;
import com.hpsqsoft.ctrlropa.sale.Sale;
import com.hpsqsoft.ctrlropa.sale.SaleRepository;
import com.hpsqsoft.ctrlropa.sale.SaleStatus;
import com.hpsqsoft.ctrlropa.security.access.AccessService;
import com.hpsqsoft.ctrlropa.security.access.ChannelCode;
import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import com.hpsqsoft.ctrlropa.security.access.PermissionCode;
import com.hpsqsoft.ctrlropa.tenant.TenantAccessGuard;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@Transactional
public class CustomerPackageService {

    private final CustomerPackageRepository repository;
    private final CustomerPackageItemRepository itemRepository;
    private final CustomerRepository customerRepository;
    private final CustomerAddressRepository customerAddressRepository;
    private final BranchRepository branchRepository;
    private final SaleRepository saleRepository;
    private final ReservationRepository reservationRepository;
    private final ItemRepository itemEntityRepository;
    private final SalesChannelRepository salesChannelRepository;
    private final CustomerOrderService customerOrderService;
    private final CustomerOrderItemRepository customerOrderItemRepository;
    private final JdbcTemplate jdbcTemplate;
    private final TenantAccessGuard tenantAccessGuard;
    private final AccessService accessService;
    private final CurrentUser currentUser;
    private final BalanceService balanceService;

    public CustomerPackageService(CustomerPackageRepository repository,
                                  CustomerPackageItemRepository itemRepository,
                                  CustomerRepository customerRepository,
                                  CustomerAddressRepository customerAddressRepository,
                                  BranchRepository branchRepository,
                                  SaleRepository saleRepository,
                                  ReservationRepository reservationRepository,
                                  ItemRepository itemEntityRepository,
                                  SalesChannelRepository salesChannelRepository,
                                  CustomerOrderService customerOrderService,
                                  CustomerOrderItemRepository customerOrderItemRepository,
                                  JdbcTemplate jdbcTemplate,
                                  TenantAccessGuard tenantAccessGuard,
                                  AccessService accessService,
                                  CurrentUser currentUser,
                                  BalanceService balanceService) {
        this.repository = repository;
        this.itemRepository = itemRepository;
        this.customerRepository = customerRepository;
        this.customerAddressRepository = customerAddressRepository;
        this.branchRepository = branchRepository;
        this.saleRepository = saleRepository;
        this.reservationRepository = reservationRepository;
        this.itemEntityRepository = itemEntityRepository;
        this.salesChannelRepository = salesChannelRepository;
        this.customerOrderService = customerOrderService;
        this.customerOrderItemRepository = customerOrderItemRepository;
        this.jdbcTemplate = jdbcTemplate;
        this.tenantAccessGuard = tenantAccessGuard;
        this.accessService = accessService;
        this.currentUser = currentUser;
        this.balanceService = balanceService;
    }

    public CustomerPackageResponse create(CreateCustomerPackageRequest request) {
        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado"));

        Branch branch = branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new IllegalArgumentException("Sucursal no encontrada"));
        tenantAccessGuard.requireBranch(branch.getId(), "La sucursal del paquete no pertenece al tenant activo");
        tenantAccessGuard.requireBranch(customer.getBranch().getId(), "El cliente no pertenece a la sucursal activa");
        if (!customer.getBranch().getId().equals(branch.getId())) {
            throw new IllegalArgumentException("El cliente no pertenece a la sucursal indicada");
        }

        CustomerPackage customerPackage = new CustomerPackage();
        customerPackage.setFolio(generateUniqueFolio());
        customerPackage.setCustomer(customer);
        customerPackage.setBranch(branch);
        customerPackage.setStatus(CustomerPackageStatus.OPEN);
        customerPackage.setNotes(request.getNotes());
        customerPackage.setCreatedByUserId(request.getCreatedByUserId());

        return toResponse(repository.save(customerPackage));
    }

    public CustomerPackageDetailResponse prepareFromOrder(Long orderId, PrepareCustomerPackageFromOrderRequest request) {
        CustomerOrder order = customerOrderService.findEntityById(orderId);
        List<CustomerOrderItem> orderItems = customerOrderItemRepository.findByCustomerOrderIdOrderByCreatedAtAsc(orderId);

        if (orderItems.isEmpty()) {
            throw new IllegalArgumentException("El pedido no tiene prendas para preparar paquete");
        }

        CustomerOrderSettlementResponse settlement = customerOrderService.getSettlement(orderId);
        if (settlement.getPending().compareTo(BigDecimal.ZERO) > 0) {
            throw new IllegalArgumentException("El pedido aun tiene saldo pendiente");
        }

        Long existingPackageId = findExistingPackageId(orderItems);
        CustomerPackage customerPackage = existingPackageId == null
                ? createPackageForOrder(order, request.getCreatedByUserId())
                : findEntity(existingPackageId);

        for (CustomerOrderItem orderItem : orderItems) {
            if (isAlreadyPackaged(orderItem)) {
                continue;
            }

            AddCustomerPackageItemRequest addItemRequest = new AddCustomerPackageItemRequest();
            addItemRequest.setItemId(orderItem.getItem().getId());

            if (orderItem.getSale() != null) {
                addItemRequest.setSaleId(orderItem.getSale().getId());
            } else if (orderItem.getReservation() != null) {
                addItemRequest.setReservationId(orderItem.getReservation().getId());
            } else {
                continue;
            }

            addItem(customerPackage.getId(), addItemRequest);
        }

        return findDetail(customerPackage.getId());
    }

    public CustomerPackageDetailResponse prepareFromReservation(Long reservationId,
                                                                PrepareCustomerPackageFromReservationRequest request) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada"));
        tenantAccessGuard.requireBranch(reservation.getBranch().getId(), "La reserva no pertenece a la sucursal activa");

        if (reservation.getStatus() != ReservationStatus.ACTIVE) {
            throw new IllegalArgumentException("Solo se puede crear paquete desde apartados activos");
        }

        if (reservation.getCustomer() == null) {
            throw new IllegalArgumentException("El apartado debe tener cliente formal antes de crear paquete");
        }

        if (itemRepository.existsByReservationId(reservation.getId())) {
            throw new IllegalArgumentException("La reserva ya esta en otro paquete");
        }

        CustomerPackage customerPackage = new CustomerPackage();
        customerPackage.setFolio(generateUniqueFolio());
        customerPackage.setCustomer(reservation.getCustomer());
        customerPackage.setBranch(reservation.getBranch());
        customerPackage.setStatus(CustomerPackageStatus.OPEN);
        customerPackage.setNotes("Creado desde apartado #" + reservation.getId());
        customerPackage.setCreatedByUserId(request.getCreatedByUserId());

        CustomerPackage saved = repository.save(customerPackage);

        AddCustomerPackageItemRequest addItemRequest = new AddCustomerPackageItemRequest();
        addItemRequest.setItemId(reservation.getItem().getId());
        addItemRequest.setReservationId(reservation.getId());

        return addItem(saved.getId(), addItemRequest);
    }

    @Transactional(readOnly = true)
    public List<CustomerPackageResponse> findByCustomer(Long customerId) {
        validateCustomerInActiveTenant(customerId);
        return repository.findByCustomerIdOrderByCreatedAtDesc(customerId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CustomerPackageDetailResponse> findDetailsByCustomer(Long customerId) {
        validateCustomerInActiveTenant(customerId);
        return repository.findByCustomerIdOrderByCreatedAtDesc(customerId)
                .stream()
                .map(this::toDetail)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CustomerPackageDetailResponse> findDetailsByBranch(Long branchId) {
        tenantAccessGuard.requireBranch(branchId, "La sucursal de paquetes no pertenece al tenant activo");
        return repository.findByBranchIdOrderByCreatedAtDesc(branchId)
                .stream()
                .map(this::toDetail)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CustomerPackageDetailResponse> findReadyForShipmentByBranch(Long branchId) {
        accessService.assertCan(currentUser.getUserId(), PermissionCode.MANAGE_SHIPMENTS);
        tenantAccessGuard.requireBranch(branchId, "La sucursal de paquetes listos para envio no pertenece al tenant activo");
        return repository.findByBranchIdOrderByCreatedAtDesc(branchId)
                .stream()
                .filter(customerPackage -> customerPackage.getStatus() == CustomerPackageStatus.READY)
                .map(this::toDetail)
                .filter(this::isReadyForShipmentQueue)
                .toList();
    }

    @Transactional(readOnly = true)
    public CustomerPackageDetailResponse findDetail(Long packageId) {
        CustomerPackage customerPackage = findEntity(packageId);
        return toDetail(customerPackage);
    }

    @Transactional(readOnly = true)
    public CustomerPackageDetailResponse findDetailByFolio(String folio) {
        CustomerPackage customerPackage = findEntityByFolio(folio);
        return toDetail(customerPackage);
    }

    public CustomerPackageDetailResponse addItem(Long packageId, AddCustomerPackageItemRequest request) {
        CustomerPackage customerPackage = findEntity(packageId);

        if (customerPackage.getStatus() != CustomerPackageStatus.OPEN) {
            throw new IllegalArgumentException("Solo se pueden agregar items a paquetes en OPEN");
        }

        validateSourceSelection(request);

        Item item = itemEntityRepository.findById(request.getItemId())
                .orElseThrow(() -> new IllegalArgumentException("Item no encontrado"));
        tenantAccessGuard.requireBranch(item.getBranch().getId(), "El item no pertenece a la sucursal activa");
        if (!item.getBranch().getId().equals(customerPackage.getBranch().getId())) {
            throw new IllegalArgumentException("El item no pertenece a la sucursal del paquete");
        }

        if (itemRepository.existsByCustomerPackageIdAndItemId(packageId, item.getId())) {
            throw new IllegalArgumentException("El item ya está en el paquete");
        }

        CustomerPackageItem packageItem = new CustomerPackageItem();
        packageItem.setCustomerPackageId(packageId);
        packageItem.setItem(item);

        if (request.getSaleId() != null) {
            Sale sale = saleRepository.findById(request.getSaleId())
                    .orElseThrow(() -> new IllegalArgumentException("Venta no encontrada"));

            validateSaleAgainstPackage(customerPackage, sale, item);

            if (itemRepository.existsBySaleId(sale.getId())) {
                throw new IllegalArgumentException("La venta ya está en otro paquete");
            }

            packageItem.setSaleId(sale.getId());
        } else if (request.getReservationId() != null) {
            Reservation reservation = reservationRepository.findById(request.getReservationId())
                    .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada"));

            validateReservationAgainstPackage(customerPackage, reservation, item);

            if (itemRepository.existsByReservationId(reservation.getId())) {
                throw new IllegalArgumentException("La reserva ya está en otro paquete");
            }

            packageItem.setReservationId(reservation.getId());
        } else {
            Reservation reservation = createReservationForAvailablePackageItem(customerPackage, item);
            packageItem.setReservationId(reservation.getId());
        }

        itemRepository.save(packageItem);

        return findDetail(packageId);
    }

    public CustomerPackageDetailResponse addItemByItemCode(String packageFolio, String itemCode) {
        CustomerPackage customerPackage = findEntityByFolio(packageFolio);

        Item item = itemEntityRepository.findByCompanyIdAndCode(
                        tenantAccessGuard.requireCurrentTenant().getCompanyId(),
                        itemCode)
                .orElseThrow(() -> new IllegalArgumentException("Item no encontrado con código: " + itemCode));

        AddCustomerPackageItemRequest request = buildAddItemRequestFromItem(item);
        return addItem(customerPackage.getId(), request);
    }

    public CustomerPackageDetailResponse addItemByQrCode(String packageFolio, String qrCode) {
        CustomerPackage customerPackage = findEntityByFolio(packageFolio);

        Item item = itemEntityRepository.findByCompanyIdAndQrCode(
                        tenantAccessGuard.requireCurrentTenant().getCompanyId(),
                        qrCode)
                .orElseThrow(() -> new IllegalArgumentException("Item no encontrado con QR: " + qrCode));

        AddCustomerPackageItemRequest request = buildAddItemRequestFromItem(item);
        return addItem(customerPackage.getId(), request);
    }

    public CustomerPackageDetailResponse markReady(Long packageId, CloseCustomerPackageRequest request) {
        accessService.assertCan(currentUser.getUserId(), PermissionCode.CREATE_CLOSE_CUSTOMER_PACKAGE);
        CustomerPackage customerPackage = findEntity(packageId);

        if (customerPackage.getStatus() != CustomerPackageStatus.OPEN) {
            throw new IllegalArgumentException("Solo paquetes en OPEN pueden pasar a READY");
        }

        String preliminaryBlockedReason = getMarkReadyBlockedReason(
                customerPackage,
                1,
                BigDecimal.ZERO,
                true
        );
        if (preliminaryBlockedReason != null
                && (preliminaryBlockedReason.startsWith("Selecciona")
                || preliminaryBlockedReason.startsWith("Captura")
                || preliminaryBlockedReason.startsWith("Confirma"))) {
            throw new IllegalArgumentException(preliminaryBlockedReason);
        }

        CustomerPackageDetailResponse detail = toDetail(customerPackage);
        if (detail.getItems().isEmpty()) {
            throw new IllegalArgumentException("No se puede cerrar un paquete vacío");
        }

        BigDecimal pendingAmount = normalizeMoney(detail.getPendingAmount());
        if (pendingAmount.compareTo(BigDecimal.ZERO) > 0) {
            throw new IllegalArgumentException("No puedes marcar listo para envio porque el paquete tiene saldo pendiente de " + formatMoney(pendingAmount) + ".");
        }

        customerPackage.setStatus(CustomerPackageStatus.READY);
        customerPackage.setClosedAt(LocalDateTime.now());
        customerPackage.setClosedByUserId(request.getClosedByUserId());

        repository.save(customerPackage);

        return findDetail(packageId);
    }

    public CustomerPackageDetailResponse updateShippingCost(Long packageId, UpdateCustomerPackageShippingRequest request) {
        accessService.assertCan(currentUser.getUserId(), PermissionCode.CREATE_CLOSE_CUSTOMER_PACKAGE);
        if (request == null) {
            throw new IllegalArgumentException("Datos de envio requeridos");
        }
        CustomerPackage customerPackage = findEntity(packageId);

        if (customerPackage.getStatus() != CustomerPackageStatus.OPEN) {
            throw new IllegalArgumentException("Solo paquetes en preparacion pueden modificar datos de envio");
        }

        boolean waived = Boolean.TRUE.equals(request.getShippingCostWaived());
        if (waived) {
            customerPackage.setShippingCostAmount(BigDecimal.ZERO);
            customerPackage.setShippingCostConfirmed(true);
            customerPackage.setShippingCostWaived(true);
        } else {
            BigDecimal shippingCost = request.getShippingCostAmount();
            if (shippingCost == null) {
                throw new IllegalArgumentException("Captura el costo de paqueteria o marca envio sin costo.");
            }

            if (shippingCost.signum() < 0) {
                throw new IllegalArgumentException("El costo de envio no puede ser negativo.");
            }

            if (shippingCost.compareTo(BigDecimal.ZERO) == 0) {
                throw new IllegalArgumentException("Para costo 0 marca explicitamente envio sin costo.");
            }

            customerPackage.setShippingCostAmount(shippingCost);
            customerPackage.setShippingCostConfirmed(true);
            customerPackage.setShippingCostWaived(false);
        }

        customerPackage.setShippingCarrier(cleanNullable(request.getShippingCarrier()));
        customerPackage.setTrackingNumber(cleanNullable(request.getTrackingNumber()));
        customerPackage.setShippingNotes(cleanNullable(request.getShippingNotes()));

        repository.save(customerPackage);
        return findDetail(packageId);
    }

    public CustomerPackageDetailResponse updateShipping(Long packageId, UpdateCustomerPackageShippingRequest request) {
        accessService.assertCan(currentUser.getUserId(), PermissionCode.CREATE_CLOSE_CUSTOMER_PACKAGE);
        if (request == null) {
            throw new IllegalArgumentException("Datos de envio requeridos");
        }

        CustomerPackage customerPackage = findEntity(packageId);

        if (customerPackage.getStatus() != CustomerPackageStatus.OPEN) {
            throw new IllegalArgumentException("Solo paquetes en preparacion pueden modificar datos de envio");
        }

        CustomerPackageDeliveryType deliveryType = request.getDeliveryType();
        if (deliveryType == null) {
            throw new IllegalArgumentException("Selecciona el tipo de entrega antes de guardar envio.");
        }

        customerPackage.setDeliveryType(deliveryType);
        customerPackage.setShippingCollect(deliveryType == CustomerPackageDeliveryType.COLLECT_SHIPPING
                || Boolean.TRUE.equals(request.getCollectShipping()));
        customerPackage.setCustomerProvidedLabel(deliveryType == CustomerPackageDeliveryType.CUSTOMER_PROVIDED_LABEL
                || Boolean.TRUE.equals(request.getCustomerProvidedLabel()));

        applyShippingAddress(customerPackage, request, deliveryType);
        applyShippingCost(customerPackage, request, deliveryType);

        customerPackage.setShippingCarrier(cleanNullable(request.getShippingCarrier()));
        customerPackage.setTrackingNumber(cleanNullable(request.getTrackingNumber()));
        customerPackage.setShippingNotes(cleanNullable(request.getShippingNotes()));

        repository.save(customerPackage);
        return findDetail(packageId);
    }

    public CustomerPackageDetailResponse removeItem(Long packageId, Long packageItemId, boolean confirmCredit) {
        Long userId = currentUser.getUserId();
        accessService.assertCan(userId, PermissionCode.CREATE_CLOSE_CUSTOMER_PACKAGE);
        CustomerPackage customerPackage = findEntity(packageId);

        if (!isEditableForItemRemoval(customerPackage.getStatus())) {
            throw new IllegalArgumentException("No puedes quitar prendas cuando el paquete ya esta listo para envio, enviado, cerrado o cancelado.");
        }

        CustomerPackageItem packageItem = itemRepository.findById(packageItemId)
                .orElseThrow(() -> new IllegalArgumentException("La prenda ya no pertenece a este paquete."));

        if (!packageItem.getCustomerPackageId().equals(packageId)) {
            throw new IllegalArgumentException("La prenda ya no pertenece a este paquete.");
        }

        SourceFinancialData financialData = getSourceFinancialData(packageItem);
        if (hasLinePayment(financialData)) {
            if (!confirmCredit) {
                throw new IllegalArgumentException("Esta prenda tiene abono aplicado. Si la quitas, " + formatMoney(financialData.paidAmount()) + " quedaran como saldo a favor del cliente.");
            }
            accessService.assertCan(userId, PermissionCode.APPLY_CUSTOMER_BALANCE);
            balanceService.registerRefundStoreCredit(
                    customerPackage.getCustomer().getId(),
                    customerPackage.getBranch().getId(),
                    normalizeMoney(financialData.paidAmount()),
                    userId,
                    buildPackageItemCreditNote(customerPackage, packageItem, financialData)
            );
        }

        itemRepository.delete(packageItem);
        return findDetail(packageId);
    }

    public CustomerPackageDetailResponse markReadyByFolio(String folio, CloseCustomerPackageRequest request) {
        CustomerPackage customerPackage = findEntityByFolio(folio);
        return markReady(customerPackage.getId(), request);
    }

    public CustomerPackageDetailResponse cancel(Long packageId, CancelCustomerPackageRequest request) {
        CustomerPackage customerPackage = findEntity(packageId);

        if (customerPackage.getStatus() == CustomerPackageStatus.CANCELLED) {
            throw new IllegalArgumentException("El paquete ya está cancelado");
        }

        if (customerPackage.getStatus() == CustomerPackageStatus.SHIPPED ||
                customerPackage.getStatus() == CustomerPackageStatus.DELIVERED) {
            throw new IllegalArgumentException("No se puede cancelar un paquete ya enviado o entregado");
        }

        customerPackage.setStatus(CustomerPackageStatus.CANCELLED);
        customerPackage.setNotes(request.getNotes());
        customerPackage.setClosedAt(LocalDateTime.now());
        customerPackage.setClosedByUserId(request.getClosedByUserId());

        repository.save(customerPackage);

        return findDetail(packageId);
    }

    public CustomerPackageDetailResponse cancelByFolio(String folio, CancelCustomerPackageRequest request) {
        CustomerPackage customerPackage = findEntityByFolio(folio);
        return cancel(customerPackage.getId(), request);
    }

    private CustomerPackage createPackageForOrder(CustomerOrder order, Long createdByUserId) {
        CustomerPackage customerPackage = new CustomerPackage();
        customerPackage.setFolio(generateUniqueFolio());
        customerPackage.setCustomer(order.getCustomer());
        customerPackage.setBranch(order.getBranch());
        customerPackage.setStatus(CustomerPackageStatus.OPEN);
        customerPackage.setNotes("Preparado desde pedido #" + order.getId());
        customerPackage.setCreatedByUserId(createdByUserId);

        return repository.save(customerPackage);
    }

    private Long findExistingPackageId(List<CustomerOrderItem> orderItems) {
        for (CustomerOrderItem orderItem : orderItems) {
            if (orderItem.getSale() != null) {
                Long packageId = itemRepository.findFirstBySaleId(orderItem.getSale().getId())
                        .map(CustomerPackageItem::getCustomerPackageId)
                        .orElse(null);
                if (packageId != null) {
                    return packageId;
                }
            }

            if (orderItem.getReservation() != null) {
                Long packageId = itemRepository.findFirstByReservationId(orderItem.getReservation().getId())
                        .map(CustomerPackageItem::getCustomerPackageId)
                        .orElse(null);
                if (packageId != null) {
                    return packageId;
                }
            }
        }

        return null;
    }

    private boolean isAlreadyPackaged(CustomerOrderItem orderItem) {
        if (orderItem.getSale() != null && itemRepository.existsBySaleId(orderItem.getSale().getId())) {
            return true;
        }

        return orderItem.getReservation() != null
                && itemRepository.existsByReservationId(orderItem.getReservation().getId());
    }

    private CustomerPackage findEntity(Long id) {
        CustomerPackage customerPackage = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Paquete no encontrado con id: " + id));
        tenantAccessGuard.requireBranch(customerPackage.getBranch().getId(), "El paquete no pertenece a la sucursal activa");
        return customerPackage;
    }

    private CustomerPackage findEntityByFolio(String folio) {
        CustomerPackage customerPackage = repository.findByFolio(folio)
                .orElseThrow(() -> new IllegalArgumentException("Paquete no encontrado con folio: " + folio));
        tenantAccessGuard.requireBranch(customerPackage.getBranch().getId(), "El paquete no pertenece a la sucursal activa");
        return customerPackage;
    }

    private AddCustomerPackageItemRequest buildAddItemRequestFromItem(Item item) {
        Sale sale = saleRepository.findByItemIdAndStatus(item.getId(), SaleStatus.ACTIVE)
                .orElse(null);

        AddCustomerPackageItemRequest request = new AddCustomerPackageItemRequest();
        request.setItemId(item.getId());

        if (sale != null) {
            request.setSaleId(sale.getId());
            return request;
        }

        Reservation reservation = reservationRepository.findByItemIdAndStatus(item.getId(), ReservationStatus.ACTIVE)
                .orElse(null);

        if (reservation == null) {
            if (item.getStatus() == ItemStatus.AVAILABLE) {
                return request;
            }
            throw new IllegalArgumentException("No existe venta ni reserva activa para este item");
        }

        request.setReservationId(reservation.getId());
        return request;
    }

    private CustomerPackageDetailResponse toDetail(CustomerPackage customerPackage) {
        Long currentUserId = currentUser.getUserId();
        boolean canRemoveItems = currentUserId != null
                && accessService.can(currentUserId, PermissionCode.CREATE_CLOSE_CUSTOMER_PACKAGE);
        boolean canGenerateCustomerCredit = currentUserId != null
                && accessService.can(currentUserId, PermissionCode.APPLY_CUSTOMER_BALANCE);

        List<CustomerPackageDetailResponse.ItemLine> items = itemRepository
                .findByCustomerPackageIdOrderByCreatedAtAsc(customerPackage.getId())
                .stream()
                .map(packageItem -> toItemLine(customerPackage, packageItem, canRemoveItems, canGenerateCustomerCredit))
                .toList();

        BigDecimal itemSubtotalAmount = items.stream()
                .map(CustomerPackageDetailResponse.ItemLine::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal itemPaidAmount = items.stream()
                .map(CustomerPackageDetailResponse.ItemLine::getPaidAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal shippingCostAmount = customerPackage.isShippingCostConfirmed()
                ? safe(customerPackage.getShippingCostAmount())
                : BigDecimal.ZERO;
        BigDecimal paidShippingAmount = getPackageLevelPaidAmount(customerPackage.getId());
        BigDecimal totalAmount = itemSubtotalAmount.add(shippingCostAmount);
        BigDecimal paidAmount = itemPaidAmount.add(paidShippingAmount);
        BigDecimal pendingAmount = totalAmount.subtract(paidAmount);
        if (pendingAmount.signum() < 0) {
            pendingAmount = BigDecimal.ZERO;
        }
        pendingAmount = normalizeMoney(pendingAmount);

        String paymentStatus = resolvePaymentStatus(totalAmount, paidAmount);
        String markReadyBlockedReason = getMarkReadyBlockedReason(
                customerPackage,
                items.size(),
                pendingAmount,
                canRemoveItems
        );

        List<CustomerPackageDetailResponse.ShipmentLine> shipments = findShipmentLines(customerPackage.getId());

        return new CustomerPackageDetailResponse(
                customerPackage.getId(),
                customerPackage.getFolio(),
                customerPackage.getCustomer().getId(),
                customerPackage.getCustomer().getName(),
                customerPackage.getCustomer().getPhone(),
                customerPackage.getBranch().getId(),
                customerPackage.getBranch().getCode(),
                customerPackage.getBranch().getName(),
                customerPackage.getStatus().name(),
                paymentStatus,
                customerPackage.getNotes(),
                customerPackage.getCreatedAt(),
                customerPackage.getCreatedByUserId(),
                customerPackage.getClosedAt(),
                customerPackage.getClosedByUserId(),
                items.size(),
                itemSubtotalAmount,
                customerPackage.isShippingCostConfirmed() ? shippingCostAmount : null,
                customerPackage.isShippingCostConfirmed(),
                customerPackage.isShippingCostWaived(),
                customerPackage.getShippingNotes(),
                customerPackage.getShippingCarrier(),
                customerPackage.getTrackingNumber(),
                customerPackage.getDeliveryType() != null ? customerPackage.getDeliveryType().name() : null,
                customerPackage.getShippingAddressSource() != null ? customerPackage.getShippingAddressSource().name() : null,
                customerPackage.isShippingAddressConfirmed(),
                customerPackage.getSourceCustomerAddressId(),
                customerPackage.getShipToName(),
                customerPackage.getShipToPhone(),
                customerPackage.getShipToLine1(),
                customerPackage.getShipToLine2(),
                customerPackage.getShipToCity(),
                customerPackage.getShipToState(),
                customerPackage.getShipToPostalCode(),
                customerPackage.getShipToCountry(),
                customerPackage.getShipToReferences(),
                customerPackage.isShippingCollect(),
                customerPackage.isCustomerProvidedLabel(),
                totalAmount,
                paidAmount,
                pendingAmount,
                markReadyBlockedReason == null,
                markReadyBlockedReason,
                items,
                shipments
        );
    }

    private BigDecimal getPackageLevelPaidAmount(Long packageId) {
        BigDecimal value = jdbcTemplate.queryForObject(
                """
                SELECT COALESCE(SUM(CASE
                    WHEN p.status = 'ACTIVE' THEN pa.amount
                    ELSE 0
                END), 0)
                FROM payment_allocations pa
                JOIN payments p ON p.id = pa.payment_id
                WHERE pa.customer_package_id = ?
                """,
                BigDecimal.class,
                packageId
        );
        return safe(value);
    }

    private List<CustomerPackageDetailResponse.ShipmentLine> findShipmentLines(Long packageId) {
        return jdbcTemplate.query(
                """
                SELECT
                    sp.id AS shipment_package_id,
                    sh.id AS shipment_id,
                    sh.folio AS shipment_folio,
                    sh.status AS shipment_status,
                    sp.result_status AS package_shipment_status,
                    sp.payment_mode AS payment_mode,
                    sp.expected_cod_amount AS expected_collection_amount,
                    sp.collected_amount AS collected_amount,
                    sp.collection_difference AS collection_difference,
                    sp.collection_status AS collection_status,
                    sp.result_notes AS collection_notes,
                    sp.delivered_at AS delivered_at,
                    sp.returned_at AS returned_at
                FROM shipment_packages sp
                JOIN shipments sh ON sh.id = sp.shipment_id
                WHERE sp.customer_package_id = ?
                ORDER BY sp.id DESC
                """,
                (rs, rowNum) -> new CustomerPackageDetailResponse.ShipmentLine(
                        rs.getLong("shipment_package_id"),
                        rs.getLong("shipment_id"),
                        rs.getString("shipment_folio"),
                        rs.getString("shipment_status"),
                        rs.getString("package_shipment_status"),
                        rs.getString("payment_mode"),
                        safe(rs.getBigDecimal("expected_collection_amount")),
                        safe(rs.getBigDecimal("collected_amount")),
                        safe(rs.getBigDecimal("collection_difference")),
                        rs.getString("collection_status"),
                        rs.getString("collection_notes"),
                        toLocalDateTime(rs.getTimestamp("delivered_at")),
                        toLocalDateTime(rs.getTimestamp("returned_at"))
                ),
                packageId
        );
    }

    private void validateSourceSelection(AddCustomerPackageItemRequest request) {
        boolean hasSale = request.getSaleId() != null;
        boolean hasReservation = request.getReservationId() != null;

        if (hasSale && hasReservation) {
            throw new IllegalArgumentException("Debes enviar solo uno de saleId o reservationId");
        }
    }

    private Reservation createReservationForAvailablePackageItem(CustomerPackage customerPackage, Item item) {
        if (item.getStatus() != ItemStatus.AVAILABLE) {
            throw new IllegalArgumentException("Solo prendas libres disponibles pueden agregarse directo al paquete");
        }

        Reservation activeReservation = reservationRepository.findByItemIdAndStatus(item.getId(), ReservationStatus.ACTIVE)
                .orElse(null);
        if (activeReservation != null) {
            throw new IllegalArgumentException("La prenda ya tiene un apartado activo");
        }

        if (item.getPrice() == null || item.getPrice().signum() <= 0) {
            throw new IllegalArgumentException("La prenda libre debe tener precio antes de agregarse al paquete");
        }

        int reservedRows = itemEntityRepository.reserveIfAvailable(
                item.getCompany().getId(),
                item.getBranch().getId(),
                item.getId(),
                ItemStatus.AVAILABLE,
                ItemStatus.RESERVED
        );

        if (reservedRows != 1) {
            throw new IllegalArgumentException("La prenda ya no esta disponible para agregar al paquete");
        }

        SalesChannel salesChannel = salesChannelRepository.findByCode(ChannelCode.DOOR_RESERVATION)
                .orElseThrow(() -> new IllegalArgumentException("Canal Apartado puerta no configurado"));

        item.setStatus(ItemStatus.RESERVED);
        itemEntityRepository.save(item);

        Reservation reservation = new Reservation();
        reservation.setItem(item);
        reservation.setCustomer(customerPackage.getCustomer());
        reservation.setBranch(customerPackage.getBranch());
        reservation.setSalesChannel(salesChannel);
        reservation.setSellerUserId(customerPackage.getCreatedByUserId());
        reservation.setPrice(item.getPrice());
        reservation.setNotes("Apartado creado al agregar prenda libre al paquete " + customerPackage.getFolio());
        reservation.setStatus(ReservationStatus.ACTIVE);

        return reservationRepository.save(reservation);
    }

    private void validateSaleAgainstPackage(CustomerPackage customerPackage, Sale sale, Item item) {
        tenantAccessGuard.requireBranch(sale.getBranch().getId(), "La venta no pertenece a la sucursal activa");
        if (!sale.getCustomer().getId().equals(customerPackage.getCustomer().getId())) {
            throw new IllegalArgumentException("La venta no pertenece al cliente del paquete");
        }

        if (!sale.getBranch().getId().equals(customerPackage.getBranch().getId())) {
            throw new IllegalArgumentException("La venta no pertenece a la sucursal del paquete");
        }

        if (!sale.getItem().getId().equals(item.getId())) {
            throw new IllegalArgumentException("El item no coincide con la venta enviada");
        }
    }

    private void validateReservationAgainstPackage(CustomerPackage customerPackage, Reservation reservation, Item item) {
        tenantAccessGuard.requireBranch(reservation.getBranch().getId(), "La reserva no pertenece a la sucursal activa");
        if (reservation.getCustomer() == null) {
            throw new IllegalArgumentException("La reserva debe tener cliente formal para agregarse al paquete");
        }

        if (reservation.getStatus() != ReservationStatus.ACTIVE) {
            throw new IllegalArgumentException("Solo reservas activas pueden agregarse al paquete");
        }

        if (!reservation.getCustomer().getId().equals(customerPackage.getCustomer().getId())) {
            throw new IllegalArgumentException("La reserva no pertenece al cliente del paquete");
        }

        if (!reservation.getBranch().getId().equals(customerPackage.getBranch().getId())) {
            throw new IllegalArgumentException("La reserva no pertenece a la sucursal del paquete");
        }

        if (!reservation.getItem().getId().equals(item.getId())) {
            throw new IllegalArgumentException("El item no coincide con la reserva enviada");
        }
    }

    private CustomerPackageResponse toResponse(CustomerPackage customerPackage) {
        return new CustomerPackageResponse(
                customerPackage.getId(),
                customerPackage.getFolio(),
                customerPackage.getCustomer().getId(),
                customerPackage.getCustomer().getName(),
                customerPackage.getBranch().getId(),
                customerPackage.getBranch().getCode(),
                customerPackage.getStatus().name(),
                customerPackage.getNotes(),
                customerPackage.getCreatedAt(),
                customerPackage.getCreatedByUserId(),
                customerPackage.getClosedAt(),
                customerPackage.getClosedByUserId()
        );
    }

    private CustomerPackageDetailResponse.ItemLine toItemLine(CustomerPackage customerPackage,
                                                              CustomerPackageItem packageItem,
                                                              boolean canRemoveItems,
                                                              boolean canGenerateCustomerCredit) {
        String sourceType = packageItem.getSaleId() != null ? "SALE" : "RESERVATION";

        SourceFinancialData financialData = getSourceFinancialData(packageItem);

        BigDecimal pendingAmount = financialData.price().subtract(financialData.paidAmount());
        if (pendingAmount.signum() < 0) {
            pendingAmount = BigDecimal.ZERO;
        }

        Item item = packageItem.getItem();

        boolean requiresCreditConfirmation = hasLinePayment(financialData);
        String removeBlockedReason = getRemoveBlockedReason(
                customerPackage,
                financialData,
                canRemoveItems,
                canGenerateCustomerCredit
        );

        return new CustomerPackageDetailResponse.ItemLine(
                packageItem.getId(),
                item.getId(),
                item.getCode(),
                item.getQrCode(),
                item.getStatus().name(),
                item.getProductType().getName(),
                item.getBrand() != null ? item.getBrand().getName() : null,
                item.getSize() != null ? item.getSize().getName() : null,
                financialData.price(),
                financialData.paidAmount(),
                pendingAmount,
                packageItem.getSaleId(),
                packageItem.getReservationId(),
                sourceType,
                financialData.sourceStatus(),
                requiresCreditConfirmation,
                requiresCreditConfirmation ? normalizeMoney(financialData.paidAmount()) : BigDecimal.ZERO.setScale(2),
                removeBlockedReason == null,
                removeBlockedReason,
                packageItem.getCreatedAt()
        );
    }

    private String getRemoveBlockedReason(CustomerPackage customerPackage,
                                          SourceFinancialData financialData,
                                          boolean canRemoveItems,
                                          boolean canGenerateCustomerCredit) {
        if (!canRemoveItems) {
            return "No tienes permiso para quitar prendas del paquete.";
        }

        if (!isEditableForItemRemoval(customerPackage.getStatus())) {
            return "No puedes quitar prendas cuando el paquete ya esta listo para envio, enviado, cerrado o cancelado.";
        }

        if (hasLinePayment(financialData) && !canGenerateCustomerCredit) {
            return "No tienes permiso para quitar prendas con abono aplicado. Permiso requerido: APPLY_CUSTOMER_BALANCE.";
        }

        return null;
    }

    private void applyShippingAddress(CustomerPackage customerPackage,
                                      UpdateCustomerPackageShippingRequest request,
                                      CustomerPackageDeliveryType deliveryType) {
        if (deliveryType == CustomerPackageDeliveryType.STORE_PICKUP) {
            clearPackageAddressSnapshot(customerPackage, CustomerPackageAddressSource.PICKUP_NO_ADDRESS);
            customerPackage.setShippingAddressConfirmed(true);
            return;
        }

        if (deliveryType == CustomerPackageDeliveryType.CUSTOMER_PROVIDED_LABEL) {
            if (isBlank(request.getTrackingNumber()) && isBlank(request.getShippingNotes())) {
                throw new IllegalArgumentException("Captura la guia o notas del envio proporcionado por el cliente.");
            }
            clearPackageAddressSnapshot(customerPackage, CustomerPackageAddressSource.CUSTOMER_PROVIDED_LABEL);
            customerPackage.setShippingAddressConfirmed(true);
            return;
        }

        CustomerPackageAddressSource source = request.getAddressSource();
        if (source == null && deliveryTypeRequiresAddress(deliveryType)) {
            source = CustomerPackageAddressSource.CUSTOM_PACKAGE_ADDRESS;
        }

        if (deliveryTypeRequiresAddress(deliveryType) && source == null) {
            throw new IllegalArgumentException("Captura o selecciona la direccion de envio antes de guardar.");
        }

        if (source == CustomerPackageAddressSource.PICKUP_NO_ADDRESS
                || source == CustomerPackageAddressSource.CUSTOMER_PROVIDED_LABEL) {
            if (deliveryTypeRequiresAddress(deliveryType)) {
                throw new IllegalArgumentException("Este tipo de entrega requiere una direccion de envio.");
            }
            clearPackageAddressSnapshot(customerPackage, source);
            customerPackage.setShippingAddressConfirmed(true);
            return;
        }

        CustomerAddress savedAddress = null;
        if (source == CustomerPackageAddressSource.CUSTOMER_PRIMARY_ADDRESS) {
            savedAddress = findPrimaryAddress(customerPackage);
            copyAddressSnapshot(customerPackage, request, savedAddress, source);
        } else if (source == CustomerPackageAddressSource.CUSTOMER_SAVED_ADDRESS) {
            savedAddress = findCustomerAddress(customerPackage, request.getSourceCustomerAddressId());
            copyAddressSnapshot(customerPackage, request, savedAddress, source);
        } else {
            copyRequestAddressSnapshot(customerPackage, request, source == null ? CustomerPackageAddressSource.CUSTOM_PACKAGE_ADDRESS : source);
            if (Boolean.TRUE.equals(request.getSaveAddressToCustomer())) {
                savedAddress = createSavedAddressFromRequest(customerPackage, request);
                customerPackage.setSourceCustomerAddressId(savedAddress.getId());
            }
        }

        customerPackage.setShippingAddressConfirmed(true);
    }

    private void applyShippingCost(CustomerPackage customerPackage,
                                   UpdateCustomerPackageShippingRequest request,
                                   CustomerPackageDeliveryType deliveryType) {
        if (deliveryType == CustomerPackageDeliveryType.STORE_PICKUP
                || deliveryType == CustomerPackageDeliveryType.CUSTOMER_PROVIDED_LABEL
                || deliveryType == CustomerPackageDeliveryType.COLLECT_SHIPPING) {
            customerPackage.setShippingCostAmount(BigDecimal.ZERO);
            customerPackage.setShippingCostConfirmed(true);
            customerPackage.setShippingCostWaived(true);
            return;
        }

        boolean waived = Boolean.TRUE.equals(request.getShippingCostWaived());
        if (waived) {
            customerPackage.setShippingCostAmount(BigDecimal.ZERO);
            customerPackage.setShippingCostConfirmed(true);
            customerPackage.setShippingCostWaived(true);
            return;
        }

        BigDecimal shippingCost = request.getShippingCostAmount();
        if (shippingCost == null) {
            throw new IllegalArgumentException("Confirma el costo de envio o marca una opcion sin costo/por cobrar.");
        }

        if (shippingCost.signum() < 0) {
            throw new IllegalArgumentException("El costo de envio no puede ser negativo.");
        }

        if (shippingCost.compareTo(BigDecimal.ZERO) == 0) {
            throw new IllegalArgumentException("Para costo 0 marca explicitamente envio sin costo.");
        }

        customerPackage.setShippingCostAmount(shippingCost);
        customerPackage.setShippingCostConfirmed(true);
        customerPackage.setShippingCostWaived(false);
    }

    private CustomerAddress findPrimaryAddress(CustomerPackage customerPackage) {
        return customerAddressRepository
                .findByCustomerIdAndStatusOrderByIsDefaultDescLabelAsc(
                        customerPackage.getCustomer().getId(),
                        Status.ACTIVE
                )
                .stream()
                .filter(address -> Boolean.TRUE.equals(address.getIsDefault()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("El cliente no tiene direccion principal activa."));
    }

    private CustomerAddress findCustomerAddress(CustomerPackage customerPackage, Long addressId) {
        if (addressId == null) {
            throw new IllegalArgumentException("Selecciona una direccion guardada del cliente.");
        }

        CustomerAddress address = customerAddressRepository.findById(addressId)
                .orElseThrow(() -> new IllegalArgumentException("Direccion de envio no encontrada."));
        tenantAccessGuard.requireBranch(
                address.getCustomer().getBranch().getId(),
                "La direccion no pertenece a la sucursal activa"
        );

        if (!address.getCustomer().getId().equals(customerPackage.getCustomer().getId())) {
            throw new IllegalArgumentException("La direccion no pertenece al cliente del paquete.");
        }

        if (address.getStatus() != Status.ACTIVE) {
            throw new IllegalArgumentException("La direccion seleccionada no esta activa.");
        }

        return address;
    }

    private void copyAddressSnapshot(CustomerPackage customerPackage,
                                     UpdateCustomerPackageShippingRequest request,
                                     CustomerAddress address,
                                     CustomerPackageAddressSource source) {
        customerPackage.setShippingAddressSource(source);
        customerPackage.setSourceCustomerAddressId(address.getId());
        customerPackage.setShipToName(firstNonBlank(request.getRecipientName(), customerPackage.getCustomer().getName()));
        customerPackage.setShipToPhone(firstNonBlank(request.getRecipientPhone(), customerPackage.getCustomer().getPhone()));
        customerPackage.setShipToLine1(address.getLine1());
        customerPackage.setShipToLine2(address.getLine2());
        customerPackage.setShipToCity(address.getCity());
        customerPackage.setShipToState(address.getState());
        customerPackage.setShipToPostalCode(address.getPostalCode());
        customerPackage.setShipToCountry(address.getCountry());
        customerPackage.setShipToReferences(cleanNullable(request.getReferences()));
    }

    private void copyRequestAddressSnapshot(CustomerPackage customerPackage,
                                            UpdateCustomerPackageShippingRequest request,
                                            CustomerPackageAddressSource source) {
        validateAddressFields(request);
        customerPackage.setShippingAddressSource(source);
        customerPackage.setSourceCustomerAddressId(null);
        customerPackage.setShipToName(cleanRequired(request.getRecipientName(), "Captura la persona que recibe el paquete."));
        customerPackage.setShipToPhone(cleanRequired(request.getRecipientPhone(), "Captura el telefono de contacto para el envio."));
        customerPackage.setShipToLine1(cleanRequired(request.getLine1(), "Captura calle y numero de la direccion de envio."));
        customerPackage.setShipToLine2(cleanNullable(request.getLine2()));
        customerPackage.setShipToCity(cleanRequired(request.getCity(), "Captura la ciudad de la direccion de envio."));
        customerPackage.setShipToState(cleanRequired(request.getState(), "Captura el estado de la direccion de envio."));
        customerPackage.setShipToPostalCode(cleanRequired(request.getPostalCode(), "Captura el codigo postal de la direccion de envio."));
        customerPackage.setShipToCountry(firstNonBlank(request.getCountry(), "Mexico"));
        customerPackage.setShipToReferences(cleanNullable(request.getReferences()));
    }

    private CustomerAddress createSavedAddressFromRequest(CustomerPackage customerPackage,
                                                          UpdateCustomerPackageShippingRequest request) {
        CustomerAddress address = new CustomerAddress();
        address.setCustomer(customerPackage.getCustomer());
        address.setLabel(buildAddressLabel(customerPackage, request));
        address.setLine1(cleanRequired(request.getLine1(), "Captura calle y numero de la direccion de envio."));
        address.setLine2(cleanNullable(request.getLine2()));
        address.setCity(cleanRequired(request.getCity(), "Captura la ciudad de la direccion de envio."));
        address.setState(cleanRequired(request.getState(), "Captura el estado de la direccion de envio."));
        address.setPostalCode(cleanRequired(request.getPostalCode(), "Captura el codigo postal de la direccion de envio."));
        address.setCountry(firstNonBlank(request.getCountry(), "Mexico"));
        address.setIsDefault(Boolean.TRUE.equals(request.getMakePrimaryAddress()));
        address.setStatus(Status.ACTIVE);

        if (Boolean.TRUE.equals(request.getMakePrimaryAddress())) {
            clearDefaultAddress(customerPackage.getCustomer().getId());
        }

        return customerAddressRepository.save(address);
    }

    private void clearDefaultAddress(Long customerId) {
        List<CustomerAddress> addresses = customerAddressRepository
                .findByCustomerIdAndStatusOrderByIsDefaultDescLabelAsc(customerId, Status.ACTIVE);
        for (CustomerAddress address : addresses) {
            if (Boolean.TRUE.equals(address.getIsDefault())) {
                address.setIsDefault(false);
                customerAddressRepository.save(address);
            }
        }
    }

    private String buildAddressLabel(CustomerPackage customerPackage, UpdateCustomerPackageShippingRequest request) {
        String base = firstNonBlank(request.getAddressLabel(), "Envio " + customerPackage.getFolio());
        if (!customerAddressRepository.existsByCustomerIdAndLabel(customerPackage.getCustomer().getId(), base)) {
            return base;
        }

        int suffix = 2;
        String candidate;
        do {
            candidate = base + " " + suffix;
            suffix++;
        } while (customerAddressRepository.existsByCustomerIdAndLabel(customerPackage.getCustomer().getId(), candidate));
        return candidate;
    }

    private void clearPackageAddressSnapshot(CustomerPackage customerPackage, CustomerPackageAddressSource source) {
        customerPackage.setShippingAddressSource(source);
        customerPackage.setSourceCustomerAddressId(null);
        customerPackage.setShipToName(null);
        customerPackage.setShipToPhone(null);
        customerPackage.setShipToLine1(null);
        customerPackage.setShipToLine2(null);
        customerPackage.setShipToCity(null);
        customerPackage.setShipToState(null);
        customerPackage.setShipToPostalCode(null);
        customerPackage.setShipToCountry(null);
        customerPackage.setShipToReferences(null);
    }

    private void validateAddressFields(UpdateCustomerPackageShippingRequest request) {
        cleanRequired(request.getRecipientName(), "Captura la persona que recibe el paquete.");
        cleanRequired(request.getRecipientPhone(), "Captura el telefono de contacto para el envio.");
        cleanRequired(request.getLine1(), "Captura calle y numero de la direccion de envio.");
        cleanRequired(request.getCity(), "Captura la ciudad de la direccion de envio.");
        cleanRequired(request.getState(), "Captura el estado de la direccion de envio.");
        cleanRequired(request.getPostalCode(), "Captura el codigo postal de la direccion de envio.");
    }

    private String getMarkReadyBlockedReason(CustomerPackage customerPackage,
                                             int itemCount,
                                             BigDecimal pendingAmount,
                                             boolean canManagePackage) {
        if (!canManagePackage) {
            return "No tienes permiso para marcar listo para envio. Permiso requerido: CREATE_CLOSE_CUSTOMER_PACKAGE.";
        }

        if (customerPackage.getStatus() != CustomerPackageStatus.OPEN) {
            return "El paquete no puede prepararse para envio en su estado actual: " + customerPackage.getStatus().name() + ".";
        }

        if (itemCount <= 0) {
            return "Agrega al menos una prenda antes de liberar envio.";
        }

        if (customerPackage.getDeliveryType() == null) {
            return "Selecciona el tipo de entrega antes de marcar listo para envio.";
        }

        if (deliveryTypeRequiresAddress(customerPackage.getDeliveryType())
                && !customerPackage.isShippingAddressConfirmed()) {
            return "Captura o selecciona la direccion de envio antes de marcar listo para envio.";
        }

        if (!isShippingConfirmedForReady(customerPackage)) {
            return "Confirma el costo de envio o marca una opcion sin costo/por cobrar.";
        }

        BigDecimal normalizedPending = normalizeMoney(pendingAmount);
        if (normalizedPending.compareTo(BigDecimal.ZERO) > 0) {
            return "No puedes marcar listo para envio porque el paquete tiene saldo pendiente de " + formatMoney(normalizedPending) + ".";
        }

        return null;
    }

    private boolean isReadyForShipmentQueue(CustomerPackageDetailResponse detail) {
        if (detail.getTotalItems() == null || detail.getTotalItems() <= 0) {
            return false;
        }

        if (!Boolean.TRUE.equals(detail.getShippingCostConfirmed())) {
            return false;
        }

        CustomerPackageDeliveryType deliveryType = detail.getDeliveryType() == null
                ? null
                : CustomerPackageDeliveryType.valueOf(detail.getDeliveryType());
        if (deliveryType == null) {
            return false;
        }

        if (deliveryTypeRequiresAddress(deliveryType)
                && !Boolean.TRUE.equals(detail.getShippingAddressConfirmed())) {
            return false;
        }

        if (normalizeMoney(detail.getPendingAmount()).compareTo(BigDecimal.ZERO) > 0) {
            return false;
        }

        return detail.getShipments().stream().noneMatch(this::isActiveShipmentLine);
    }

    private boolean isActiveShipmentLine(CustomerPackageDetailResponse.ShipmentLine shipmentLine) {
        return "OPEN".equals(shipmentLine.getShipmentStatus())
                || "OUT_FOR_DELIVERY".equals(shipmentLine.getShipmentStatus());
    }

    private boolean isShippingConfirmedForReady(CustomerPackage customerPackage) {
        if (customerPackage.getDeliveryType() == null) {
            return false;
        }

        if (deliveryTypeRequiresAddress(customerPackage.getDeliveryType())
                && !customerPackage.isShippingAddressConfirmed()) {
            return false;
        }

        if (!customerPackage.isShippingCostConfirmed()) {
            return false;
        }

        if (customerPackage.isShippingCostWaived()) {
            return true;
        }

        return customerPackage.getShippingCostAmount() != null
                && customerPackage.getShippingCostAmount().compareTo(BigDecimal.ZERO) >= 0;
    }

    private boolean deliveryTypeRequiresAddress(CustomerPackageDeliveryType deliveryType) {
        return deliveryType == CustomerPackageDeliveryType.PARCEL_SERVICE
                || deliveryType == CustomerPackageDeliveryType.LOCAL_DELIVERY
                || deliveryType == CustomerPackageDeliveryType.COLLECT_SHIPPING;
    }

    private boolean isEditableForItemRemoval(CustomerPackageStatus status) {
        return status == CustomerPackageStatus.OPEN;
    }

    private boolean hasLinePayment(SourceFinancialData financialData) {
        return financialData.paidAmount().compareTo(BigDecimal.ZERO) > 0;
    }

    private BigDecimal normalizeMoney(BigDecimal value) {
        return safe(value).setScale(2, RoundingMode.HALF_UP);
    }

    private String formatMoney(BigDecimal value) {
        return "$" + normalizeMoney(value).toPlainString() + " MXN";
    }

    private String buildPackageItemCreditNote(CustomerPackage customerPackage,
                                              CustomerPackageItem packageItem,
                                              SourceFinancialData financialData) {
        String itemCode = packageItem.getItem() != null ? packageItem.getItem().getCode() : "sin codigo";
        return "Saldo a favor por quitar prenda " + itemCode
                + " del paquete " + customerPackage.getFolio()
                + ". Monto pagado transferido: " + formatMoney(financialData.paidAmount()) + ".";
    }

    private SourceFinancialData getSourceFinancialData(CustomerPackageItem packageItem) {
        if (packageItem.getSaleId() != null) {
            return jdbcTemplate.queryForObject(
                    """
                    SELECT
                        s.price AS price,
                        s.status AS source_status,
                        COALESCE(SUM(CASE
                            WHEN p.status = 'ACTIVE' THEN pa.amount
                            ELSE 0
                        END), 0) AS paid_amount
                    FROM sales s
                    LEFT JOIN payment_allocations pa ON pa.sale_id = s.id
                    LEFT JOIN payments p ON p.id = pa.payment_id
                    WHERE s.id = ?
                    GROUP BY s.id, s.price, s.status
                    """,
                    (rs, rowNum) -> new SourceFinancialData(
                            safe(rs.getBigDecimal("price")),
                            safe(rs.getBigDecimal("paid_amount")),
                            rs.getString("source_status")
                    ),
                    packageItem.getSaleId()
            );
        }

        return jdbcTemplate.queryForObject(
                """
                SELECT
                    r.price AS price,
                    r.status AS source_status,
                    COALESCE(SUM(CASE
                        WHEN p.status = 'ACTIVE' THEN pa.amount
                        ELSE 0
                    END), 0) AS paid_amount
                FROM reservations r
                LEFT JOIN payment_allocations pa ON pa.reservation_id = r.id
                LEFT JOIN payments p ON p.id = pa.payment_id
                WHERE r.id = ?
                GROUP BY r.id, r.price, r.status
                """,
                (rs, rowNum) -> new SourceFinancialData(
                        safe(rs.getBigDecimal("price")),
                        safe(rs.getBigDecimal("paid_amount")),
                        rs.getString("source_status")
                ),
                packageItem.getReservationId()
        );
    }

    private String resolvePaymentStatus(BigDecimal total, BigDecimal paid) {
        if (paid.compareTo(BigDecimal.ZERO) <= 0) {
            return "UNPAID";
        }

        BigDecimal pending = normalizeMoney(total.subtract(paid));
        if (pending.compareTo(BigDecimal.ZERO) > 0) {
            return "PARTIALLY_PAID";
        }

        return "PAID";
    }

    private BigDecimal safe(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private String cleanNullable(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private String cleanRequired(String value, String message) {
        String cleaned = cleanNullable(value);
        if (cleaned == null) {
            throw new IllegalArgumentException(message);
        }
        return cleaned;
    }

    private String firstNonBlank(String first, String fallback) {
        String cleaned = cleanNullable(first);
        if (cleaned != null) {
            return cleaned;
        }
        return cleanNullable(fallback);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private void validateCustomerInActiveTenant(Long customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado"));
        tenantAccessGuard.requireBranch(customer.getBranch().getId(), "El cliente no pertenece a la sucursal activa");
    }

    private LocalDateTime toLocalDateTime(Timestamp timestamp) {
        if (timestamp == null) {
            return null;
        }

        return timestamp.toLocalDateTime();
    }

    private String generateUniqueFolio() {
        String candidate;
        do {
            candidate = "PKG-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS"));
        } while (repository.existsByFolio(candidate));
        return candidate;
    }

    private record SourceFinancialData(
            BigDecimal price,
            BigDecimal paidAmount,
            String sourceStatus
    ) {
    }
}
