package com.hpsqsoft.ctrlropa.payment;

import com.hpsqsoft.ctrlropa.balance.BalanceService;
import com.hpsqsoft.ctrlropa.catalog.PaymentMethodRepository;
import com.hpsqsoft.ctrlropa.catalog.PaymentMethod;
import com.hpsqsoft.ctrlropa.customerpackage.CustomerPackageItemRepository;
import com.hpsqsoft.ctrlropa.customerpackage.CustomerPackageRepository;
import com.hpsqsoft.ctrlropa.item.ItemRepository;
import com.hpsqsoft.ctrlropa.order.CustomerOrderService;
import com.hpsqsoft.ctrlropa.reservation.ReservationRepository;
import com.hpsqsoft.ctrlropa.sale.SaleRepository;
import com.hpsqsoft.ctrlropa.security.access.AccessService;
import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import com.hpsqsoft.ctrlropa.security.access.PermissionCode;
import com.hpsqsoft.ctrlropa.tenant.CurrentTenantContext;
import com.hpsqsoft.ctrlropa.tenant.TenantResolver;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PaymentServiceAccessTests {

    private final PaymentRepository paymentRepository = mock(PaymentRepository.class);
    private final PaymentAllocationRepository allocationRepository = mock(PaymentAllocationRepository.class);
    private final PaymentMethodRepository paymentMethodRepository = mock(PaymentMethodRepository.class);
    private final SaleRepository saleRepository = mock(SaleRepository.class);
    private final ReservationRepository reservationRepository = mock(ReservationRepository.class);
    private final CustomerOrderService customerOrderService = mock(CustomerOrderService.class);
    private final BalanceService balanceService = mock(BalanceService.class);
    private final ItemRepository itemRepository = mock(ItemRepository.class);
    private final CustomerPackageRepository customerPackageRepository = mock(CustomerPackageRepository.class);
    private final CustomerPackageItemRepository customerPackageItemRepository = mock(CustomerPackageItemRepository.class);
    private final AccessService accessService = mock(AccessService.class);
    private final CurrentUser currentUser = mock(CurrentUser.class);
    private final TenantResolver tenantResolver = mock(TenantResolver.class);

    private final PaymentService service = new PaymentService(
            paymentRepository,
            allocationRepository,
            paymentMethodRepository,
            saleRepository,
            reservationRepository,
            customerOrderService,
            balanceService,
            itemRepository,
            customerPackageRepository,
            customerPackageItemRepository,
            accessService,
            currentUser,
            tenantResolver
    );

    @Test
    void findPaymentWithoutViewPaymentsPermissionIsRejected() {
        when(currentUser.getUserId()).thenReturn(99L);
        doThrow(new AccessDeniedException("missing"))
                .when(accessService)
                .assertCan(99L, PermissionCode.VIEW_PAYMENTS);

        assertThrows(AccessDeniedException.class, () -> service.findById(1L));
    }

    @Test
    void findPaymentsByCustomerWithoutViewPaymentsPermissionIsRejected() {
        when(currentUser.getUserId()).thenReturn(99L);
        doThrow(new AccessDeniedException("missing"))
                .when(accessService)
                .assertCan(99L, PermissionCode.VIEW_PAYMENTS);

        assertThrows(AccessDeniedException.class, () -> service.findByCustomer(1L));
    }

    @Test
    void findPaymentByIdFromAnotherActiveBranchIsRejected() {
        when(currentUser.getUserId()).thenReturn(99L);
        when(paymentRepository.findById(1L)).thenReturn(Optional.of(payment(1L, 4L)));
        when(tenantResolver.resolveCurrent()).thenReturn(tenant(2L, 6L));

        assertThrows(AccessDeniedException.class, () -> service.findById(1L));
    }

    @Test
    void findPaymentByIdFromActiveBranchIsAllowed() {
        when(currentUser.getUserId()).thenReturn(99L);
        when(paymentRepository.findById(1L)).thenReturn(Optional.of(payment(1L, 6L)));
        when(tenantResolver.resolveCurrent()).thenReturn(tenant(2L, 6L));
        when(paymentMethodRepository.findById(10L)).thenReturn(Optional.of(paymentMethod(10L)));
        when(allocationRepository.findByPaymentIdOrderByCreatedAtAsc(1L)).thenReturn(List.of());

        PaymentResponse response = service.findById(1L);

        assertEquals(6L, response.getBranchId());
    }

    private static CurrentTenantContext tenant(Long companyId, Long branchId) {
        return new CurrentTenantContext(companyId, "QA_A", "Empresa QA A", branchId, "QA_A_CTR", "QA A Centro", 99L);
    }

    private static Payment payment(Long id, Long branchId) {
        Payment payment = new Payment();
        ReflectionTestUtils.setField(payment, "id", id);
        payment.setCustomerId(20L);
        payment.setBranchId(branchId);
        payment.setReceivedAmount(BigDecimal.valueOf(100));
        payment.setPaymentMethodId(10L);
        payment.setReference("QA");
        payment.setStatus(PaymentStatus.ACTIVE);
        payment.setCreatedByUserId(99L);
        ReflectionTestUtils.setField(payment, "createdAt", LocalDateTime.now());
        return payment;
    }

    private static PaymentMethod paymentMethod(Long id) {
        PaymentMethod method = new PaymentMethod();
        method.setId(id);
        method.setCode("CASH");
        method.setName("Efectivo");
        return method;
    }
}
