package com.hpsqsoft.ctrlropa.payment;

import com.hpsqsoft.ctrlropa.balance.BalanceService;
import com.hpsqsoft.ctrlropa.branch.Branch;
import com.hpsqsoft.ctrlropa.catalog.PaymentMethodRepository;
import com.hpsqsoft.ctrlropa.catalog.PaymentMethod;
import com.hpsqsoft.ctrlropa.customer.Customer;
import com.hpsqsoft.ctrlropa.customerpackage.CustomerPackageItemRepository;
import com.hpsqsoft.ctrlropa.customerpackage.CustomerPackageRepository;
import com.hpsqsoft.ctrlropa.item.ItemRepository;
import com.hpsqsoft.ctrlropa.live.Live;
import com.hpsqsoft.ctrlropa.order.CustomerOrderService;
import com.hpsqsoft.ctrlropa.reservation.Reservation;
import com.hpsqsoft.ctrlropa.reservation.ReservationRepository;
import com.hpsqsoft.ctrlropa.reservation.ReservationStatus;
import com.hpsqsoft.ctrlropa.sale.SaleRepository;
import com.hpsqsoft.ctrlropa.security.access.AccessService;
import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import com.hpsqsoft.ctrlropa.security.access.PermissionCode;
import com.hpsqsoft.ctrlropa.tenant.CurrentTenantContext;
import com.hpsqsoft.ctrlropa.tenant.TenantResolver;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
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

    @Test
    void findPaymentsByCustomerFromAnotherActiveBranchIsRejected() {
        when(currentUser.getUserId()).thenReturn(99L);
        when(paymentRepository.findByCustomerIdOrderByCreatedAtDesc(20L)).thenReturn(List.of(payment(1L, 4L)));
        when(tenantResolver.resolveCurrent()).thenReturn(tenant(2L, 6L));

        assertThrows(AccessDeniedException.class, () -> service.findByCustomer(20L));
    }

    @Test
    void createPaymentForActiveLiveReservationCreatesReservationAllocationWithoutTouchingSale() {
        List<PaymentAllocation> savedAllocations = new ArrayList<>();
        Reservation reservation = liveReservation(45L, 20L, 6L, BigDecimal.valueOf(250));

        when(currentUser.getUserId()).thenReturn(99L);
        when(paymentMethodRepository.findById(10L)).thenReturn(Optional.of(paymentMethod(10L)));
        when(reservationRepository.findById(45L)).thenReturn(Optional.of(reservation));
        when(tenantResolver.resolveCurrent()).thenReturn(tenant(2L, 6L));
        when(customerOrderService.findOrderIdByReservationId(45L)).thenReturn(14L);
        when(allocationRepository.findByReservationIdOrderByCreatedAtAsc(45L)).thenReturn(List.of());
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> {
            Payment payment = invocation.getArgument(0);
            ReflectionTestUtils.setField(payment, "id", 501L);
            ReflectionTestUtils.setField(payment, "createdAt", LocalDateTime.now());
            return payment;
        });
        when(allocationRepository.save(any(PaymentAllocation.class))).thenAnswer(invocation -> {
            PaymentAllocation allocation = invocation.getArgument(0);
            ReflectionTestUtils.setField(allocation, "id", 701L);
            ReflectionTestUtils.setField(allocation, "createdAt", LocalDateTime.now());
            savedAllocations.add(allocation);
            return allocation;
        });
        when(allocationRepository.findByPaymentIdOrderByCreatedAtAsc(501L)).thenAnswer(invocation -> savedAllocations);

        PaymentResponse response = service.create(paymentRequestForReservation(45L, BigDecimal.valueOf(100)));

        assertEquals(501L, response.getId());
        assertEquals(20L, response.getCustomerId());
        assertEquals(6L, response.getBranchId());
        assertEquals(1, response.getAllocations().size());
        assertEquals(45L, response.getAllocations().get(0).getReservationId());
        assertEquals(null, response.getAllocations().get(0).getSaleId());
        assertEquals(0, BigDecimal.valueOf(100).compareTo(response.getAllocations().get(0).getAmount()));

        ArgumentCaptor<Payment> paymentCaptor = ArgumentCaptor.forClass(Payment.class);
        verify(paymentRepository).save(paymentCaptor.capture());
        assertEquals(20L, paymentCaptor.getValue().getCustomerId());
        assertEquals(6L, paymentCaptor.getValue().getBranchId());
        assertEquals(PaymentStatus.ACTIVE, paymentCaptor.getValue().getStatus());

        verify(customerOrderService).refreshStatus(14L);
        verify(saleRepository, never()).findById(anyLong());
        verify(saleRepository, never()).save(any());
        verify(balanceService, never()).registerOverage(anyLong(), anyLong(), any(), anyLong(), anyLong(), any());
    }

    @Test
    void createPaymentForCancelledReservationIsRejected() {
        Reservation reservation = liveReservation(45L, 20L, 6L, BigDecimal.valueOf(250));
        reservation.setStatus(ReservationStatus.CANCELLED);

        when(currentUser.getUserId()).thenReturn(99L);
        when(paymentMethodRepository.findById(10L)).thenReturn(Optional.of(paymentMethod(10L)));
        when(reservationRepository.findById(45L)).thenReturn(Optional.of(reservation));

        assertThrows(IllegalArgumentException.class,
                () -> service.create(paymentRequestForReservation(45L, BigDecimal.valueOf(100))));

        verify(paymentRepository, never()).save(any());
        verify(allocationRepository, never()).save(any());
    }

    @Test
    void createPaymentForConvertedReservationIsRejected() {
        Reservation reservation = liveReservation(45L, 20L, 6L, BigDecimal.valueOf(250));
        reservation.setStatus(ReservationStatus.CONVERTED_TO_SALE);

        when(currentUser.getUserId()).thenReturn(99L);
        when(paymentMethodRepository.findById(10L)).thenReturn(Optional.of(paymentMethod(10L)));
        when(reservationRepository.findById(45L)).thenReturn(Optional.of(reservation));

        assertThrows(IllegalArgumentException.class,
                () -> service.create(paymentRequestForReservation(45L, BigDecimal.valueOf(100))));

        verify(paymentRepository, never()).save(any());
        verify(allocationRepository, never()).save(any());
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

    private static CreatePaymentRequest paymentRequestForReservation(Long reservationId, BigDecimal amount) {
        CreatePaymentRequest request = new CreatePaymentRequest();
        request.setReservationId(reservationId);
        request.setAmount(amount);
        request.setPaymentMethodId(10L);
        request.setCreatedByUserId(99L);
        request.setReference("PAY-LIVE-A QA");
        return request;
    }

    private static Reservation liveReservation(Long id, Long customerId, Long branchId, BigDecimal price) {
        Branch branch = new Branch();
        branch.setId(branchId);

        Customer customer = new Customer();
        ReflectionTestUtils.setField(customer, "id", customerId);
        customer.setBranch(branch);

        Live live = new Live();
        ReflectionTestUtils.setField(live, "id", 15L);
        live.setBranch(branch);

        Reservation reservation = new Reservation();
        ReflectionTestUtils.setField(reservation, "id", id);
        reservation.setBranch(branch);
        reservation.setCustomer(customer);
        reservation.setLive(live);
        reservation.setPrice(price);
        reservation.setStatus(ReservationStatus.ACTIVE);
        return reservation;
    }
}
