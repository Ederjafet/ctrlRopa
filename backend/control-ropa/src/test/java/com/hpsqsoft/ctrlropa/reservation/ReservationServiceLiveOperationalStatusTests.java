package com.hpsqsoft.ctrlropa.reservation;

import com.hpsqsoft.ctrlropa.branch.Branch;
import com.hpsqsoft.ctrlropa.branch.BranchRepository;
import com.hpsqsoft.ctrlropa.catalog.SalesChannel;
import com.hpsqsoft.ctrlropa.catalog.SalesChannelRepository;
import com.hpsqsoft.ctrlropa.customer.CustomerRepository;
import com.hpsqsoft.ctrlropa.inventory.BoxRepository;
import com.hpsqsoft.ctrlropa.item.Item;
import com.hpsqsoft.ctrlropa.item.ItemRepository;
import com.hpsqsoft.ctrlropa.item.ItemStatus;
import com.hpsqsoft.ctrlropa.live.Live;
import com.hpsqsoft.ctrlropa.live.LiveEventService;
import com.hpsqsoft.ctrlropa.live.LiveEventType;
import com.hpsqsoft.ctrlropa.live.LiveRepository;
import com.hpsqsoft.ctrlropa.live.LiveStatus;
import com.hpsqsoft.ctrlropa.order.CustomerOrderService;
import com.hpsqsoft.ctrlropa.payment.PaymentAllocationRepository;
import com.hpsqsoft.ctrlropa.payment.PaymentRepository;
import com.hpsqsoft.ctrlropa.security.access.AccessService;
import com.hpsqsoft.ctrlropa.security.access.ChannelCode;
import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import com.hpsqsoft.ctrlropa.security.access.PermissionCode;
import com.hpsqsoft.ctrlropa.tenant.TenantAccessGuard;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ReservationServiceLiveOperationalStatusTests {

    private final ReservationRepository repository = mock(ReservationRepository.class);
    private final ItemRepository itemRepository = mock(ItemRepository.class);
    private final CustomerRepository customerRepository = mock(CustomerRepository.class);
    private final BranchRepository branchRepository = mock(BranchRepository.class);
    private final LiveRepository liveRepository = mock(LiveRepository.class);
    private final SalesChannelRepository salesChannelRepository = mock(SalesChannelRepository.class);
    private final BoxRepository boxRepository = mock(BoxRepository.class);
    private final AccessService accessService = mock(AccessService.class);
    private final CurrentUser currentUser = mock(CurrentUser.class);
    private final CustomerOrderService customerOrderService = mock(CustomerOrderService.class);
    private final JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
    private final TenantAccessGuard tenantAccessGuard = mock(TenantAccessGuard.class);
    private final LiveEventService liveEventService = mock(LiveEventService.class);
    private final ReservationIdempotencyRepository idempotencyRepository = mock(ReservationIdempotencyRepository.class);
    private final ReservationRejectionTraceService rejectionTraceService = mock(ReservationRejectionTraceService.class);
    private final PaymentAllocationRepository paymentAllocationRepository = mock(PaymentAllocationRepository.class);
    private final PaymentRepository paymentRepository = mock(PaymentRepository.class);

    private final ReservationService service = new ReservationService(
            repository,
            itemRepository,
            customerRepository,
            branchRepository,
            liveRepository,
            salesChannelRepository,
            boxRepository,
            accessService,
            currentUser,
            customerOrderService,
            jdbcTemplate,
            tenantAccessGuard,
            liveEventService,
            idempotencyRepository,
            rejectionTraceService,
            paymentAllocationRepository,
            paymentRepository
    );

    @Test
    void updateLiveOperationalStatusPersistsWithoutChangingCoreStatus() {
        Reservation reservation = liveReservation(10L, 6L);
        when(currentUser.getUserId()).thenReturn(99L);
        when(repository.findById(10L)).thenReturn(Optional.of(reservation));
        when(repository.save(any(Reservation.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(customerOrderService.findOrderIdByReservationId(10L)).thenReturn(55L);

        ReservationService.UpdateLiveOperationalStatusRequest request =
                new ReservationService.UpdateLiveOperationalStatusRequest();
        request.setStatus(LiveReservationOperationalStatus.OPERATIONAL_SOLD);

        ReservationResponse response = service.updateLiveOperationalStatus(10L, request);

        assertEquals("ACTIVE", response.getStatus());
        assertEquals("OPERATIONAL_SOLD", response.getLiveOperationalStatus());
        assertEquals(99L, response.getLiveOperationalStatusUpdatedByUserId());
        assertEquals(ItemStatus.RESERVED, reservation.getItem().getStatus());
        verify(tenantAccessGuard).requireBranch(6L, "La reserva no pertenece a la sucursal activa");
        verify(accessService).assertCan(
                99L,
                PermissionCode.DO_LIVE_RESERVATION,
                ChannelCode.LIVE,
                6L
        );
        verify(liveEventService).record(
                reservation.getLive(),
                LiveEventType.LIVE_RESERVATION_STATUS_CHANGED,
                99L,
                "RESERVATION",
                10L,
                "{\"reservationId\":10,\"previousStatus\":\"RESERVED\",\"newStatus\":\"OPERATIONAL_SOLD\"}"
        );
        verify(liveEventService).record(
                reservation.getLive(),
                LiveEventType.LIVE_OPERATIONAL_SOLD,
                99L,
                "RESERVATION",
                10L,
                "{\"reservationId\":10,\"previousStatus\":\"RESERVED\",\"newStatus\":\"OPERATIONAL_SOLD\"}"
        );
    }

    @ParameterizedTest
    @EnumSource(value = ReservationStatus.class, names = {"CANCELLED", "CONVERTED_TO_SALE"})
    void updateLiveOperationalStatusRejectsOperationalSoldForHistoricalReservation(ReservationStatus status) {
        Reservation reservation = liveReservation(10L, 6L);
        reservation.setStatus(status);
        when(currentUser.getUserId()).thenReturn(99L);
        when(repository.findById(10L)).thenReturn(Optional.of(reservation));

        ReservationService.UpdateLiveOperationalStatusRequest request =
                new ReservationService.UpdateLiveOperationalStatusRequest();
        request.setStatus(LiveReservationOperationalStatus.OPERATIONAL_SOLD);

        assertThrows(
                IllegalArgumentException.class,
                () -> service.updateLiveOperationalStatus(10L, request)
        );

        assertEquals(status, reservation.getStatus());
        assertEquals(LiveReservationOperationalStatus.RESERVED, reservation.getLiveOperationalStatus());
        assertEquals(ItemStatus.RESERVED, reservation.getItem().getStatus());
        verify(repository, never()).save(any(Reservation.class));
        verify(liveEventService, never()).record(any(), any(), any(), any(), any(), any());
    }

    @Test
    void updateLiveOperationalStatusRejectsOperationalSoldForOperationallyCancelledReservation() {
        Reservation reservation = liveReservation(10L, 6L);
        reservation.setLiveOperationalStatus(LiveReservationOperationalStatus.CANCELLED);
        when(currentUser.getUserId()).thenReturn(99L);
        when(repository.findById(10L)).thenReturn(Optional.of(reservation));

        ReservationService.UpdateLiveOperationalStatusRequest request =
                new ReservationService.UpdateLiveOperationalStatusRequest();
        request.setStatus(LiveReservationOperationalStatus.OPERATIONAL_SOLD);

        assertThrows(
                IllegalArgumentException.class,
                () -> service.updateLiveOperationalStatus(10L, request)
        );

        assertEquals(ReservationStatus.ACTIVE, reservation.getStatus());
        assertEquals(LiveReservationOperationalStatus.CANCELLED, reservation.getLiveOperationalStatus());
        assertEquals(ItemStatus.RESERVED, reservation.getItem().getStatus());
        verify(repository, never()).save(any(Reservation.class));
        verify(liveEventService, never()).record(any(), any(), any(), any(), any(), any());
    }

    @ParameterizedTest
    @EnumSource(value = ItemStatus.class, names = {"AVAILABLE", "SOLD", "DISABLED", "ON_CONSIGNMENT"})
    void updateLiveOperationalStatusRejectsOperationalSoldWhenItemIsNotReserved(ItemStatus itemStatus) {
        Reservation reservation = liveReservation(10L, 6L);
        reservation.getItem().setStatus(itemStatus);
        when(currentUser.getUserId()).thenReturn(99L);
        when(repository.findById(10L)).thenReturn(Optional.of(reservation));

        ReservationService.UpdateLiveOperationalStatusRequest request =
                new ReservationService.UpdateLiveOperationalStatusRequest();
        request.setStatus(LiveReservationOperationalStatus.OPERATIONAL_SOLD);

        assertThrows(
                IllegalArgumentException.class,
                () -> service.updateLiveOperationalStatus(10L, request)
        );

        assertEquals(ReservationStatus.ACTIVE, reservation.getStatus());
        assertEquals(LiveReservationOperationalStatus.RESERVED, reservation.getLiveOperationalStatus());
        assertEquals(itemStatus, reservation.getItem().getStatus());
        verify(repository, never()).save(any(Reservation.class));
        verify(liveEventService, never()).record(any(), any(), any(), any(), any(), any());
    }

    @Test
    void updateLiveOperationalStatusRejectsNonLiveReservation() {
        Reservation reservation = liveReservation(10L, 6L);
        reservation.setLive(null);
        when(currentUser.getUserId()).thenReturn(99L);
        when(repository.findById(10L)).thenReturn(Optional.of(reservation));

        ReservationService.UpdateLiveOperationalStatusRequest request =
                new ReservationService.UpdateLiveOperationalStatusRequest();
        request.setStatus(LiveReservationOperationalStatus.OPERATIONAL_SOLD);

        assertThrows(
                IllegalArgumentException.class,
                () -> service.updateLiveOperationalStatus(10L, request)
        );
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
        live.setStatus(LiveStatus.ACTIVE);

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
        reservation.setLiveOperationalStatus(LiveReservationOperationalStatus.RESERVED);
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
