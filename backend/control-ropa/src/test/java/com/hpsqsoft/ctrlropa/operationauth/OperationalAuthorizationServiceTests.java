package com.hpsqsoft.ctrlropa.operationauth;

import com.hpsqsoft.ctrlropa.branch.Branch;
import com.hpsqsoft.ctrlropa.catalog.SalesChannel;
import com.hpsqsoft.ctrlropa.item.Item;
import com.hpsqsoft.ctrlropa.item.ItemRepository;
import com.hpsqsoft.ctrlropa.item.ItemStatus;
import com.hpsqsoft.ctrlropa.live.Live;
import com.hpsqsoft.ctrlropa.live.LiveEventService;
import com.hpsqsoft.ctrlropa.live.LiveEventType;
import com.hpsqsoft.ctrlropa.payment.PaymentAllocationRepository;
import com.hpsqsoft.ctrlropa.payment.PaymentRepository;
import com.hpsqsoft.ctrlropa.reservation.LiveReservationOperationalStatus;
import com.hpsqsoft.ctrlropa.reservation.Reservation;
import com.hpsqsoft.ctrlropa.reservation.ReservationRepository;
import com.hpsqsoft.ctrlropa.reservation.ReservationStatus;
import com.hpsqsoft.ctrlropa.security.access.AccessService;
import com.hpsqsoft.ctrlropa.security.access.ChannelCode;
import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import com.hpsqsoft.ctrlropa.security.access.PermissionCode;
import com.hpsqsoft.ctrlropa.tenant.CurrentTenantContext;
import com.hpsqsoft.ctrlropa.tenant.TenantAccessGuard;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class OperationalAuthorizationServiceTests {

    private final OperationalAuthorizationRepository repository = mock(OperationalAuthorizationRepository.class);
    private final ReservationRepository reservationRepository = mock(ReservationRepository.class);
    private final ItemRepository itemRepository = mock(ItemRepository.class);
    private final PaymentAllocationRepository paymentAllocationRepository = mock(PaymentAllocationRepository.class);
    private final PaymentRepository paymentRepository = mock(PaymentRepository.class);
    private final AccessService accessService = mock(AccessService.class);
    private final CurrentUser currentUser = mock(CurrentUser.class);
    private final TenantAccessGuard tenantAccessGuard = mock(TenantAccessGuard.class);
    private final LiveEventService liveEventService = mock(LiveEventService.class);

    private final OperationalAuthorizationService service = new OperationalAuthorizationService(
            repository,
            reservationRepository,
            itemRepository,
            paymentAllocationRepository,
            paymentRepository,
            accessService,
            currentUser,
            tenantAccessGuard,
            liveEventService
    );

    @Test
    void createRequiresRequestPermissionAndPersistsSnapshot() {
        Reservation reservation = liveReservation(10L, 6L);
        when(currentUser.getUserId()).thenReturn(99L);
        when(reservationRepository.findById(10L)).thenReturn(Optional.of(reservation));
        when(paymentAllocationRepository.findByReservationIdOrderByCreatedAtAsc(10L)).thenReturn(List.of());
        when(tenantAccessGuard.requireBranch(6L, "El target de autorizacion no pertenece a la sucursal activa"))
                .thenReturn(tenant());
        when(repository.save(any(OperationalAuthorizationRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OperationalAuthorizationResponse response = service.create(undoRequest());

        assertEquals("UNDO_LIVE_OPERATIONAL_SALE", response.getOperationType());
        assertEquals("REQUESTED", response.getStatus());
        assertEquals(10L, response.getReservationId());
        verify(accessService).assertCan(99L, PermissionCode.REQUEST_LIVE_OPERATION_AUTHORIZATION);
        verify(accessService).assertCan(99L, PermissionCode.UNDO_LIVE_OPERATIONAL_SALE);
    }

    @Test
    void approveRejectsSelfApproval() {
        OperationalAuthorizationRequest request = requestedAuthorization(50L, 99L);
        when(currentUser.getUserId()).thenReturn(99L);
        when(repository.findById(50L)).thenReturn(Optional.of(request));
        when(tenantAccessGuard.requireBranch(6L, "La autorizacion no pertenece a la sucursal activa"))
                .thenReturn(tenant());

        assertThrows(
                AccessDeniedException.class,
                () -> service.approve(50L, decision("OK"))
        );

        verify(accessService).assertCan(99L, PermissionCode.APPROVE_LIVE_OPERATION_AUTHORIZATION);
    }

    @Test
    void sellerCannotApproveWhenAccessServiceDenies() {
        when(currentUser.getUserId()).thenReturn(44L);
        org.mockito.Mockito.doThrow(new AccessDeniedException("denied"))
                .when(accessService)
                .assertCan(44L, PermissionCode.APPROVE_LIVE_OPERATION_AUTHORIZATION);

        assertThrows(
                AccessDeniedException.class,
                () -> service.approve(50L, decision("OK"))
        );
    }

    @Test
    void rejectedAuthorizationCannotBeApplied() {
        OperationalAuthorizationRequest request = requestedAuthorization(50L, 99L);
        request.setStatus(OperationalAuthorizationStatus.REJECTED);
        when(currentUser.getUserId()).thenReturn(100L);
        when(repository.findById(50L)).thenReturn(Optional.of(request));
        when(tenantAccessGuard.requireBranch(6L, "La autorizacion no pertenece a la sucursal activa"))
                .thenReturn(tenant());

        assertThrows(
                IllegalArgumentException.class,
                () -> service.apply(50L, decision("Aplicar"))
        );

        verify(accessService).assertCan(100L, PermissionCode.APPLY_LIVE_OPERATION_AUTHORIZATION);
    }

    @Test
    void applyUndoOperationalSoldRestoresReservedOperationalStatusWithoutPayments() {
        Reservation reservation = liveReservation(10L, 6L);
        OperationalAuthorizationCreateRequest createRequest = undoRequest();
        when(currentUser.getUserId()).thenReturn(99L, 100L, 100L);
        when(reservationRepository.findById(10L)).thenReturn(Optional.of(reservation));
        when(paymentAllocationRepository.findByReservationIdOrderByCreatedAtAsc(10L)).thenReturn(List.of());
        when(tenantAccessGuard.requireBranch(6L, "El target de autorizacion no pertenece a la sucursal activa"))
                .thenReturn(tenant());
        when(tenantAccessGuard.requireBranch(6L, "La autorizacion no pertenece a la sucursal activa"))
                .thenReturn(tenant());
        when(tenantAccessGuard.requireBranch(6L, "La reserva no pertenece a la sucursal activa"))
                .thenReturn(tenant());
        when(repository.save(any(OperationalAuthorizationRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OperationalAuthorizationResponse created = service.create(createRequest);
        OperationalAuthorizationRequest entity = captureCreatedEntity();
        ReflectionTestUtils.setField(entity, "id", 50L);
        entity.setStatus(OperationalAuthorizationStatus.APPROVED);
        entity.setDecidedByUserId(100L);
        entity.setDecidedAt(LocalDateTime.now());
        when(repository.findById(50L)).thenReturn(Optional.of(entity));

        OperationalAuthorizationResponse applied = service.apply(50L, decision("Reabrir operativo"));

        assertEquals("APPLIED", applied.getStatus());
        assertEquals(LiveReservationOperationalStatus.RESERVED, reservation.getLiveOperationalStatus());
        assertEquals(ItemStatus.RESERVED, reservation.getItem().getStatus());
        verify(accessService).assertCan(100L, PermissionCode.APPLY_LIVE_OPERATION_AUTHORIZATION);
        verify(accessService).assertCan(100L, PermissionCode.UNDO_LIVE_OPERATIONAL_SALE);
        verify(liveEventService).record(
                reservation.getLive(),
                LiveEventType.LIVE_OPERATIONAL_SOLD_UNDONE,
                100L,
                "RESERVATION",
                10L,
                "{\"reservationId\":10,\"previousStatus\":\"OPERATIONAL_SOLD\",\"newStatus\":\"RESERVED\",\"authorizationId\":50}"
        );
    }

    private OperationalAuthorizationRequest captureCreatedEntity() {
        org.mockito.ArgumentCaptor<OperationalAuthorizationRequest> captor =
                org.mockito.ArgumentCaptor.forClass(OperationalAuthorizationRequest.class);
        verify(repository).save(captor.capture());
        return captor.getValue();
    }

    private static OperationalAuthorizationCreateRequest undoRequest() {
        OperationalAuthorizationCreateRequest request = new OperationalAuthorizationCreateRequest();
        request.setOperationType(OperationalAuthorizationType.UNDO_LIVE_OPERATIONAL_SALE);
        request.setTargetType(OperationalAuthorizationTargetType.RESERVATION);
        request.setTargetId(10L);
        request.setReservationId(10L);
        request.setReason("Cliente pidio reabrir seguimiento operativo");
        return request;
    }

    private static OperationalAuthorizationDecisionRequest decision(String reason) {
        OperationalAuthorizationDecisionRequest request = new OperationalAuthorizationDecisionRequest();
        request.setReason(reason);
        return request;
    }

    private static OperationalAuthorizationRequest requestedAuthorization(Long id, Long requestedByUserId) {
        OperationalAuthorizationRequest request = new OperationalAuthorizationRequest();
        ReflectionTestUtils.setField(request, "id", id);
        request.setOperationType(OperationalAuthorizationType.UNDO_LIVE_OPERATIONAL_SALE);
        request.setStatus(OperationalAuthorizationStatus.REQUESTED);
        request.setCompanyId(1L);
        request.setBranchId(6L);
        request.setRequestedByUserId(requestedByUserId);
        request.setRequestedAt(LocalDateTime.now());
        request.setExpiresAt(LocalDateTime.now().plusHours(8));
        request.setTargetType(OperationalAuthorizationTargetType.RESERVATION);
        request.setTargetId(10L);
        request.setReservationId(10L);
        request.setReason("Motivo");
        return request;
    }

    private static CurrentTenantContext tenant() {
        return new CurrentTenantContext(1L, "DEFAULT", "Default", 6L, "QA_CTR", "QA Centro", 100L);
    }

    private static Reservation liveReservation(Long id, Long branchId) {
        Branch branch = new Branch();
        branch.setId(branchId);
        branch.setCode("QA_CTR");

        Item item = new Item();
        ReflectionTestUtils.setField(item, "id", 8L);
        item.setCode("QA-CTR-005");
        item.setPrice(BigDecimal.valueOf(300));
        item.setBranch(branch);
        item.setStatus(ItemStatus.RESERVED);

        Live live = new Live();
        ReflectionTestUtils.setField(live, "id", 4L);
        live.setBranch(branch);

        SalesChannel liveChannel = new SalesChannel();
        liveChannel.setId(3L);
        liveChannel.setCode(ChannelCode.LIVE);

        Reservation reservation = new Reservation();
        ReflectionTestUtils.setField(reservation, "id", id);
        reservation.setBranch(branch);
        reservation.setItem(item);
        reservation.setCustomer(customer());
        reservation.setLive(live);
        reservation.setSalesChannel(liveChannel);
        reservation.setPrice(BigDecimal.valueOf(300));
        reservation.setStatus(ReservationStatus.ACTIVE);
        reservation.setLiveOperationalStatus(LiveReservationOperationalStatus.OPERATIONAL_SOLD);
        reservation.setLiveOperationalStatusUpdatedAt(LocalDateTime.now());
        reservation.setLiveOperationalStatusUpdatedByUserId(99L);
        ReflectionTestUtils.setField(reservation, "createdAt", LocalDateTime.now());
        return reservation;
    }

    private static com.hpsqsoft.ctrlropa.customer.Customer customer() {
        com.hpsqsoft.ctrlropa.customer.Customer customer =
                new com.hpsqsoft.ctrlropa.customer.Customer();
        ReflectionTestUtils.setField(customer, "id", 27L);
        customer.setName("Damaris");
        return customer;
    }
}
