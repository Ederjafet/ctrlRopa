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
import com.hpsqsoft.ctrlropa.live.LiveRepository;
import com.hpsqsoft.ctrlropa.live.LiveStatus;
import com.hpsqsoft.ctrlropa.order.CustomerOrder;
import com.hpsqsoft.ctrlropa.order.CustomerOrderService;
import com.hpsqsoft.ctrlropa.security.access.AccessService;
import com.hpsqsoft.ctrlropa.security.access.ChannelCode;
import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import com.hpsqsoft.ctrlropa.security.access.PermissionCode;
import com.hpsqsoft.ctrlropa.tenant.TenantAccessGuard;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.test.util.ReflectionTestUtils;
import org.mockito.ArgumentMatchers;

import java.math.BigDecimal;
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
            liveEventService
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
        when(repository.save(any(Reservation.class))).thenAnswer(invocation -> {
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
        verify(itemRepository, never()).save(any(Item.class));
        verify(repository).save(any(Reservation.class));
        verify(customerOrderService).refreshStatus(55L);
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
        verify(repository, never()).save(any(Reservation.class));
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
        verify(repository, never()).save(any(Reservation.class));
        verify(customerOrderService, never()).addReservationToOpenOrder(any(Reservation.class));
        verify(itemRepository, never()).save(any(Item.class));
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
        when(repository.save(any(Reservation.class))).thenAnswer(invocation -> {
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
