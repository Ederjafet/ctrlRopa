package com.hpsqsoft.ctrlropa.refund;

import com.hpsqsoft.ctrlropa.balance.BalanceService;
import com.hpsqsoft.ctrlropa.item.Item;
import com.hpsqsoft.ctrlropa.item.ItemRepository;
import com.hpsqsoft.ctrlropa.payment.Payment;
import com.hpsqsoft.ctrlropa.payment.PaymentAllocation;
import com.hpsqsoft.ctrlropa.payment.PaymentAllocationRepository;
import com.hpsqsoft.ctrlropa.payment.PaymentRepository;
import com.hpsqsoft.ctrlropa.payment.PaymentStatus;
import com.hpsqsoft.ctrlropa.returns.CustomerReturn;
import com.hpsqsoft.ctrlropa.returns.CustomerReturnRepository;
import com.hpsqsoft.ctrlropa.returns.ReturnStatus;
import com.hpsqsoft.ctrlropa.sale.Sale;
import com.hpsqsoft.ctrlropa.sale.SaleRepository;
import com.hpsqsoft.ctrlropa.sale.SaleStatus;
import com.hpsqsoft.ctrlropa.security.access.AccessService;
import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import com.hpsqsoft.ctrlropa.security.access.PermissionCode;
import com.hpsqsoft.ctrlropa.tenant.CurrentTenantContext;
import com.hpsqsoft.ctrlropa.tenant.TenantAccessGuard;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class RefundService {

    private final RefundRepository refundRepository;
    private final CustomerReturnRepository returnRepository;
    private final PaymentAllocationRepository allocationRepository;
    private final PaymentRepository paymentRepository;
    private final BalanceService balanceService;
    private final ItemRepository itemRepository;
    private final SaleRepository saleRepository;
    private final AccessService accessService;
    private final CurrentUser currentUser;
    private final TenantAccessGuard tenantAccessGuard;

    public RefundService(RefundRepository refundRepository,
                         CustomerReturnRepository returnRepository,
                         PaymentAllocationRepository allocationRepository,
                         PaymentRepository paymentRepository,
                         BalanceService balanceService,
                         ItemRepository itemRepository,
                         SaleRepository saleRepository,
                         AccessService accessService,
                         CurrentUser currentUser,
                         TenantAccessGuard tenantAccessGuard) {
        this.refundRepository = refundRepository;
        this.returnRepository = returnRepository;
        this.allocationRepository = allocationRepository;
        this.paymentRepository = paymentRepository;
        this.balanceService = balanceService;
        this.itemRepository = itemRepository;
        this.saleRepository = saleRepository;
        this.accessService = accessService;
        this.currentUser = currentUser;
        this.tenantAccessGuard = tenantAccessGuard;
    }

    public RefundResponse create(CreateRefundRequest request) {
        Long userId = currentUser.getUserId();

        accessService.assertCan(userId, PermissionCode.REQUEST_REFUND);
        request.setCreatedByUserId(userId);

        validatePositiveAmount(request.getAmount());

        CustomerReturn customerReturn = returnRepository.findById(request.getReturnId())
                .orElseThrow(() -> new IllegalArgumentException("Devolución no encontrada"));

        if (customerReturn.getStatus() != ReturnStatus.PROCESSED) {
            throw new IllegalArgumentException("Solo se puede crear refund sobre una devolución PROCESSED");
        }

        Sale sale = customerReturn.getSale();
        tenantAccessGuard.requireBranch(sale.getBranch().getId(), "La devolucion no pertenece a la sucursal activa");

        BigDecimal refundableAvailable = calculateRefundableAvailable(sale.getId());

        if (request.getAmount().compareTo(refundableAvailable) > 0) {
            throw new IllegalArgumentException("El monto del refund excede el monto disponible para devolución");
        }

        Refund refund = new Refund();
        refund.setCustomerReturn(customerReturn);
        refund.setCustomerId(sale.getCustomer().getId());
        refund.setCustomerOrderId(sale.getCustomerOrderId());
        refund.setBranchId(sale.getBranch().getId());
        refund.setAmount(request.getAmount());
        refund.setMethod(request.getMethod());
        refund.setStatus(RefundStatus.PENDING);
        refund.setReason(request.getReason());
        refund.setNotes(request.getNotes());
        refund.setCreatedByUserId(userId);

        return toResponse(refundRepository.save(refund));
    }

    public RefundResponse approve(Long refundId, ApproveRefundRequest request) {
        Long userId = currentUser.getUserId();

        accessService.assertCan(userId, PermissionCode.APPROVE_REFUND);
        request.setApprovedByUserId(userId);

        Refund refund = findEntity(refundId);

        if (refund.getStatus() != RefundStatus.PENDING) {
            throw new IllegalArgumentException("Solo se pueden aprobar refunds PENDING");
        }

        refund.setStatus(RefundStatus.APPROVED);
        refund.setApprovedAt(LocalDateTime.now());
        refund.setApprovedByUserId(userId);

        return toResponse(refundRepository.save(refund));
    }

    public RefundResponse process(Long refundId, ProcessRefundRequest request) {
        Long userId = currentUser.getUserId();

        accessService.assertCan(userId, PermissionCode.PROCESS_REFUND);
        request.setProcessedByUserId(userId);

        Refund refund = findEntity(refundId);

        if (refund.getStatus() != RefundStatus.APPROVED) {
            throw new IllegalArgumentException("Solo se pueden procesar refunds APPROVED");
        }

        BigDecimal refundableAvailable = calculateRefundableAvailable(refund.getCustomerReturn().getSale().getId());

        if (refund.getAmount().compareTo(refundableAvailable) > 0) {
            throw new IllegalArgumentException("El monto del refund excede el monto disponible para devolución");
        }

        if (refund.getMethod() == RefundMethod.STORE_CREDIT) {
            balanceService.registerRefundStoreCredit(
                    refund.getCustomerId(),
                    refund.getBranchId(),
                    refund.getAmount(),
                    userId,
                    "Saldo generado por refund " + refund.getId()
            );
        }

        refund.setStatus(RefundStatus.PROCESSED);
        refund.setProcessedAt(LocalDateTime.now());
        refund.setProcessedByUserId(userId);

        return toResponse(refundRepository.save(refund));
    }

    public RefundResponse cancel(Long refundId, CancelRefundRequest request) {
        Long userId = currentUser.getUserId();

        accessService.assertCan(userId, PermissionCode.CANCEL_REFUND);
        request.setCancelledByUserId(userId);

        Refund refund = findEntity(refundId);

        if (refund.getStatus() == RefundStatus.PROCESSED || refund.getStatus() == RefundStatus.CANCELLED) {
            throw new IllegalArgumentException("No se puede cancelar un refund finalizado");
        }

        refund.setStatus(RefundStatus.CANCELLED);
        refund.setCancelledAt(LocalDateTime.now());
        refund.setCancelledByUserId(userId);
        refund.setCancelReason(request.getReason());

        return toResponse(refundRepository.save(refund));
    }

    @Transactional(readOnly = true)
    public RefundResponse findById(Long id) {
        return toResponse(findEntity(id));
    }

    @Transactional(readOnly = true)
    public List<RefundResponse> findByReturn(Long returnId) {
        CustomerReturn customerReturn = returnRepository.findById(returnId)
                .orElseThrow(() -> new IllegalArgumentException("Devolucion no encontrada"));
        tenantAccessGuard.requireBranch(customerReturn.getSale().getBranch().getId(), "La devolucion no pertenece a la sucursal activa");
        return refundRepository.findByCustomerReturnIdOrderByCreatedAtDesc(returnId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RefundResponse> findByCustomer(Long customerId) {
        validateCustomerRefundAccess(customerId);
        return refundRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RefundResponse> findByStatus(RefundStatus status) {
        CurrentTenantContext tenant = tenantAccessGuard.requireCurrentTenant();
        return refundRepository.findByStatusOrderByCreatedAtDesc(status)
                .stream()
                .filter(refund -> tenant.getBranchId() == null || tenant.getBranchId().equals(refund.getBranchId()))
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public RefundLookupResponse lookupByItemCode(String code) {
        Item item = itemRepository.findByCompanyIdAndCode(
                        tenantAccessGuard.requireCurrentTenant().getCompanyId(),
                        code)
                .orElseThrow(() -> new IllegalArgumentException("Item no encontrado con código: " + code));

        return buildLookup(item);
    }

    @Transactional(readOnly = true)
    public RefundLookupResponse lookupByQrCode(String qrCode) {
        Item item = itemRepository.findByCompanyIdAndQrCode(
                        tenantAccessGuard.requireCurrentTenant().getCompanyId(),
                        qrCode)
                .orElseThrow(() -> new IllegalArgumentException("Item no encontrado con QR: " + qrCode));

        return buildLookup(item);
    }

    private RefundLookupResponse buildLookup(Item item) {
        Sale sale = saleRepository.findByItemIdAndStatus(item.getId(), SaleStatus.ACTIVE)
                .orElse(null);

        if (sale == null) {
            throw new IllegalArgumentException("El item no tiene una venta activa");
        }

        CustomerReturn customerReturn = returnRepository
                .findBySaleIdOrderByCreatedAtDesc(sale.getId())
                .stream()
                .findFirst()
                .orElse(null);

        BigDecimal totalPaid = calculatePaidForSale(sale.getId());
        BigDecimal totalRefunded = calculateProcessedRefundsForSale(sale.getId());

        BigDecimal refundableAvailable = totalPaid.subtract(totalRefunded);
        if (refundableAvailable.signum() < 0) {
            refundableAvailable = BigDecimal.ZERO;
        }

        return new RefundLookupResponse(
                item.getId(),
                item.getCode(),
                sale.getId(),
                sale.getPrice(),
                totalPaid,
                totalRefunded,
                refundableAvailable,
                customerReturn != null ? customerReturn.getId() : null,
                customerReturn != null ? customerReturn.getStatus().name() : null
        );
    }

    private Refund findEntity(Long id) {
        Refund refund = refundRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Refund no encontrado con id: " + id));
        tenantAccessGuard.requireBranch(refund.getBranchId(), "El refund no pertenece a la sucursal activa");
        return refund;
    }

    private void validateCustomerRefundAccess(Long customerId) {
        refundRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)
                .stream()
                .findFirst()
                .ifPresent(refund -> tenantAccessGuard.requireBranch(
                        refund.getBranchId(),
                        "El cliente no pertenece a la sucursal activa"
                ));
    }

    private void validatePositiveAmount(BigDecimal amount) {
        if (amount == null || amount.signum() <= 0) {
            throw new IllegalArgumentException("amount debe ser mayor a 0");
        }
    }

    private BigDecimal calculateRefundableAvailable(Long saleId) {
        BigDecimal paid = calculatePaidForSale(saleId);
        BigDecimal alreadyRefunded = calculateProcessedRefundsForSale(saleId);

        BigDecimal available = paid.subtract(alreadyRefunded);
        return available.signum() < 0 ? BigDecimal.ZERO : available;
    }

    private BigDecimal calculatePaidForSale(Long saleId) {
        BigDecimal total = BigDecimal.ZERO;

        List<PaymentAllocation> allocations = allocationRepository.findBySaleIdOrderByCreatedAtAsc(saleId);

        for (PaymentAllocation allocation : allocations) {
            Payment payment = paymentRepository.findById(allocation.getPaymentId())
                    .orElseThrow(() -> new IllegalArgumentException("Pago no encontrado"));

            if (payment.getStatus() == PaymentStatus.ACTIVE) {
                total = total.add(allocation.getAmount());
            }
        }

        return total;
    }

    private BigDecimal calculateProcessedRefundsForSale(Long saleId) {
        return refundRepository.findByStatusOrderByCreatedAtDesc(RefundStatus.PROCESSED)
                .stream()
                .filter(refund -> refund.getCustomerReturn().getSale().getId().equals(saleId))
                .map(Refund::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private RefundResponse toResponse(Refund refund) {
        return new RefundResponse(
                refund.getId(),
                refund.getCustomerReturn().getId(),
                refund.getCustomerReturn().getSale().getId(),
                refund.getCustomerId(),
                refund.getCustomerOrderId(),
                refund.getBranchId(),
                refund.getAmount(),
                refund.getMethod().name(),
                refund.getStatus().name(),
                refund.getReason(),
                refund.getNotes(),
                refund.getCreatedByUserId(),
                refund.getApprovedByUserId(),
                refund.getProcessedByUserId(),
                refund.getCancelledByUserId(),
                refund.getCreatedAt(),
                refund.getApprovedAt(),
                refund.getProcessedAt(),
                refund.getCancelledAt(),
                refund.getCancelReason()
        );
    }
}
