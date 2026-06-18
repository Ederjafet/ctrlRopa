package com.hpsqsoft.ctrlropa.sale;

import com.hpsqsoft.ctrlropa.branch.Branch;
import com.hpsqsoft.ctrlropa.branch.BranchRepository;
import com.hpsqsoft.ctrlropa.catalog.SalesChannel;
import com.hpsqsoft.ctrlropa.catalog.SalesChannelRepository;
import com.hpsqsoft.ctrlropa.customer.Customer;
import com.hpsqsoft.ctrlropa.customer.CustomerRepository;
import com.hpsqsoft.ctrlropa.item.Item;
import com.hpsqsoft.ctrlropa.item.ItemRepository;
import com.hpsqsoft.ctrlropa.item.ItemStatus;
import com.hpsqsoft.ctrlropa.order.CustomerOrder;
import com.hpsqsoft.ctrlropa.order.CustomerOrderService;
import com.hpsqsoft.ctrlropa.payment.PaymentAllocation;
import com.hpsqsoft.ctrlropa.payment.PaymentAllocationRepository;
import com.hpsqsoft.ctrlropa.payment.Payment;
import com.hpsqsoft.ctrlropa.payment.PaymentRepository;
import com.hpsqsoft.ctrlropa.payment.PaymentStatus;
import com.hpsqsoft.ctrlropa.reservation.Reservation;
import com.hpsqsoft.ctrlropa.reservation.ReservationRepository;
import com.hpsqsoft.ctrlropa.reservation.ReservationStatus;
import com.hpsqsoft.ctrlropa.security.access.AccessService;
import com.hpsqsoft.ctrlropa.security.access.ChannelCode;
import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import com.hpsqsoft.ctrlropa.security.access.PermissionCode;
import com.hpsqsoft.ctrlropa.tenant.CurrentTenantContext;
import com.hpsqsoft.ctrlropa.tenant.TenantResolver;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class SaleService {

    private final SaleRepository repository;
    private final ItemRepository itemRepository;
    private final CustomerRepository customerRepository;
    private final BranchRepository branchRepository;
    private final SalesChannelRepository salesChannelRepository;
    private final ReservationRepository reservationRepository;
    private final PaymentAllocationRepository paymentAllocationRepository;
    private final PaymentRepository paymentRepository;
    private final AccessService accessService;
    private final CurrentUser currentUser;
    private final CustomerOrderService customerOrderService;
    private final TenantResolver tenantResolver;

    public SaleService(SaleRepository repository,
                       ItemRepository itemRepository,
                       CustomerRepository customerRepository,
                       BranchRepository branchRepository,
                       SalesChannelRepository salesChannelRepository,
                       ReservationRepository reservationRepository,
                       PaymentAllocationRepository paymentAllocationRepository,
                       PaymentRepository paymentRepository,
                       AccessService accessService,
                       CurrentUser currentUser,
                       CustomerOrderService customerOrderService,
                       TenantResolver tenantResolver) {
        this.repository = repository;
        this.itemRepository = itemRepository;
        this.customerRepository = customerRepository;
        this.branchRepository = branchRepository;
        this.salesChannelRepository = salesChannelRepository;
        this.reservationRepository = reservationRepository;
        this.paymentAllocationRepository = paymentAllocationRepository;
        this.paymentRepository = paymentRepository;
        this.accessService = accessService;
        this.currentUser = currentUser;
        this.customerOrderService = customerOrderService;
        this.tenantResolver = tenantResolver;
    }

    @Transactional(readOnly = true)
    public List<SaleResponse> findByBranch(Long branchId) {
        accessService.assertCan(currentUser.getUserId(), PermissionCode.VIEW_SALES);
        assertBranchBelongsToCurrentTenant(branchId);
        return repository.findByBranchIdOrderByCreatedAtDesc(branchId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public SaleResponse findById(Long id) {
        accessService.assertCan(currentUser.getUserId(), PermissionCode.VIEW_SALES);
        Sale sale = findEntityById(id);
        assertSaleBelongsToCurrentTenant(sale);
        return toResponse(sale);
    }

    public SaleResponse create(CreateSaleRequest request) {
        validateCreateRequest(request);

        Long userId = currentUser.getUserId();

        Item item = itemRepository.findById(request.getItemId())
                .orElseThrow(() -> new IllegalArgumentException("Item no encontrado"));

        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado"));

        Branch branch = branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new IllegalArgumentException("Sucursal no encontrada"));
        assertBranchBelongsToCurrentTenant(branch.getId());
        assertBranchBelongsToCurrentTenant(item.getBranch().getId());
        assertBranchBelongsToCurrentTenant(customer.getBranch().getId());

        SalesChannel salesChannel = salesChannelRepository.findById(request.getSalesChannelId())
                .orElseThrow(() -> new IllegalArgumentException("Canal no encontrado"));

        validateSaleCreateAccess(userId, salesChannel.getCode(), branch.getId());

        if (repository.existsByItemIdAndStatus(item.getId(), SaleStatus.ACTIVE)) {
            throw new IllegalArgumentException("El item ya fue vendido");
        }

        Reservation activeReservation = reservationRepository
                .findByItemIdAndStatus(item.getId(), ReservationStatus.ACTIVE)
                .orElse(null);

        if (item.getStatus() == ItemStatus.AVAILABLE) {
            // venta directa
        } else if (item.getStatus() == ItemStatus.RESERVED) {
            validateReservedItemForSale(item, customer, branch, activeReservation);
        } else {
            throw new IllegalArgumentException("El item no está disponible para venta");
        }

        CustomerOrder order = resolveCustomerOrderForSale(request, customer, branch, activeReservation);

        Sale sale = new Sale();
        sale.setItem(item);
        sale.setCustomer(customer);
        sale.setBranch(branch);
        sale.setSellerUserId(request.getSellerUserId());
        sale.setCustomerOrderId(order.getId());
        sale.setSalesChannel(salesChannel);
        sale.setPrice(request.getPrice());
        sale.setStatus(SaleStatus.ACTIVE);
        sale.setPaymentStatus(SalePaymentStatus.UNPAID);
        sale.setCreatedByUserId(request.getCreatedByUserId());

        Sale savedSale = repository.save(sale);

        item.setStatus(ItemStatus.RESERVED);
        itemRepository.save(item);

        if (activeReservation != null) {
            migrateReservationPaymentsToSale(activeReservation, savedSale);
            activeReservation.setStatus(ReservationStatus.CONVERTED_TO_SALE);
            reservationRepository.save(activeReservation);
        }

        customerOrderService.addSaleToOpenOrder(savedSale);
        syncSalePaymentStatusById(savedSale.getId());
        customerOrderService.refreshStatus(order.getId());

        return toResponse(savedSale);
    }

    public SaleResponse cancel(Long saleId, String reason, Long cancelledByUserId) {
        Long userId = currentUser.getUserId();

        accessService.assertCan(userId, PermissionCode.CANCEL_SALE);

        Sale sale = findEntityById(saleId);

        if (sale.getStatus() != SaleStatus.ACTIVE) {
            throw new IllegalArgumentException("Solo se pueden cancelar ventas activas");
        }

        sale.setStatus(SaleStatus.CANCELLED);
        sale.setCancelledAt(LocalDateTime.now());
        sale.setCancelReason(reason);
        sale.setCancelledByUserId(userId);

        Item item = sale.getItem();
        item.setStatus(ItemStatus.AVAILABLE);
        itemRepository.save(item);

        return toResponse(repository.save(sale));
    }



    private void migrateReservationPaymentsToSale(Reservation reservation, Sale sale) {
        List<PaymentAllocation> allocations = paymentAllocationRepository
                .findByReservationIdOrderByCreatedAtAsc(reservation.getId());

        for (PaymentAllocation allocation : allocations) {
            allocation.setReservationId(null);
            allocation.setSaleId(sale.getId());
            paymentAllocationRepository.save(allocation);
        }
    }

    private BigDecimal calculateActiveAppliedToSale(Long saleId) {
        return paymentAllocationRepository.findBySaleIdOrderByCreatedAtAsc(saleId)
                .stream()
                .map(allocation -> {
                    Payment payment = paymentRepository.findById(allocation.getPaymentId())
                            .orElseThrow(() -> new IllegalArgumentException("Pago no encontrado"));
                    return payment.getStatus() == PaymentStatus.ACTIVE ? allocation.getAmount() : BigDecimal.ZERO;
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private void syncSalePaymentStatusById(Long saleId) {
        Sale sale = findEntityById(saleId);

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
        repository.save(sale);
    }

    private CustomerOrder resolveCustomerOrderForSale(CreateSaleRequest request,
                                                      Customer customer,
                                                      Branch branch,
                                                      Reservation activeReservation) {
        CustomerOrder order;

        if (request.getCustomerOrderId() != null) {
            order = customerOrderService.findEntityById(request.getCustomerOrderId());
        } else if (activeReservation != null) {
            order = customerOrderService.getOrderForReservation(activeReservation);
        } else {
            order = customerOrderService.getOrCreateOpenOrder(customer, branch);
        }

        if (!order.getCustomer().getId().equals(customer.getId())) {
            throw new IllegalArgumentException("El pedido no pertenece al cliente de la venta");
        }

        if (!order.getBranch().getId().equals(branch.getId())) {
            throw new IllegalArgumentException("El pedido no pertenece a la sucursal de la venta");
        }

        return order;
    }

    private void validateCreateRequest(CreateSaleRequest request) {
        if (request.getCreatedByUserId() == null) {
            throw new IllegalArgumentException("createdByUserId es obligatorio");
        }

        if (request.getPrice() == null || request.getPrice().signum() <= 0) {
            throw new IllegalArgumentException("price debe ser mayor a 0");
        }
    }

    private void validateSaleCreateAccess(Long userId, String salesChannelCode, Long branchId) {
        if (ChannelCode.DOOR_SALE.equals(salesChannelCode)) {
            accessService.assertCan(
                    userId,
                    PermissionCode.DO_DOOR_SALE,
                    ChannelCode.DOOR_SALE,
                    branchId
            );
            return;
        }

        throw new IllegalArgumentException("Canal no permitido para ventas: " + salesChannelCode);
    }

    private void validateReservedItemForSale(Item item,
                                             Customer customer,
                                             Branch branch,
                                             Reservation activeReservation) {
        if (activeReservation == null) {
            throw new IllegalArgumentException("El item está RESERVED pero no tiene una reserva activa");
        }

        if (!activeReservation.getCustomer().getId().equals(customer.getId())) {
            throw new IllegalArgumentException("El item está reservado para otro cliente");
        }

        if (!activeReservation.getBranch().getId().equals(branch.getId())) {
            throw new IllegalArgumentException("La reserva pertenece a otra sucursal");
        }

        if (!activeReservation.getItem().getId().equals(item.getId())) {
            throw new IllegalArgumentException("La reserva activa no corresponde al item");
        }
    }

    private Sale findEntityById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Venta no encontrada con id: " + id));
    }

    private void assertSaleBelongsToCurrentTenant(Sale sale) {
        assertBranchBelongsToCurrentTenant(sale.getBranch().getId());
    }

    private void assertBranchBelongsToCurrentTenant(Long branchId) {
        CurrentTenantContext tenant = tenantResolver.resolveCurrent();
        tenantResolver.assertBranchBelongsToCompany(branchId, tenant.getCompanyId());
        if (tenant.getBranchId() != null && !tenant.getBranchId().equals(branchId)) {
            throw new AccessDeniedException("La venta no pertenece a la sucursal activa");
        }
    }

    private SaleResponse toResponse(Sale sale) {
        return new SaleResponse(
                sale.getId(),
                sale.getItem().getId(),
                sale.getItem().getCode(),
                sale.getCustomer().getId(),
                sale.getCustomer().getName(),
                sale.getBranch().getId(),
                sale.getBranch().getCode(),
                sale.getSellerUserId(),
                sale.getCustomerOrderId(),
                sale.getSalesChannel().getId(),
                sale.getSalesChannel().getCode(),
                sale.getPrice(),
                sale.getStatus().name(),
                sale.getPaymentStatus().name(),
                sale.getCreatedAt(),
                sale.getCreatedByUserId(),
                sale.getCancelledAt(),
                sale.getCancelReason(),
                sale.getCancelledByUserId()
        );
    }
}
