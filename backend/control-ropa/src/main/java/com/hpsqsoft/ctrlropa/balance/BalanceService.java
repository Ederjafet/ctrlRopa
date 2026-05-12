package com.hpsqsoft.ctrlropa.balance;

import com.hpsqsoft.ctrlropa.order.CustomerOrder;
import com.hpsqsoft.ctrlropa.order.CustomerOrderRepository;
import com.hpsqsoft.ctrlropa.order.CustomerOrderService;
import com.hpsqsoft.ctrlropa.order.CustomerOrderSettlementResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hpsqsoft.ctrlropa.customer.Customer;
import com.hpsqsoft.ctrlropa.customer.CustomerRepository;
import com.hpsqsoft.ctrlropa.customerpackage.CustomerPackage;
import com.hpsqsoft.ctrlropa.customerpackage.CustomerPackageRepository;
import com.hpsqsoft.ctrlropa.security.access.AccessService;
import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import com.hpsqsoft.ctrlropa.security.access.PermissionCode;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional
public class BalanceService {

    private final CustomerBalanceMovementRepository repository;
    private final CustomerOrderRepository customerOrderRepository;
    private final CustomerOrderService customerOrderService;

    private final CustomerRepository customerRepository;
    private final CustomerPackageRepository customerPackageRepository;
    private final AccessService accessService;
    private final CurrentUser currentUser;

    public BalanceService(CustomerBalanceMovementRepository repository,
                          CustomerOrderRepository customerOrderRepository,
                          CustomerOrderService customerOrderService,
                          CustomerRepository customerRepository,
                          CustomerPackageRepository customerPackageRepository,
                          AccessService accessService,
                          CurrentUser currentUser) {
        this.repository = repository;
        this.customerOrderRepository = customerOrderRepository;
        this.customerOrderService = customerOrderService;
        this.customerRepository = customerRepository;
        this.customerPackageRepository = customerPackageRepository;
        this.accessService = accessService;
        this.currentUser = currentUser;
    }

    public CustomerBalanceMovement registerOverage(Long customerId,
                                                   Long branchId,
                                                   BigDecimal amount,
                                                   Long paymentId,
                                                   Long createdByUserId,
                                                   String notes) {
        validatePositiveAmount(amount);

        CustomerBalanceMovement movement = new CustomerBalanceMovement();
        movement.setCustomerId(customerId);
        movement.setBranchId(branchId);
        movement.setType(CustomerBalanceMovementType.PAYMENT_OVERAGE);
        movement.setAmount(amount);
        movement.setPaymentId(paymentId);
        movement.setCustomerOrderId(null);
        movement.setNotes(notes);
        movement.setCreatedByUserId(createdByUserId);

        return repository.save(movement);
    }

    public CustomerBalanceMovement registerRefundStoreCredit(Long customerId,
                                                             Long branchId,
                                                             BigDecimal amount,
                                                             Long createdByUserId,
                                                             String notes) {
        validatePositiveAmount(amount);

        CustomerBalanceMovement movement = new CustomerBalanceMovement();
        movement.setCustomerId(customerId);
        movement.setBranchId(branchId);
        movement.setType(CustomerBalanceMovementType.REFUND_STORE_CREDIT);
        movement.setAmount(amount);
        movement.setPaymentId(null);
        movement.setCustomerOrderId(null);
        movement.setNotes(notes);
        movement.setCreatedByUserId(createdByUserId);

        return repository.save(movement);
    }

    public CustomerOrderSettlementResponse applyToOrder(ApplyBalanceToOrderRequest request) {
        Long userId = currentUser.getUserId();
        accessService.assertCan(userId, PermissionCode.APPLY_CUSTOMER_BALANCE);
        request.setCreatedByUserId(userId);

        validatePositiveAmount(request.getAmount());

        CustomerOrder order = customerOrderRepository.findById(request.getCustomerOrderId())
                .orElseThrow(() -> new IllegalArgumentException("Orden no encontrada"));

        Long customerId = order.getCustomer().getId();
        BigDecimal availableBalance = getAvailableBalance(customerId);
        CustomerOrderSettlementResponse settlement = customerOrderService.getSettlement(order.getId());

        if (settlement.getPending().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("La orden ya no tiene saldo pendiente");
        }

        if (request.getAmount().compareTo(availableBalance) > 0) {
            throw new IllegalArgumentException("El monto excede el saldo disponible");
        }

        if (request.getAmount().compareTo(settlement.getPending()) > 0) {
            throw new IllegalArgumentException("El monto excede el saldo pendiente de la orden");
        }

        CustomerBalanceMovement movement = new CustomerBalanceMovement();
        movement.setCustomerId(customerId);
        movement.setBranchId(order.getBranch().getId());
        movement.setType(CustomerBalanceMovementType.APPLIED_TO_ORDER);
        movement.setAmount(request.getAmount());
        movement.setPaymentId(null);
        movement.setCustomerOrderId(order.getId());
        movement.setNotes(request.getNotes());
        movement.setCreatedByUserId(request.getCreatedByUserId());

        repository.save(movement);

        customerOrderService.refreshStatus(order.getId());

        return customerOrderService.getSettlement(order.getId());
    }

    public ReverseBalanceApplicationResponse reverseApplication(ReverseBalanceApplicationRequest request) {
        Long userId = currentUser.getUserId();
        accessService.assertCan(userId, PermissionCode.APPLY_CUSTOMER_BALANCE);
        request.setCreatedByUserId(userId);

        CustomerBalanceMovement original = repository.findById(request.getMovementId())
                .orElseThrow(() -> new IllegalArgumentException("Movimiento no encontrado"));

        if (original.getType() != CustomerBalanceMovementType.APPLIED_TO_ORDER) {
            throw new IllegalArgumentException("Solo se pueden revertir aplicaciones a orden");
        }

        if (original.getCustomerOrderId() == null) {
            throw new IllegalArgumentException("El movimiento no está ligado a una orden");
        }

        if (original.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Solo se puede revertir un movimiento de aplicación positivo");
        }

        CustomerOrder order = customerOrderRepository.findById(original.getCustomerOrderId())
                .orElseThrow(() -> new IllegalArgumentException("Orden no encontrada"));

        String prefix = reversalPrefixForApplication(original.getId());

        boolean alreadyReversed = repository
                .findByCustomerOrderIdAndTypeOrderByCreatedAtAsc(order.getId(), CustomerBalanceMovementType.APPLIED_TO_ORDER)
                .stream()
                .anyMatch(m ->
                        m.getAmount().compareTo(original.getAmount().negate()) == 0 &&
                                m.getCustomerId().equals(original.getCustomerId()) &&
                                m.getBranchId().equals(original.getBranchId()) &&
                                m.getNotes() != null &&
                                m.getNotes().startsWith(prefix)
                );

        if (alreadyReversed) {
            throw new IllegalArgumentException("Ese movimiento ya fue revertido");
        }

        CustomerBalanceMovement reversal = new CustomerBalanceMovement();
        reversal.setCustomerId(original.getCustomerId());
        reversal.setBranchId(original.getBranchId());
        reversal.setType(CustomerBalanceMovementType.APPLIED_TO_ORDER);
        reversal.setAmount(original.getAmount().negate());
        reversal.setPaymentId(null);
        reversal.setCustomerOrderId(original.getCustomerOrderId());
        reversal.setNotes(buildApplicationReversalNote(original.getId(), request.getNotes()));
        reversal.setCreatedByUserId(request.getCreatedByUserId());

        CustomerBalanceMovement savedReversal = repository.save(reversal);

        customerOrderService.refreshStatus(order.getId());

        CustomerOrderSettlementResponse settlement = customerOrderService.getSettlement(order.getId());

        return new ReverseBalanceApplicationResponse(settlement, savedReversal);
    }

    public void reverseOverageForPayment(Long paymentId, Long createdByUserId, String reason) {
        List<CustomerBalanceMovement> overages = repository
                .findByPaymentIdAndTypeOrderByCreatedAtAsc(paymentId, CustomerBalanceMovementType.PAYMENT_OVERAGE);

        for (CustomerBalanceMovement original : overages) {
            if (original.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }

            String prefix = reversalPrefixForOverage(original.getId());

            boolean alreadyReversed = repository
                    .findByPaymentIdAndTypeOrderByCreatedAtAsc(paymentId, CustomerBalanceMovementType.PAYMENT_OVERAGE)
                    .stream()
                    .anyMatch(m ->
                            m.getAmount().compareTo(original.getAmount().negate()) == 0 &&
                                    m.getCustomerId().equals(original.getCustomerId()) &&
                                    m.getBranchId().equals(original.getBranchId()) &&
                                    m.getNotes() != null &&
                                    m.getNotes().startsWith(prefix)
                    );

            if (alreadyReversed) {
                continue;
            }

            CustomerBalanceMovement reversal = new CustomerBalanceMovement();
            reversal.setCustomerId(original.getCustomerId());
            reversal.setBranchId(original.getBranchId());
            reversal.setType(CustomerBalanceMovementType.PAYMENT_OVERAGE);
            reversal.setAmount(original.getAmount().negate());
            reversal.setPaymentId(paymentId);
            reversal.setCustomerOrderId(null);
            reversal.setNotes(buildOverageReversalNote(original.getId(), reason));
            reversal.setCreatedByUserId(createdByUserId);

            repository.save(reversal);
        }
    }

    @Transactional(readOnly = true)
    public BigDecimal getAvailableBalance(Long customerId) {
        List<CustomerBalanceMovement> movements = repository.findByCustomerIdOrderByCreatedAtDesc(customerId);

        return movements.stream()
                .map(this::signedAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Transactional(readOnly = true)
    public List<CustomerBalanceMovement> history(Long customerId) {
        return repository.findByCustomerIdOrderByCreatedAtDesc(customerId);
    }

    @Transactional(readOnly = true)
    public BalanceSummaryResponse getBalanceByCustomerPhone(Long branchId, String phone) {
        Customer customer = customerRepository.findByBranchIdAndPhone(branchId, phone)
                .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado con teléfono: " + phone));

        return new BalanceSummaryResponse(
                customer.getId(),
                getAvailableBalance(customer.getId())
        );
    }

    @Transactional(readOnly = true)
    public BalanceSummaryResponse getBalanceByPackageFolio(String folio) {
        CustomerPackage customerPackage = customerPackageRepository.findByFolio(folio)
                .orElseThrow(() -> new IllegalArgumentException("Paquete no encontrado con folio: " + folio));

        return new BalanceSummaryResponse(
                customerPackage.getCustomer().getId(),
                getAvailableBalance(customerPackage.getCustomer().getId())
        );
    }

    private BigDecimal signedAmount(CustomerBalanceMovement movement) {
        return switch (movement.getType()) {
            case PAYMENT_OVERAGE, REFUND_STORE_CREDIT, MANUAL_ADJUSTMENT -> movement.getAmount();
            case APPLIED_TO_ORDER -> movement.getAmount().negate();
        };
    }

    private void validatePositiveAmount(BigDecimal amount) {
        if (amount == null || amount.signum() <= 0) {
            throw new IllegalArgumentException("amount debe ser mayor a 0");
        }
    }

    private String reversalPrefixForApplication(Long movementId) {
        return "REVERSAL_OF_APPLICATION:" + movementId;
    }

    private String buildApplicationReversalNote(Long movementId, String notes) {
        String prefix = reversalPrefixForApplication(movementId);
        if (notes == null || notes.isBlank()) {
            return prefix;
        }
        return prefix + " | " + notes;
    }

    private String reversalPrefixForOverage(Long movementId) {
        return "REVERSAL_OF_OVERAGE:" + movementId;
    }

    private String buildOverageReversalNote(Long movementId, String reason) {
        String prefix = reversalPrefixForOverage(movementId);
        if (reason == null || reason.isBlank()) {
            return prefix;
        }
        return prefix + " | " + reason;
    }
}