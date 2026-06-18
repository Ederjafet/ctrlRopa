package com.hpsqsoft.ctrlropa.reservation;

import com.hpsqsoft.ctrlropa.branch.Branch;
import com.hpsqsoft.ctrlropa.branch.BranchRepository;
import com.hpsqsoft.ctrlropa.catalog.SalesChannel;
import com.hpsqsoft.ctrlropa.catalog.SalesChannelRepository;
import com.hpsqsoft.ctrlropa.company.Company;
import com.hpsqsoft.ctrlropa.customer.Customer;
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
import com.hpsqsoft.ctrlropa.order.CustomerOrder;
import com.hpsqsoft.ctrlropa.order.CustomerOrderService;
import com.hpsqsoft.ctrlropa.payment.Payment;
import com.hpsqsoft.ctrlropa.payment.PaymentAllocation;
import com.hpsqsoft.ctrlropa.payment.PaymentAllocationRepository;
import com.hpsqsoft.ctrlropa.payment.PaymentRepository;
import com.hpsqsoft.ctrlropa.payment.PaymentStatus;
import com.hpsqsoft.ctrlropa.security.access.AccessService;
import com.hpsqsoft.ctrlropa.security.access.ChannelCode;
import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import com.hpsqsoft.ctrlropa.security.access.PermissionCode;
import com.hpsqsoft.ctrlropa.tenant.TenantAccessGuard;
import com.hpsqsoft.ctrlropa.web.error.ConflictException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.test.util.ReflectionTestUtils;
import org.mockito.ArgumentMatchers;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ReservationServiceTests {

    private final ReservationRepository repository = mock(ReservationRepository.class);
    private final ReservationIdempotencyRepository idempotencyRepository = mock(ReservationIdempotencyRepository.class);
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
    void createDoorReservationUsesAtomicAvailableToReservedUpdate() {
        Branch branch = branch();
        Item item = item(ItemStatus.AVAILABLE, branch);
        Customer customer = customer(branch);
        SalesChannel channel = channel(2L, ChannelCode.DOOR_RESERVATION);
        CustomerOrder order = order(55L);
        ReservationService.CreateReservationRequest request = request(channel.getId(), null);

        stubCommonCreateFlow(branch, item, customer, channel);
        when(itemRepository.reserveIfAvailable(2L, 6L, 8L, ItemStatus.AVAILABLE, ItemStatus.RESERVED))
                .thenReturn(1);
        when(repository.findByItemIdAndStatus(8L, ReservationStatus.ACTIVE)).thenReturn(Optional.empty());
        when(repository.saveAndFlush(any(Reservation.class))).thenAnswer(invocation -> {
            Reservation reservation = invocation.getArgument(0);
            ReflectionTestUtils.setField(reservation, "id", 10L);
            return reservation;
        });
        when(customerOrderService.addReservationToOpenOrder(any(Reservation.class))).thenReturn(order);
        when(customerOrderService.findOrderIdByReservationId(10L)).thenReturn(55L);
        stubSellerName();

        ReservationResponse response = service.create(request);

        assertEquals(10L, response.getId());
        assertEquals(8L, response.getItemId());
        assertEquals("ACTIVE", response.getStatus());
        verify(itemRepository).reserveIfAvailable(2L, 6L, 8L, ItemStatus.AVAILABLE, ItemStatus.RESERVED);
        verify(idempotencyRepository, never()).saveAndFlush(any(ReservationIdempotencyRecord.class));
        verify(itemRepository, never()).save(any(Item.class));
        verify(repository).saveAndFlush(any(Reservation.class));
        verify(customerOrderService).refreshStatus(55L);
        verify(rejectionTraceService, never()).record(any(), any(), any(), any(), any(), any(), any(), any(), any(), any());
        verify(accessService).assertCan(
                99L,
                PermissionCode.DO_DOOR_RESERVATION,
                ChannelCode.DOOR_RESERVATION,
                6L
        );
    }

    @ParameterizedTest
    @EnumSource(value = ItemStatus.class, names = {"RESERVED", "SOLD", "DISABLED", "ON_CONSIGNMENT"})
    void createRejectsUnavailableItemStatusesBeforeAtomicUpdate(ItemStatus status) {
        Branch branch = branch();
        Item item = item(status, branch);
        SalesChannel channel = channel(2L, ChannelCode.DOOR_RESERVATION);
        ReservationService.CreateReservationRequest request = request(channel.getId(), null);

        when(currentUser.getUserId()).thenReturn(99L);
        when(itemRepository.findById(8L)).thenReturn(Optional.of(item));
        when(branchRepository.findById(6L)).thenReturn(Optional.of(branch));

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> service.create(request)
        );

        assertTrue(exception.getMessage().contains("disponible"));
        verify(itemRepository, never()).reserveIfAvailable(
                any(),
                any(),
                any(),
                any(),
                any()
        );
        verify(repository, never()).saveAndFlush(any(Reservation.class));
        verify(rejectionTraceService).record(
                eq(2L),
                eq(6L),
                eq(99L),
                eq(8L),
                any(),
                any(),
                eq(ReservationRejectionReason.ITEM_NOT_AVAILABLE),
                eq("El item no esta disponible"),
                any(),
                any()
        );
    }

    @Test
    void createRejectsWhenAtomicUpdateAffectsNoRows() {
        Branch branch = branch();
        Item item = item(ItemStatus.AVAILABLE, branch);
        Customer customer = customer(branch);
        SalesChannel channel = channel(2L, ChannelCode.DOOR_RESERVATION);
        ReservationService.CreateReservationRequest request = request(channel.getId(), null);

        stubCommonCreateFlow(branch, item, customer, channel);
        when(repository.findByItemIdAndStatus(8L, ReservationStatus.ACTIVE)).thenReturn(Optional.empty());
        when(itemRepository.reserveIfAvailable(2L, 6L, 8L, ItemStatus.AVAILABLE, ItemStatus.RESERVED))
                .thenReturn(0);

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> service.create(request)
        );

        assertEquals("La prenda ya no esta disponible para apartar", exception.getMessage());
        verify(repository, never()).saveAndFlush(any(Reservation.class));
        verify(customerOrderService, never()).addReservationToOpenOrder(any(Reservation.class));
        verify(itemRepository, never()).save(any(Item.class));
        verify(rejectionTraceService).record(
                eq(2L),
                eq(6L),
                eq(99L),
                eq(8L),
                any(),
                any(),
                eq(ReservationRejectionReason.ITEM_NOT_AVAILABLE),
                eq("La prenda ya no esta disponible para apartar"),
                any(),
                any()
        );
    }

    @Test
    void createRejectsWhenActiveReservationAlreadyExists() {
        Branch branch = branch();
        Item item = item(ItemStatus.AVAILABLE, branch);
        Customer customer = customer(branch);
        SalesChannel channel = channel(2L, ChannelCode.DOOR_RESERVATION);
        ReservationService.CreateReservationRequest request = request(channel.getId(), null);
        Reservation activeReservation = reservation(44L, item, customer, branch, channel);

        stubCommonCreateFlow(branch, item, customer, channel);
        when(repository.findByItemIdAndStatus(8L, ReservationStatus.ACTIVE))
                .thenReturn(Optional.of(activeReservation));

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> service.create(request)
        );

        assertTrue(exception.getMessage().contains("reserva activa"));
        verify(itemRepository, never()).reserveIfAvailable(any(), any(), any(), any(), any());
        verify(repository, never()).saveAndFlush(any(Reservation.class));
        verify(rejectionTraceService).record(
                eq(2L),
                eq(6L),
                eq(99L),
                eq(8L),
                any(),
                eq(44L),
                eq(ReservationRejectionReason.ACTIVE_RESERVATION_EXISTS),
                eq("El item ya tiene una reserva activa"),
                any(),
                any()
        );
    }

    @Test
    void createWithIdempotencyKeyStoresCompletedRecord() {
        Branch branch = branch();
        Item item = item(ItemStatus.AVAILABLE, branch);
        Customer customer = customer(branch);
        SalesChannel channel = channel(2L, ChannelCode.DOOR_RESERVATION);
        CustomerOrder order = order(55L);
        ReservationService.CreateReservationRequest request = request(channel.getId(), null);
        ReservationIdempotencyRecord pendingRecord = new ReservationIdempotencyRecord();

        stubCommonCreateFlow(branch, item, customer, channel);
        when(idempotencyRepository
                .findByCompanyIdAndBranchIdAndUserIdAndOperationAndIdempotencyKey(
                        2L,
                        6L,
                        99L,
                        "RESERVATION_CREATE",
                        "idem-1"
                )).thenReturn(Optional.empty());
        when(idempotencyRepository.saveAndFlush(any(ReservationIdempotencyRecord.class)))
                .thenReturn(pendingRecord);
        when(itemRepository.reserveIfAvailable(2L, 6L, 8L, ItemStatus.AVAILABLE, ItemStatus.RESERVED))
                .thenReturn(1);
        when(repository.findByItemIdAndStatus(8L, ReservationStatus.ACTIVE)).thenReturn(Optional.empty());
        when(repository.saveAndFlush(any(Reservation.class))).thenAnswer(invocation -> {
            Reservation reservation = invocation.getArgument(0);
            ReflectionTestUtils.setField(reservation, "id", 10L);
            return reservation;
        });
        when(customerOrderService.addReservationToOpenOrder(any(Reservation.class))).thenReturn(order);
        when(customerOrderService.findOrderIdByReservationId(10L)).thenReturn(55L);
        stubSellerName();

        ReservationResponse response = service.create(request, "idem-1");

        assertEquals(10L, response.getId());
        assertEquals(ReservationIdempotencyStatus.COMPLETED, pendingRecord.getStatus());
        assertEquals(10L, pendingRecord.getReservationId());
        verify(idempotencyRepository).saveAndFlush(any(ReservationIdempotencyRecord.class));
        verify(idempotencyRepository).save(pendingRecord);
    }

    @Test
    void createTranslatesActiveReservationConstraintViolation() {
        Branch branch = branch();
        Item item = item(ItemStatus.AVAILABLE, branch);
        Customer customer = customer(branch);
        SalesChannel channel = channel(2L, ChannelCode.DOOR_RESERVATION);
        ReservationService.CreateReservationRequest request = request(channel.getId(), null);

        stubCommonCreateFlow(branch, item, customer, channel);
        when(repository.findByItemIdAndStatus(8L, ReservationStatus.ACTIVE)).thenReturn(Optional.empty());
        when(itemRepository.reserveIfAvailable(2L, 6L, 8L, ItemStatus.AVAILABLE, ItemStatus.RESERVED))
                .thenReturn(1);
        when(repository.saveAndFlush(any(Reservation.class)))
                .thenThrow(new DataIntegrityViolationException("Duplicate entry for uq_reservations_active_item"));

        ConflictException exception = assertThrows(
                ConflictException.class,
                () -> service.create(request)
        );

        assertTrue(exception.getMessage().contains("reserva activa"));
        verify(itemRepository).reserveIfAvailable(2L, 6L, 8L, ItemStatus.AVAILABLE, ItemStatus.RESERVED);
        verify(customerOrderService, never()).addReservationToOpenOrder(any(Reservation.class));
        verify(rejectionTraceService).record(
                eq(2L),
                eq(6L),
                eq(99L),
                eq(8L),
                any(),
                any(),
                eq(ReservationRejectionReason.ACTIVE_RESERVATION_EXISTS),
                eq("El item ya tiene una reserva activa"),
                any(),
                any()
        );
    }

    @Test
    void createWithSameIdempotencyKeyAndPayloadReturnsExistingReservation() {
        Branch branch = branch();
        Item item = item(ItemStatus.RESERVED, branch);
        Customer customer = customer(branch);
        SalesChannel channel = channel(2L, ChannelCode.DOOR_RESERVATION);
        Reservation existingReservation = reservation(10L, item, customer, branch, channel);
        ReservationService.CreateReservationRequest request = request(channel.getId(), null);
        ReservationIdempotencyRecord completedRecord = completedRecord(
                "idem-1",
                hashReservationRequest(request),
                existingReservation.getId()
        );

        stubCommonCreateFlow(branch, item, customer, channel);
        when(idempotencyRepository
                .findByCompanyIdAndBranchIdAndUserIdAndOperationAndIdempotencyKey(
                        2L,
                        6L,
                        99L,
                        "RESERVATION_CREATE",
                        "idem-1"
                )).thenReturn(Optional.of(completedRecord));
        when(repository.findById(10L)).thenReturn(Optional.of(existingReservation));
        when(customerOrderService.findOrderIdByReservationId(10L)).thenReturn(55L);
        stubSellerName();

        ReservationResponse response = service.create(request, "idem-1");

        assertEquals(10L, response.getId());
        verify(itemRepository, never()).reserveIfAvailable(any(), any(), any(), any(), any());
        verify(repository, never()).saveAndFlush(any(Reservation.class));
        verify(idempotencyRepository, never()).saveAndFlush(any(ReservationIdempotencyRecord.class));
    }

    @Test
    void createWithSameIdempotencyKeyAndDifferentPayloadRejects() {
        Branch branch = branch();
        Item item = item(ItemStatus.AVAILABLE, branch);
        SalesChannel channel = channel(2L, ChannelCode.DOOR_RESERVATION);
        ReservationService.CreateReservationRequest request = request(channel.getId(), null);
        ReservationIdempotencyRecord completedRecord = completedRecord(
                "idem-1",
                "different-hash",
                10L
        );

        when(currentUser.getUserId()).thenReturn(99L);
        when(itemRepository.findById(8L)).thenReturn(Optional.of(item));
        when(branchRepository.findById(6L)).thenReturn(Optional.of(branch));
        when(idempotencyRepository
                .findByCompanyIdAndBranchIdAndUserIdAndOperationAndIdempotencyKey(
                        2L,
                        6L,
                        99L,
                        "RESERVATION_CREATE",
                        "idem-1"
                )).thenReturn(Optional.of(completedRecord));

        ConflictException exception = assertThrows(
                ConflictException.class,
                () -> service.create(request, "idem-1")
        );

        assertTrue(exception.getMessage().contains("datos distintos"));
        verify(itemRepository, never()).reserveIfAvailable(any(), any(), any(), any(), any());
        verify(repository, never()).saveAndFlush(any(Reservation.class));
        verify(rejectionTraceService).record(
                eq(2L),
                eq(6L),
                eq(99L),
                eq(8L),
                any(),
                any(),
                eq(ReservationRejectionReason.IDEMPOTENCY_PAYLOAD_MISMATCH),
                eq("La llave de idempotencia ya fue usada con datos distintos"),
                any(),
                any()
        );
    }

    @Test
    void createWithInProgressIdempotencyKeyRejectsWithoutCreatingReservation() {
        Branch branch = branch();
        Item item = item(ItemStatus.AVAILABLE, branch);
        Customer customer = customer(branch);
        SalesChannel channel = channel(2L, ChannelCode.DOOR_RESERVATION);
        ReservationService.CreateReservationRequest request = request(channel.getId(), null);
        ReservationIdempotencyRecord inProgressRecord = inProgressRecord(
                "idem-1",
                hashReservationRequest(request)
        );

        stubCommonCreateFlow(branch, item, customer, channel);
        when(idempotencyRepository
                .findByCompanyIdAndBranchIdAndUserIdAndOperationAndIdempotencyKey(
                        2L,
                        6L,
                        99L,
                        "RESERVATION_CREATE",
                        "idem-1"
                )).thenReturn(Optional.of(inProgressRecord));

        ConflictException exception = assertThrows(
                ConflictException.class,
                () -> service.create(request, "idem-1")
        );

        assertTrue(exception.getMessage().contains("sigue en proceso"));
        verify(itemRepository, never()).reserveIfAvailable(any(), any(), any(), any(), any());
        verify(repository, never()).saveAndFlush(any(Reservation.class));
        verify(rejectionTraceService).record(
                eq(2L),
                eq(6L),
                eq(99L),
                eq(8L),
                any(),
                any(),
                eq(ReservationRejectionReason.IDEMPOTENCY_CONFLICT_OR_IN_PROGRESS),
                eq("La solicitud de reserva con esta llave sigue en proceso"),
                any(),
                any()
        );
    }

    @Test
    void createRejectsLiveChannelWithoutLiveIdAndTracesValidation() {
        Branch branch = branch();
        Item item = item(ItemStatus.AVAILABLE, branch);
        Customer customer = customer(branch);
        SalesChannel channel = channel(3L, ChannelCode.LIVE);
        ReservationService.CreateReservationRequest request = request(channel.getId(), null);

        stubCommonCreateFlow(branch, item, customer, channel);

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> service.create(request)
        );

        assertTrue(exception.getMessage().contains("liveId"));
        verify(itemRepository, never()).reserveIfAvailable(any(), any(), any(), any(), any());
        verify(repository, never()).saveAndFlush(any(Reservation.class));
        verify(rejectionTraceService).record(
                eq(2L),
                eq(6L),
                eq(99L),
                eq(8L),
                any(),
                any(),
                eq(ReservationRejectionReason.VALIDATION_REJECTED),
                eq("Las reservas LIVE requieren liveId"),
                any(),
                any()
        );
    }

    @Test
    void createLiveReservationKeepsLivePermissionAndUsesAtomicUpdate() {
        Branch branch = branch();
        Item item = item(ItemStatus.AVAILABLE, branch);
        Customer customer = customer(branch);
        SalesChannel channel = channel(3L, ChannelCode.LIVE);
        Live live = live(branch);
        CustomerOrder order = order(55L);
        ReservationService.CreateReservationRequest request = request(channel.getId(), live.getId());

        stubCommonCreateFlow(branch, item, customer, channel);
        when(liveRepository.findById(4L)).thenReturn(Optional.of(live));
        when(repository.findByItemIdAndStatus(8L, ReservationStatus.ACTIVE)).thenReturn(Optional.empty());
        when(itemRepository.reserveIfAvailable(2L, 6L, 8L, ItemStatus.AVAILABLE, ItemStatus.RESERVED))
                .thenReturn(1);
        when(repository.saveAndFlush(any(Reservation.class))).thenAnswer(invocation -> {
            Reservation reservation = invocation.getArgument(0);
            ReflectionTestUtils.setField(reservation, "id", 10L);
            return reservation;
        });
        when(customerOrderService.addReservationToOpenOrder(any(Reservation.class))).thenReturn(order);
        when(customerOrderService.findOrderIdByReservationId(10L)).thenReturn(55L);
        stubSellerName();

        ReservationResponse response = service.create(request);

        assertEquals(10L, response.getId());
        assertEquals(4L, response.getLiveId());
        assertEquals("RESERVED", response.getLiveOperationalStatus());
        verify(accessService).assertCan(
                99L,
                PermissionCode.DO_LIVE_RESERVATION,
                ChannelCode.LIVE,
                6L
        );
        verify(itemRepository).reserveIfAvailable(2L, 6L, 8L, ItemStatus.AVAILABLE, ItemStatus.RESERVED);
    }

    @Test
    void createLiveReservationWithIdempotencyKeyKeepsLivePermissionAndUsesAtomicUpdate() {
        Branch branch = branch();
        Item item = item(ItemStatus.AVAILABLE, branch);
        Customer customer = customer(branch);
        SalesChannel channel = channel(3L, ChannelCode.LIVE);
        Live live = live(branch);
        CustomerOrder order = order(55L);
        ReservationService.CreateReservationRequest request = request(channel.getId(), live.getId());
        ReservationIdempotencyRecord pendingRecord = new ReservationIdempotencyRecord();

        stubCommonCreateFlow(branch, item, customer, channel);
        when(liveRepository.findById(4L)).thenReturn(Optional.of(live));
        when(idempotencyRepository
                .findByCompanyIdAndBranchIdAndUserIdAndOperationAndIdempotencyKey(
                        2L,
                        6L,
                        99L,
                        "RESERVATION_CREATE",
                        "live-idem-1"
                )).thenReturn(Optional.empty());
        when(idempotencyRepository.saveAndFlush(any(ReservationIdempotencyRecord.class)))
                .thenReturn(pendingRecord);
        when(repository.findByItemIdAndStatus(8L, ReservationStatus.ACTIVE)).thenReturn(Optional.empty());
        when(itemRepository.reserveIfAvailable(2L, 6L, 8L, ItemStatus.AVAILABLE, ItemStatus.RESERVED))
                .thenReturn(1);
        when(repository.saveAndFlush(any(Reservation.class))).thenAnswer(invocation -> {
            Reservation reservation = invocation.getArgument(0);
            ReflectionTestUtils.setField(reservation, "id", 10L);
            return reservation;
        });
        when(customerOrderService.addReservationToOpenOrder(any(Reservation.class))).thenReturn(order);
        when(customerOrderService.findOrderIdByReservationId(10L)).thenReturn(55L);
        stubSellerName();

        ReservationResponse response = service.create(request, "live-idem-1");

        assertEquals(10L, response.getId());
        assertEquals("RESERVED", response.getLiveOperationalStatus());
        assertEquals(ReservationIdempotencyStatus.COMPLETED, pendingRecord.getStatus());
        verify(accessService).assertCan(
                99L,
                PermissionCode.DO_LIVE_RESERVATION,
                ChannelCode.LIVE,
                6L
        );
        verify(itemRepository).reserveIfAvailable(2L, 6L, 8L, ItemStatus.AVAILABLE, ItemStatus.RESERVED);
    }

    @Test
    void cancelActiveReservationReleasesReservedItemAtomically() {
        Branch branch = branch();
        Item item = item(ItemStatus.RESERVED, branch);
        Customer customer = customer(branch);
        SalesChannel channel = channel(2L, ChannelCode.DOOR_RESERVATION);
        Reservation reservation = reservation(10L, item, customer, branch, channel);

        stubCancelFlow(reservation);
        when(itemRepository.releaseIfReserved(2L, 6L, 8L, ItemStatus.RESERVED, ItemStatus.AVAILABLE))
                .thenReturn(1);
        when(repository.save(any(Reservation.class))).thenAnswer(invocation -> invocation.getArgument(0));
        stubSellerName();

        ReservationResponse response = service.cancel(10L, "cliente cancela");

        assertEquals("CANCELLED", response.getStatus());
        assertEquals("cliente cancela", response.getCancelReason());
        assertEquals(99L, response.getCancelledByUserId());
        verify(accessService).assertCan(99L, PermissionCode.CANCEL_RESERVATION);
        verify(itemRepository).releaseIfReserved(2L, 6L, 8L, ItemStatus.RESERVED, ItemStatus.AVAILABLE);
        verify(itemRepository, never()).save(any(Item.class));
        verify(repository).save(reservation);
        verify(rejectionTraceService, never()).record(any(), any(), any(), any(), any(), any(), any(), any(), any(), any());
    }

    @ParameterizedTest
    @EnumSource(value = ReservationStatus.class, names = {"CANCELLED", "CONVERTED_TO_SALE"})
    void cancelRejectsHistoricalReservations(ReservationStatus status) {
        Branch branch = branch();
        Item item = item(ItemStatus.RESERVED, branch);
        Customer customer = customer(branch);
        SalesChannel channel = channel(2L, ChannelCode.DOOR_RESERVATION);
        Reservation reservation = reservation(10L, item, customer, branch, channel);
        reservation.setStatus(status);

        when(currentUser.getUserId()).thenReturn(99L);
        when(repository.findById(10L)).thenReturn(Optional.of(reservation));

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> service.cancel(10L, "cancelacion duplicada")
        );

        assertTrue(exception.getMessage().contains("cancelada")
                || exception.getMessage().contains("convertida a venta"));
        verify(itemRepository, never()).releaseIfReserved(any(), any(), any(), any(), any());
        verify(repository, never()).save(any(Reservation.class));
        verify(rejectionTraceService).record(
                eq(2L),
                eq(6L),
                eq(99L),
                eq(8L),
                any(),
                eq(10L),
                eq(ReservationRejectionReason.VALIDATION_REJECTED),
                anyString(),
                any(),
                any()
        );
    }

    @ParameterizedTest
    @EnumSource(value = ItemStatus.class, names = {"AVAILABLE", "SOLD", "DISABLED", "ON_CONSIGNMENT"})
    void cancelRejectsWhenItemIsNotReserved(ItemStatus status) {
        Branch branch = branch();
        Item item = item(status, branch);
        Customer customer = customer(branch);
        SalesChannel channel = channel(2L, ChannelCode.DOOR_RESERVATION);
        Reservation reservation = reservation(10L, item, customer, branch, channel);

        stubCancelFlow(reservation);

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> service.cancel(10L, "cliente cancela")
        );

        assertTrue(exception.getMessage().contains("estado reservado"));
        verify(itemRepository, never()).releaseIfReserved(any(), any(), any(), any(), any());
        verify(repository, never()).save(any(Reservation.class));
        verify(rejectionTraceService).record(
                eq(2L),
                eq(6L),
                eq(99L),
                eq(8L),
                any(),
                eq(10L),
                eq(ReservationRejectionReason.VALIDATION_REJECTED),
                eq("La prenda no esta en estado reservado y no puede liberarse automaticamente"),
                any(),
                any()
        );
    }

    @Test
    void cancelRejectsWhenReservedReleaseAffectsNoRows() {
        Branch branch = branch();
        Item item = item(ItemStatus.RESERVED, branch);
        Customer customer = customer(branch);
        SalesChannel channel = channel(2L, ChannelCode.DOOR_RESERVATION);
        Reservation reservation = reservation(10L, item, customer, branch, channel);

        stubCancelFlow(reservation);
        when(itemRepository.releaseIfReserved(2L, 6L, 8L, ItemStatus.RESERVED, ItemStatus.AVAILABLE))
                .thenReturn(0);

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> service.cancel(10L, "cliente cancela")
        );

        assertTrue(exception.getMessage().contains("estado reservado"));
        verify(repository, never()).save(any(Reservation.class));
        verify(rejectionTraceService).record(
                eq(2L),
                eq(6L),
                eq(99L),
                eq(8L),
                any(),
                eq(10L),
                eq(ReservationRejectionReason.VALIDATION_REJECTED),
                eq("La prenda ya no esta en estado reservado y no puede liberarse automaticamente"),
                any(),
                any()
        );
    }

    @Test
    void cancelRejectsWhenReservationHasActivePaymentAllocation() {
        Branch branch = branch();
        Item item = item(ItemStatus.RESERVED, branch);
        Customer customer = customer(branch);
        SalesChannel channel = channel(2L, ChannelCode.DOOR_RESERVATION);
        Reservation reservation = reservation(10L, item, customer, branch, channel);
        PaymentAllocation allocation = allocation(77L, BigDecimal.valueOf(120));

        stubCancelFlow(reservation);
        when(paymentAllocationRepository.findByReservationIdOrderByCreatedAtAsc(10L))
                .thenReturn(List.of(allocation));
        when(paymentRepository.findById(77L)).thenReturn(Optional.of(payment(PaymentStatus.ACTIVE)));

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> service.cancel(10L, "cliente cancela")
        );

        assertTrue(exception.getMessage().contains("pago registrado"));
        verify(itemRepository, never()).releaseIfReserved(any(), any(), any(), any(), any());
        verify(repository, never()).save(any(Reservation.class));
        verify(rejectionTraceService).record(
                eq(2L),
                eq(6L),
                eq(99L),
                eq(8L),
                any(),
                eq(10L),
                eq(ReservationRejectionReason.VALIDATION_REJECTED),
                eq("Este apartado tiene pago registrado y no puede cancelarse por el flujo normal"),
                any(),
                any()
        );
    }

    @Test
    void cancelIgnoresVoidedPaymentAllocationAndReleasesReservedItem() {
        Branch branch = branch();
        Item item = item(ItemStatus.RESERVED, branch);
        Customer customer = customer(branch);
        SalesChannel channel = channel(2L, ChannelCode.DOOR_RESERVATION);
        Reservation reservation = reservation(10L, item, customer, branch, channel);
        PaymentAllocation allocation = allocation(77L, BigDecimal.valueOf(120));

        stubCancelFlow(reservation);
        when(paymentAllocationRepository.findByReservationIdOrderByCreatedAtAsc(10L))
                .thenReturn(List.of(allocation));
        when(paymentRepository.findById(77L)).thenReturn(Optional.of(payment(PaymentStatus.VOIDED)));
        when(itemRepository.releaseIfReserved(2L, 6L, 8L, ItemStatus.RESERVED, ItemStatus.AVAILABLE))
                .thenReturn(1);
        when(repository.save(any(Reservation.class))).thenAnswer(invocation -> invocation.getArgument(0));
        stubSellerName();

        ReservationResponse response = service.cancel(10L, "cliente cancela");

        assertEquals("CANCELLED", response.getStatus());
        verify(itemRepository).releaseIfReserved(2L, 6L, 8L, ItemStatus.RESERVED, ItemStatus.AVAILABLE);
    }

    @Test
    void cancelLiveReservationUsesSameSafeReleaseAndRecordsLiveEvents() {
        Branch branch = branch();
        Item item = item(ItemStatus.RESERVED, branch);
        Customer customer = customer(branch);
        SalesChannel channel = channel(3L, ChannelCode.LIVE);
        Reservation reservation = reservation(10L, item, customer, branch, channel);
        reservation.setLive(live(branch));
        reservation.setLiveOperationalStatus(LiveReservationOperationalStatus.RESERVED);

        stubCancelFlow(reservation);
        when(itemRepository.releaseIfReserved(2L, 6L, 8L, ItemStatus.RESERVED, ItemStatus.AVAILABLE))
                .thenReturn(1);
        when(repository.save(any(Reservation.class))).thenAnswer(invocation -> invocation.getArgument(0));
        stubSellerName();

        ReservationResponse response = service.cancel(10L, "cliente cancela");

        assertEquals("CANCELLED", response.getStatus());
        assertEquals("CANCELLED", response.getLiveOperationalStatus());
        verify(itemRepository).releaseIfReserved(2L, 6L, 8L, ItemStatus.RESERVED, ItemStatus.AVAILABLE);
        verify(liveEventService).record(
                reservation.getLive(),
                LiveEventType.LIVE_RESERVATION_STATUS_CHANGED,
                99L,
                "RESERVATION",
                10L,
                "{\"reservationId\":10,\"previousStatus\":\"RESERVED\",\"newStatus\":\"CANCELLED\"}"
        );
        verify(liveEventService).record(
                reservation.getLive(),
                LiveEventType.LIVE_RESERVATION_CANCELLED,
                99L,
                "RESERVATION",
                10L,
                "{\"reservationId\":10,\"previousStatus\":\"RESERVED\",\"newStatus\":\"CANCELLED\"}"
        );
    }

    private static ReservationIdempotencyRecord completedRecord(String key,
                                                                String requestHash,
                                                                Long reservationId) {
        ReservationIdempotencyRecord record = inProgressRecord(key, requestHash);
        record.setStatus(ReservationIdempotencyStatus.COMPLETED);
        record.setReservationId(reservationId);
        return record;
    }

    private static ReservationIdempotencyRecord inProgressRecord(String key, String requestHash) {
        ReservationIdempotencyRecord record = new ReservationIdempotencyRecord();
        record.setCompanyId(2L);
        record.setBranchId(6L);
        record.setUserId(99L);
        record.setOperation("RESERVATION_CREATE");
        record.setIdempotencyKey(key);
        record.setRequestHash(requestHash);
        record.setStatus(ReservationIdempotencyStatus.IN_PROGRESS);
        return record;
    }

    private static Reservation reservation(Long id,
                                           Item item,
                                           Customer customer,
                                           Branch branch,
                                           SalesChannel channel) {
        Reservation reservation = new Reservation();
        ReflectionTestUtils.setField(reservation, "id", id);
        reservation.setItem(item);
        reservation.setCustomer(customer);
        reservation.setBranch(branch);
        reservation.setSalesChannel(channel);
        reservation.setSellerUserId(99L);
        reservation.setPrice(BigDecimal.valueOf(300));
        reservation.setStatus(ReservationStatus.ACTIVE);
        return reservation;
    }

    private static String hashReservationRequest(ReservationService.CreateReservationRequest request) {
        return sha256(
                "itemId=" + valuePart(request.getItemId()) + "\n"
                        + "customerId=" + valuePart(request.getCustomerId()) + "\n"
                        + "branchId=" + valuePart(request.getBranchId()) + "\n"
                        + "liveId=" + valuePart(request.getLiveId()) + "\n"
                        + "salesChannelId=" + valuePart(request.getSalesChannelId()) + "\n"
                        + "sellerUserId=" + valuePart(request.getSellerUserId()) + "\n"
                        + "price=" + amountPart(request.getPrice()) + "\n"
                        + "notes=" + valuePart(request.getNotes())
        );
    }

    private static String valuePart(Object value) {
        if (value == null) {
            return "";
        }

        return value.toString().trim();
    }

    private static String amountPart(BigDecimal value) {
        if (value == null) {
            return "";
        }

        return value.stripTrailingZeros().toPlainString();
    }

    private static String sha256(String value) {
        try {
            byte[] hash = MessageDigest
                    .getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder();
            for (byte item : hash) {
                builder.append(String.format("%02x", item));
            }
            return builder.toString();
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException(ex);
        }
    }

    private void stubCommonCreateFlow(Branch branch, Item item, Customer customer, SalesChannel channel) {
        when(currentUser.getUserId()).thenReturn(99L);
        when(itemRepository.findById(8L)).thenReturn(Optional.of(item));
        when(customerRepository.findById(27L)).thenReturn(Optional.of(customer));
        when(branchRepository.findById(6L)).thenReturn(Optional.of(branch));
        when(salesChannelRepository.findById(channel.getId())).thenReturn(Optional.of(channel));
    }

    private void stubSellerName() {
        when(jdbcTemplate.query(
                anyString(),
                ArgumentMatchers.<RowMapper<String>>any(),
                eq(99L)
        )).thenReturn(List.of("Seller"));
    }

    private void stubCancelFlow(Reservation reservation) {
        when(currentUser.getUserId()).thenReturn(99L);
        when(repository.findById(reservation.getId())).thenReturn(Optional.of(reservation));
        when(paymentAllocationRepository.findByReservationIdOrderByCreatedAtAsc(reservation.getId()))
                .thenReturn(List.of());
    }

    private static PaymentAllocation allocation(Long paymentId, BigDecimal amount) {
        PaymentAllocation allocation = new PaymentAllocation();
        allocation.setPaymentId(paymentId);
        allocation.setReservationId(10L);
        allocation.setAmount(amount);
        return allocation;
    }

    private static Payment payment(PaymentStatus status) {
        Payment payment = new Payment();
        payment.setCustomerId(27L);
        payment.setBranchId(6L);
        payment.setReceivedAmount(BigDecimal.valueOf(120));
        payment.setPaymentMethodId(1L);
        payment.setStatus(status);
        payment.setCreatedByUserId(99L);
        return payment;
    }

    private static ReservationService.CreateReservationRequest request(Long salesChannelId, Long liveId) {
        ReservationService.CreateReservationRequest request = new ReservationService.CreateReservationRequest();
        request.setItemId(8L);
        request.setCustomerId(27L);
        request.setBranchId(6L);
        request.setSalesChannelId(salesChannelId);
        request.setLiveId(liveId);
        return request;
    }

    private static Company company() {
        Company company = new Company();
        company.setId(2L);
        company.setCode("QA");
        company.setName("QA");
        company.setStatus("ACTIVE");
        return company;
    }

    private static Branch branch() {
        Branch branch = new Branch();
        branch.setId(6L);
        branch.setCompany(company());
        branch.setCode("QA_CTR");
        branch.setName("Centro");
        return branch;
    }

    private static Item item(ItemStatus status, Branch branch) {
        Item item = new Item();
        ReflectionTestUtils.setField(item, "id", 8L);
        item.setCompany(branch.getCompany());
        item.setBranch(branch);
        item.setCode("QA-CTR-005");
        item.setQrCode("QR-QA-CTR-005");
        item.setPrice(BigDecimal.valueOf(300));
        item.setStatus(status);
        return item;
    }

    private static Customer customer(Branch branch) {
        Customer customer = new Customer();
        ReflectionTestUtils.setField(customer, "id", 27L);
        customer.setCompany(branch.getCompany());
        customer.setBranch(branch);
        customer.setName("Damaris");
        customer.setPhone("5555555555");
        customer.setCreatedByUserId(99L);
        customer.setIsGeneric(false);
        return customer;
    }

    private static SalesChannel channel(Long id, String code) {
        SalesChannel channel = new SalesChannel();
        channel.setId(id);
        channel.setCode(code);
        channel.setName(code);
        return channel;
    }

    private static Live live(Branch branch) {
        Live live = new Live();
        ReflectionTestUtils.setField(live, "id", 4L);
        live.setBranch(branch);
        live.setStatus(LiveStatus.ACTIVE);
        return live;
    }

    private static CustomerOrder order(Long id) {
        CustomerOrder order = new CustomerOrder();
        ReflectionTestUtils.setField(order, "id", id);
        return order;
    }
}
