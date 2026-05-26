package com.hpsqsoft.ctrlropa.payment;

import com.hpsqsoft.ctrlropa.balance.BalanceService;
import com.hpsqsoft.ctrlropa.catalog.PaymentMethod;
import com.hpsqsoft.ctrlropa.catalog.PaymentMethodRepository;
import com.hpsqsoft.ctrlropa.customerpackage.CustomerPackage;
import com.hpsqsoft.ctrlropa.customerpackage.CustomerPackageItem;
import com.hpsqsoft.ctrlropa.customerpackage.CustomerPackageItemRepository;
import com.hpsqsoft.ctrlropa.customerpackage.CustomerPackageRepository;
import com.hpsqsoft.ctrlropa.item.ItemRepository;
import com.hpsqsoft.ctrlropa.item.ItemStatus;
import com.hpsqsoft.ctrlropa.order.CustomerOrderService;
import com.hpsqsoft.ctrlropa.reservation.Reservation;
import com.hpsqsoft.ctrlropa.reservation.ReservationRepository;
import com.hpsqsoft.ctrlropa.reservation.ReservationStatus;
import com.hpsqsoft.ctrlropa.sale.Sale;
import com.hpsqsoft.ctrlropa.sale.SalePaymentStatus;
import com.hpsqsoft.ctrlropa.sale.SaleRepository;
import com.hpsqsoft.ctrlropa.sale.SaleStatus;
import com.hpsqsoft.ctrlropa.security.access.AccessService;
import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import com.hpsqsoft.ctrlropa.security.access.PermissionCode;
import com.hpsqsoft.ctrlropa.tenant.CurrentTenantContext;
import com.hpsqsoft.ctrlropa.tenant.TenantResolver;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@Transactional
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final PaymentAllocationRepository allocationRepository;
    private final PaymentMethodRepository paymentMethodRepository;
    private final SaleRepository saleRepository;
    private final ReservationRepository reservationRepository;
    private final CustomerOrderService customerOrderService;
    private final BalanceService balanceService;
    private final ItemRepository itemRepository;
    private final CustomerPackageRepository customerPackageRepository;
    private final CustomerPackageItemRepository customerPackageItemRepository;
    private final AccessService accessService;
    private final CurrentUser currentUser;
    private final TenantResolver tenantResolver;

    public PaymentService(PaymentRepository paymentRepository,
                          PaymentAllocationRepository allocationRepository,
                          PaymentMethodRepository paymentMethodRepository,
                          SaleRepository saleRepository,
                          ReservationRepository reservationRepository,
                          CustomerOrderService customerOrderService,
                          BalanceService balanceService,
                          ItemRepository itemRepository,
                          CustomerPackageRepository customerPackageRepository,
                          CustomerPackageItemRepository customerPackageItemRepository,
                          AccessService accessService,
                          CurrentUser currentUser,
                          TenantResolver tenantResolver) {
        this.paymentRepository = paymentRepository;
        this.allocationRepository = allocationRepository;
        this.paymentMethodRepository = paymentMethodRepository;
        this.saleRepository = saleRepository;
        this.reservationRepository = reservationRepository;
        this.customerOrderService = customerOrderService;
        this.balanceService = balanceService;
        this.itemRepository = itemRepository;
        this.customerPackageRepository = customerPackageRepository;
        this.customerPackageItemRepository = customerPackageItemRepository;
        this.accessService = accessService;
        this.currentUser = currentUser;
        this.tenantResolver = tenantResolver;
    }

    public PaymentResponse create(CreatePaymentRequest request) {
        Long userId = currentUser.getUserId();
        accessService.assertCan(userId, PermissionCode.REGISTER_PAYMENTS);
        request.setCreatedByUserId(userId);

        validateRequest(request);

        PaymentMethod paymentMethod = paymentMethodRepository.findById(request.getPaymentMethodId())
                .orElseThrow(() -> new IllegalArgumentException("Método de pago no encontrado"));

        TargetData target = resolveTarget(request);

        BigDecimal alreadyApplied = getAlreadyApplied(request.getSaleId(), request.getReservationId());
        BigDecimal pending = target.totalAmount.subtract(alreadyApplied);

        if (pending.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("La operación ya está liquidada");
        }

        BigDecimal appliedAmount = request.getAmount();
        if (appliedAmount.compareTo(pending) > 0) {
            appliedAmount = pending;
        }

        BigDecimal overageAmount = request.getAmount().subtract(appliedAmount);

        Payment payment = new Payment();
        payment.setCustomerId(target.customerId);
        payment.setBranchId(target.branchId);
        payment.setReceivedAmount(request.getAmount());
        payment.setPaymentMethodId(paymentMethod.getId());
        payment.setReference(request.getReference());
        payment.setStatus(PaymentStatus.ACTIVE);
        payment.setCreatedByUserId(request.getCreatedByUserId());

        Payment savedPayment = paymentRepository.save(payment);

        if (appliedAmount.compareTo(BigDecimal.ZERO) > 0) {
            PaymentAllocation allocation = new PaymentAllocation();
            allocation.setPaymentId(savedPayment.getId());
            allocation.setSaleId(request.getSaleId());
            allocation.setReservationId(request.getReservationId());
            allocation.setAmount(appliedAmount);
            allocationRepository.save(allocation);
        }

        if (overageAmount.compareTo(BigDecimal.ZERO) > 0) {
            balanceService.registerOverage(
                    target.customerId,
                    target.branchId,
                    overageAmount,
                    savedPayment.getId(),
                    request.getCreatedByUserId(),
                    "Sobrepago generado desde pago " + savedPayment.getId()
            );
        }

        if (request.getSaleId() != null) {
            syncSalePaymentStatusById(request.getSaleId());
        }

        if (target.customerOrderId != null) {
            customerOrderService.refreshStatus(target.customerOrderId);
        }

        return toResponse(savedPayment, paymentMethod);
    }

    public PaymentResponse createByPackageFolio(String folio, CreatePaymentByPackageFolioRequest request) {
        Long userId = currentUser.getUserId();
        accessService.assertCan(userId, PermissionCode.REGISTER_PAYMENTS);
        request.setCreatedByUserId(userId);

        if (request.getAmount() == null || request.getAmount().signum() <= 0) {
            throw new IllegalArgumentException("amount debe ser mayor a 0");
        }

        if (request.getCreatedByUserId() == null) {
            throw new IllegalArgumentException("createdByUserId es obligatorio");
        }

        CustomerPackage customerPackage = customerPackageRepository.findByFolio(folio)
                .orElseThrow(() -> new IllegalArgumentException("Paquete no encontrado con folio: " + folio));

        List<CustomerPackageItem> packageItems =
                customerPackageItemRepository.findByCustomerPackageIdOrderByCreatedAtAsc(customerPackage.getId());

        if (packageItems.isEmpty()) {
            throw new IllegalArgumentException("El paquete no tiene items");
        }

        List<Long> saleIds = packageItems.stream()
                .map(CustomerPackageItem::getSaleId)
                .filter(id -> id != null)
                .toList();

        boolean hasReservations = packageItems.stream().anyMatch(item -> item.getReservationId() != null);

        if (hasReservations) {
            throw new IllegalArgumentException("No se puede pagar por folio un paquete que contiene reservas");
        }

        if (saleIds.isEmpty()) {
            throw new IllegalArgumentException("El paquete no contiene ventas para pagar");
        }

        return createForSales(
                saleIds,
                request.getAmount(),
                request.getPaymentMethodId(),
                request.getCreatedByUserId(),
                request.getReference() != null && !request.getReference().isBlank()
                        ? request.getReference()
                        : "Pago paquete " + customerPackage.getFolio()
        );
    }

    public PaymentResponse createCodForSales(List<Long> saleIds,
                                             BigDecimal amount,
                                             Long createdByUserId,
                                             String reference) {
        Long userId = currentUser.getUserId();
        accessService.assertCan(userId, PermissionCode.REGISTER_PAYMENTS);

        PaymentMethod paymentMethod = paymentMethodRepository.findByCode("CASH")
                .orElseThrow(() -> new IllegalArgumentException("Método de pago CASH no encontrado"));

        return createForSales(saleIds, amount, paymentMethod.getId(), userId, reference);
    }

    private PaymentResponse createForSales(List<Long> saleIds,
                                           BigDecimal amount,
                                           Long paymentMethodId,
                                           Long createdByUserId,
                                           String reference) {
        if (saleIds == null || saleIds.isEmpty()) {
            throw new IllegalArgumentException("saleIds no puede venir vacío");
        }

        if (amount == null || amount.signum() <= 0) {
            throw new IllegalArgumentException("amount debe ser mayor a 0");
        }

        if (createdByUserId == null) {
            throw new IllegalArgumentException("createdByUserId es obligatorio");
        }

        PaymentMethod paymentMethod = paymentMethodRepository.findById(paymentMethodId)
                .orElseThrow(() -> new IllegalArgumentException("Método de pago no encontrado"));

        List<Sale> sales = saleIds.stream()
                .map(id -> saleRepository.findById(id)
                        .orElseThrow(() -> new IllegalArgumentException("Venta no encontrada con id: " + id)))
                .toList();

        validateSalesForGroupedPayment(sales);

        Sale firstSale = sales.get(0);
        BigDecimal totalPending = sales.stream()
                .map(this::getSalePending)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalPending.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Las ventas del paquete ya están liquidadas");
        }

        Payment payment = new Payment();
        payment.setCustomerId(firstSale.getCustomer().getId());
        payment.setBranchId(firstSale.getBranch().getId());
        payment.setReceivedAmount(amount);
        payment.setPaymentMethodId(paymentMethod.getId());
        payment.setReference(reference);
        payment.setStatus(PaymentStatus.ACTIVE);
        payment.setCreatedByUserId(createdByUserId);

        Payment savedPayment = paymentRepository.save(payment);

        BigDecimal remaining = amount;
        Set<Long> affectedOrderIds = new LinkedHashSet<>();
        Set<Long> affectedSaleIds = new LinkedHashSet<>();

        for (Sale sale : sales) {
            if (remaining.compareTo(BigDecimal.ZERO) <= 0) {
                break;
            }

            BigDecimal pending = getSalePending(sale);
            if (pending.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }

            BigDecimal appliedAmount = remaining.min(pending);

            PaymentAllocation allocation = new PaymentAllocation();
            allocation.setPaymentId(savedPayment.getId());
            allocation.setSaleId(sale.getId());
            allocation.setReservationId(null);
            allocation.setAmount(appliedAmount);
            allocationRepository.save(allocation);

            remaining = remaining.subtract(appliedAmount);
            affectedSaleIds.add(sale.getId());

            if (sale.getCustomerOrderId() != null) {
                affectedOrderIds.add(sale.getCustomerOrderId());
            }
        }

        if (remaining.compareTo(BigDecimal.ZERO) > 0) {
            balanceService.registerOverage(
                    firstSale.getCustomer().getId(),
                    firstSale.getBranch().getId(),
                    remaining,
                    savedPayment.getId(),
                    createdByUserId,
                    "Sobrepago generado desde pago " + savedPayment.getId()
            );
        }

        for (Long saleId : affectedSaleIds) {
            syncSalePaymentStatusById(saleId);
        }

        for (Long orderId : affectedOrderIds) {
            customerOrderService.refreshStatus(orderId);
        }

        return toResponse(savedPayment, paymentMethod);
    }

    @Transactional(readOnly = true)
    public PaymentResponse findById(Long id) {
        accessService.assertCan(currentUser.getUserId(), PermissionCode.VIEW_PAYMENTS);
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Pago no encontrado con id: " + id));
        assertPaymentBelongsToCurrentTenant(payment);

        PaymentMethod paymentMethod = paymentMethodRepository.findById(payment.getPaymentMethodId())
                .orElseThrow(() -> new IllegalArgumentException("Método de pago no encontrado"));

        return toResponse(payment, paymentMethod);
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> findByCustomer(Long customerId) {
        accessService.assertCan(currentUser.getUserId(), PermissionCode.VIEW_PAYMENTS);
        return paymentRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)
                .stream()
                .map(payment -> {
                    PaymentMethod method = paymentMethodRepository.findById(payment.getPaymentMethodId())
                            .orElseThrow(() -> new IllegalArgumentException("Método de pago no encontrado"));
                    return toResponse(payment, method);
                })
                .toList();
    }
    
    @Transactional(readOnly = true)
    public List<PaymentResponse> findByReservation(Long reservationId) {
        accessService.assertCan(currentUser.getUserId(), PermissionCode.VIEW_PAYMENTS);
        return allocationRepository.findByReservationIdOrderByCreatedAtAsc(reservationId)
                .stream()
                .map(allocation -> {
                    Payment payment = paymentRepository.findById(allocation.getPaymentId())
                            .orElseThrow(() -> new IllegalArgumentException("Pago no encontrado"));

                    PaymentMethod method = paymentMethodRepository.findById(payment.getPaymentMethodId())
                            .orElseThrow(() -> new IllegalArgumentException("Método de pago no encontrado"));

                    return toResponse(payment, method);
                })
                .toList();
    }

    public PaymentResponse voidPayment(Long paymentId, String reason, Long voidedByUserId) {
        Long userId = currentUser.getUserId();
        accessService.assertCan(userId, PermissionCode.VOID_PAYMENT);

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Pago no encontrado con id: " + paymentId));

        if (payment.getStatus() != PaymentStatus.ACTIVE) {
            throw new IllegalArgumentException("Solo se pueden anular pagos activos");
        }

        payment.setStatus(PaymentStatus.VOIDED);
        payment.setVoidedAt(LocalDateTime.now());
        payment.setVoidReason(reason);
        payment.setVoidedByUserId(userId);

        Payment saved = paymentRepository.save(payment);

        balanceService.reverseOverageForPayment(saved.getId(), userId, reason);

        List<PaymentAllocation> allocations = allocationRepository.findByPaymentIdOrderByCreatedAtAsc(saved.getId());
        Set<Long> affectedSales = new LinkedHashSet<>();
        Set<Long> affectedOrders = new LinkedHashSet<>();

        for (PaymentAllocation allocation : allocations) {
            if (allocation.getSaleId() != null) {
                Sale sale = saleRepository.findById(allocation.getSaleId())
                        .orElseThrow(() -> new IllegalArgumentException("Venta no encontrada"));

                affectedSales.add(sale.getId());

                if (sale.getCustomerOrderId() != null) {
                    affectedOrders.add(sale.getCustomerOrderId());
                }
            }

            if (allocation.getReservationId() != null) {
                Long orderId = customerOrderService.findOrderIdByReservationId(allocation.getReservationId());
                if (orderId != null) {
                    affectedOrders.add(orderId);
                }
            }
        }

        for (Long saleId : affectedSales) {
            syncSalePaymentStatusById(saleId);
        }

        for (Long orderId : affectedOrders) {
            customerOrderService.refreshStatus(orderId);
        }

        PaymentMethod method = paymentMethodRepository.findById(saved.getPaymentMethodId())
                .orElseThrow(() -> new IllegalArgumentException("Método de pago no encontrado"));

        return toResponse(saved, method);
    }
    
    public PaymentResponse createByItemCode(String code, CreatePaymentByItemRequest request) {
        var item = itemRepository.findByCode(code)
                .orElseThrow(() -> new IllegalArgumentException("Item no encontrado con código: " + code));

        return createByResolvedItem(item.getId(), request, "Pago item " + item.getCode());
    }

    public PaymentResponse createByQrCode(String qrCode, CreatePaymentByItemRequest request) {
        var item = itemRepository.findByQrCode(qrCode)
                .orElseThrow(() -> new IllegalArgumentException("Item no encontrado con QR: " + qrCode));

        return createByResolvedItem(item.getId(), request, "Pago QR " + item.getCode());
    }

    private PaymentResponse createByResolvedItem(Long itemId,
                                                 CreatePaymentByItemRequest request,
                                                 String defaultReference) {
        Sale sale = saleRepository.findByItemIdAndStatus(itemId, SaleStatus.ACTIVE)
                .orElseThrow(() -> new IllegalArgumentException("El item no tiene una venta activa para pagar"));

        CreatePaymentRequest resolvedRequest = new CreatePaymentRequest();
        resolvedRequest.setSaleId(sale.getId());
        resolvedRequest.setAmount(request.getAmount());
        resolvedRequest.setPaymentMethodId(request.getPaymentMethodId());
        resolvedRequest.setReference(
                request.getReference() != null && !request.getReference().isBlank()
                        ? request.getReference()
                        : defaultReference
        );
        resolvedRequest.setCreatedByUserId(request.getCreatedByUserId());

        return create(resolvedRequest);
    }

    private void validateRequest(CreatePaymentRequest request) {
        boolean hasSale = request.getSaleId() != null;
        boolean hasReservation = request.getReservationId() != null;

        if (hasSale == hasReservation) {
            throw new IllegalArgumentException("Debes enviar exactamente uno de saleId o reservationId");
        }

        if (request.getCreatedByUserId() == null) {
            throw new IllegalArgumentException("createdByUserId es obligatorio");
        }

        if (request.getAmount() == null || request.getAmount().signum() <= 0) {
            throw new IllegalArgumentException("amount debe ser mayor a 0");
        }
    }

    private TargetData resolveTarget(CreatePaymentRequest request) {
        if (request.getSaleId() != null) {
            Sale sale = saleRepository.findById(request.getSaleId())
                    .orElseThrow(() -> new IllegalArgumentException("Venta no encontrada"));

            if (sale.getStatus() != SaleStatus.ACTIVE) {
                throw new IllegalArgumentException("Solo se puede pagar una venta activa");
            }

            return new TargetData(
                    sale.getCustomer().getId(),
                    sale.getBranch().getId(),
                    sale.getPrice(),
                    sale.getCustomerOrderId()
            );
        }

        Reservation reservation = reservationRepository.findById(request.getReservationId())
                .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada"));

        if (reservation.getStatus() != ReservationStatus.ACTIVE) {
            throw new IllegalArgumentException("Solo se puede pagar una reserva activa");
        }

        Long customerOrderId = customerOrderService.findOrderIdByReservationId(reservation.getId());
        if (customerOrderId == null) {
            customerOrderId = customerOrderService.addReservationToOpenOrder(reservation).getId();
        }

        return new TargetData(
                reservation.getCustomer().getId(),
                reservation.getBranch().getId(),
                reservation.getPrice(),
                customerOrderId
        );
    }

    private BigDecimal getAlreadyApplied(Long saleId, Long reservationId) {
        if (saleId != null) {
            return calculateActiveAppliedToSale(saleId);
        }

        return allocationRepository.findByReservationIdOrderByCreatedAtAsc(reservationId)
                .stream()
                .map(allocation -> {
                    Payment payment = paymentRepository.findById(allocation.getPaymentId())
                            .orElseThrow(() -> new IllegalArgumentException("Pago no encontrado"));
                    return payment.getStatus() == PaymentStatus.ACTIVE ? allocation.getAmount() : BigDecimal.ZERO;
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal getSalePending(Sale sale) {
        BigDecimal alreadyApplied = calculateActiveAppliedToSale(sale.getId());
        BigDecimal pending = sale.getPrice().subtract(alreadyApplied);
        return pending.signum() < 0 ? BigDecimal.ZERO : pending;
    }

    private BigDecimal calculateActiveAppliedToSale(Long saleId) {
        return allocationRepository.findBySaleIdOrderByCreatedAtAsc(saleId)
                .stream()
                .map(allocation -> {
                    Payment payment = paymentRepository.findById(allocation.getPaymentId())
                            .orElseThrow(() -> new IllegalArgumentException("Pago no encontrado"));
                    return payment.getStatus() == PaymentStatus.ACTIVE ? allocation.getAmount() : BigDecimal.ZERO;
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private void syncSalePaymentStatusById(Long saleId) {
        Sale sale = saleRepository.findById(saleId)
                .orElseThrow(() -> new IllegalArgumentException("Venta no encontrada con id: " + saleId));

        if (sale.getStatus() != SaleStatus.ACTIVE) {
            return;
        }

        BigDecimal paid = calculateActiveAppliedToSale(sale.getId());
        SalePaymentStatus paymentStatus;

        if (paid.compareTo(BigDecimal.ZERO) <= 0) {
            paymentStatus = SalePaymentStatus.UNPAID;
        } else if (paid.compareTo(sale.getPrice()) < 0) {
            paymentStatus = SalePaymentStatus.PARTIALLY_PAID;
        } else {
            paymentStatus = SalePaymentStatus.PAID;
        }

        sale.setPaymentStatus(paymentStatus);

        if (paymentStatus == SalePaymentStatus.PAID) {
            sale.getItem().setStatus(ItemStatus.SOLD);
        } else {
            sale.getItem().setStatus(ItemStatus.RESERVED);
        }

        itemRepository.save(sale.getItem());
        saleRepository.save(sale);
    }

    private void validateSalesForGroupedPayment(List<Sale> sales) {
        Sale first = sales.get(0);

        for (Sale sale : sales) {
            if (sale.getStatus() != SaleStatus.ACTIVE) {
                throw new IllegalArgumentException("Solo se pueden cobrar ventas activas");
            }

            if (!sale.getCustomer().getId().equals(first.getCustomer().getId())) {
                throw new IllegalArgumentException("Todas las ventas del paquete deben pertenecer al mismo cliente");
            }

            if (!sale.getBranch().getId().equals(first.getBranch().getId())) {
                throw new IllegalArgumentException("Todas las ventas del paquete deben pertenecer a la misma sucursal");
            }
        }
    }

    private PaymentResponse toResponse(Payment payment, PaymentMethod paymentMethod) {
        List<PaymentResponse.AllocationLine> allocations = allocationRepository.findByPaymentIdOrderByCreatedAtAsc(payment.getId())
                .stream()
                .map(a -> new PaymentResponse.AllocationLine(
                        a.getId(),
                        a.getSaleId(),
                        a.getReservationId(),
                        a.getAmount(),
                        a.getCreatedAt()
                ))
                .toList();

        return new PaymentResponse(
                payment.getId(),
                payment.getCustomerId(),
                payment.getBranchId(),
                payment.getReceivedAmount(),
                payment.getPaymentMethodId(),
                paymentMethod.getCode(),
                payment.getReference(),
                payment.getStatus().name(),
                payment.getCreatedAt(),
                payment.getCreatedByUserId(),
                allocations
        );
    }

    private void assertPaymentBelongsToCurrentTenant(Payment payment) {
        CurrentTenantContext tenant = tenantResolver.resolveCurrent();
        tenantResolver.assertBranchBelongsToCompany(payment.getBranchId(), tenant.getCompanyId());
        if (tenant.getBranchId() != null && !tenant.getBranchId().equals(payment.getBranchId())) {
            throw new AccessDeniedException("El pago no pertenece a la sucursal activa");
        }
    }

    private static class TargetData {
        private final Long customerId;
        private final Long branchId;
        private final BigDecimal totalAmount;
        private final Long customerOrderId;

        private TargetData(Long customerId,
                           Long branchId,
                           BigDecimal totalAmount,
                           Long customerOrderId) {
            this.customerId = customerId;
            this.branchId = branchId;
            this.totalAmount = totalAmount;
            this.customerOrderId = customerOrderId;
        }
    }
}
