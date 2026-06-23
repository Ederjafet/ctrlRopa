package com.hpsqsoft.ctrlropa.customerpackage;

import com.hpsqsoft.ctrlropa.balance.BalanceService;
import com.hpsqsoft.ctrlropa.branch.Branch;
import com.hpsqsoft.ctrlropa.branch.BranchRepository;
import com.hpsqsoft.ctrlropa.catalog.ProductType;
import com.hpsqsoft.ctrlropa.catalog.SalesChannel;
import com.hpsqsoft.ctrlropa.catalog.SalesChannelRepository;
import com.hpsqsoft.ctrlropa.company.Company;
import com.hpsqsoft.ctrlropa.customer.Customer;
import com.hpsqsoft.ctrlropa.customer.CustomerAddress;
import com.hpsqsoft.ctrlropa.customer.CustomerAddressRepository;
import com.hpsqsoft.ctrlropa.customer.CustomerRepository;
import com.hpsqsoft.ctrlropa.common.Status;
import com.hpsqsoft.ctrlropa.inventory.Box;
import com.hpsqsoft.ctrlropa.item.Item;
import com.hpsqsoft.ctrlropa.item.ItemRepository;
import com.hpsqsoft.ctrlropa.item.ItemStatus;
import com.hpsqsoft.ctrlropa.order.CustomerOrderItemRepository;
import com.hpsqsoft.ctrlropa.order.CustomerOrderService;
import com.hpsqsoft.ctrlropa.reservation.Reservation;
import com.hpsqsoft.ctrlropa.reservation.ReservationRepository;
import com.hpsqsoft.ctrlropa.reservation.ReservationStatus;
import com.hpsqsoft.ctrlropa.sale.SaleRepository;
import com.hpsqsoft.ctrlropa.security.access.AccessService;
import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import com.hpsqsoft.ctrlropa.security.access.PermissionCode;
import com.hpsqsoft.ctrlropa.tenant.TenantAccessGuard;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CustomerPackageServiceTests {

    private final CustomerPackageRepository repository = mock(CustomerPackageRepository.class);
    private final CustomerPackageItemRepository itemRepository = mock(CustomerPackageItemRepository.class);
    private final CustomerRepository customerRepository = mock(CustomerRepository.class);
    private final CustomerAddressRepository customerAddressRepository = mock(CustomerAddressRepository.class);
    private final BranchRepository branchRepository = mock(BranchRepository.class);
    private final SaleRepository saleRepository = mock(SaleRepository.class);
    private final ReservationRepository reservationRepository = mock(ReservationRepository.class);
    private final ItemRepository itemEntityRepository = mock(ItemRepository.class);
    private final SalesChannelRepository salesChannelRepository = mock(SalesChannelRepository.class);
    private final CustomerOrderService customerOrderService = mock(CustomerOrderService.class);
    private final CustomerOrderItemRepository customerOrderItemRepository = mock(CustomerOrderItemRepository.class);
    private final JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
    private final TenantAccessGuard tenantAccessGuard = mock(TenantAccessGuard.class);
    private final AccessService accessService = mock(AccessService.class);
    private final CurrentUser currentUser = mock(CurrentUser.class);
    private final BalanceService balanceService = mock(BalanceService.class);

    private final CustomerPackageService service = new CustomerPackageService(
            repository,
            itemRepository,
            customerRepository,
            customerAddressRepository,
            branchRepository,
            saleRepository,
            reservationRepository,
            itemEntityRepository,
            salesChannelRepository,
            customerOrderService,
            customerOrderItemRepository,
            jdbcTemplate,
            tenantAccessGuard,
            accessService,
            currentUser,
            balanceService
    );

    @Test
    void prepareFromReservationCreatesOpenPackageAndAddsReservationItem() {
        Reservation reservation = activeReservation(true);
        CustomerPackage[] savedPackage = new CustomerPackage[1];
        CustomerPackageItem[] savedItem = new CustomerPackageItem[1];

        when(reservationRepository.findById(10L)).thenReturn(Optional.of(reservation));
        when(itemRepository.existsByReservationId(10L)).thenReturn(false);
        when(repository.existsByFolio(anyString())).thenReturn(false);
        when(repository.save(any(CustomerPackage.class))).thenAnswer(invocation -> {
            CustomerPackage customerPackage = invocation.getArgument(0);
            ReflectionTestUtils.setField(customerPackage, "id", 501L);
            ReflectionTestUtils.setField(customerPackage, "createdAt", LocalDateTime.now());
            savedPackage[0] = customerPackage;
            return customerPackage;
        });
        when(repository.findById(501L)).thenAnswer(invocation -> Optional.of(savedPackage[0]));
        when(itemEntityRepository.findById(8L)).thenReturn(Optional.of(reservation.getItem()));
        when(itemRepository.existsByCustomerPackageIdAndItemId(501L, 8L)).thenReturn(false);
        when(itemRepository.save(any(CustomerPackageItem.class))).thenAnswer(invocation -> {
            CustomerPackageItem packageItem = invocation.getArgument(0);
            ReflectionTestUtils.setField(packageItem, "id", 700L);
            ReflectionTestUtils.setField(packageItem, "createdAt", LocalDateTime.now());
            savedItem[0] = packageItem;
            return packageItem;
        });
        when(itemRepository.findByCustomerPackageIdOrderByCreatedAtAsc(501L))
                .thenAnswer(invocation -> List.of(savedItem[0]));
        stubFinancialSummary();
        when(jdbcTemplate.query(anyString(), any(RowMapper.class), eq(501L))).thenReturn(List.of());

        PrepareCustomerPackageFromReservationRequest request = new PrepareCustomerPackageFromReservationRequest();
        request.setCreatedByUserId(99L);

        CustomerPackageDetailResponse response = service.prepareFromReservation(10L, request);

        assertEquals(501L, response.getId());
        assertEquals("OPEN", response.getStatus());
        assertEquals(1, response.getTotalItems());
        assertEquals(BigDecimal.valueOf(300).setScale(2), response.getTotalAmount());
        assertEquals(10L, response.getItems().get(0).getReservationId());
        verify(repository).save(any(CustomerPackage.class));
        verify(itemRepository).save(any(CustomerPackageItem.class));
    }

    @Test
    void prepareFromReservationWithoutBoxCreatesOpenPackageAndAddsReservationItem() {
        Reservation reservation = activeReservation(false);
        CustomerPackage[] savedPackage = new CustomerPackage[1];
        CustomerPackageItem[] savedItem = new CustomerPackageItem[1];

        when(reservationRepository.findById(10L)).thenReturn(Optional.of(reservation));
        when(itemRepository.existsByReservationId(10L)).thenReturn(false);
        when(repository.existsByFolio(anyString())).thenReturn(false);
        when(repository.save(any(CustomerPackage.class))).thenAnswer(invocation -> {
            CustomerPackage customerPackage = invocation.getArgument(0);
            ReflectionTestUtils.setField(customerPackage, "id", 501L);
            ReflectionTestUtils.setField(customerPackage, "createdAt", LocalDateTime.now());
            savedPackage[0] = customerPackage;
            return customerPackage;
        });
        when(repository.findById(501L)).thenAnswer(invocation -> Optional.of(savedPackage[0]));
        when(itemEntityRepository.findById(8L)).thenReturn(Optional.of(reservation.getItem()));
        when(itemRepository.existsByCustomerPackageIdAndItemId(501L, 8L)).thenReturn(false);
        when(itemRepository.save(any(CustomerPackageItem.class))).thenAnswer(invocation -> {
            CustomerPackageItem packageItem = invocation.getArgument(0);
            ReflectionTestUtils.setField(packageItem, "id", 700L);
            ReflectionTestUtils.setField(packageItem, "createdAt", LocalDateTime.now());
            savedItem[0] = packageItem;
            return packageItem;
        });
        when(itemRepository.findByCustomerPackageIdOrderByCreatedAtAsc(501L))
                .thenAnswer(invocation -> List.of(savedItem[0]));
        stubFinancialSummary();
        when(jdbcTemplate.query(anyString(), any(RowMapper.class), eq(501L))).thenReturn(List.of());

        PrepareCustomerPackageFromReservationRequest request = new PrepareCustomerPackageFromReservationRequest();
        request.setCreatedByUserId(99L);

        CustomerPackageDetailResponse response = service.prepareFromReservation(10L, request);

        assertEquals(501L, response.getId());
        assertEquals("OPEN", response.getStatus());
        assertEquals(1, response.getTotalItems());
        assertEquals(10L, response.getItems().get(0).getReservationId());
        verify(repository).save(any(CustomerPackage.class));
        verify(itemRepository).save(any(CustomerPackageItem.class));
    }

    @Test
    void prepareFromReservationAlreadyPackagedIsRejectedBeforeCreatingPackage() {
        Reservation reservation = activeReservation(true);
        when(reservationRepository.findById(10L)).thenReturn(Optional.of(reservation));
        when(itemRepository.existsByReservationId(10L)).thenReturn(true);

        PrepareCustomerPackageFromReservationRequest request = new PrepareCustomerPackageFromReservationRequest();
        request.setCreatedByUserId(99L);

        assertThrows(IllegalArgumentException.class, () -> service.prepareFromReservation(10L, request));
        verify(repository, never()).save(any(CustomerPackage.class));
        verify(itemRepository, never()).save(any(CustomerPackageItem.class));
    }

    @Test
    void addItemRejectsInactiveReservationBeforeSavingPackageItem() {
        Reservation reservation = activeReservation(true);
        reservation.setStatus(ReservationStatus.CANCELLED);
        CustomerPackage customerPackage = customerPackage(reservation);

        when(repository.findById(501L)).thenReturn(Optional.of(customerPackage));
        when(itemEntityRepository.findById(8L)).thenReturn(Optional.of(reservation.getItem()));
        when(itemRepository.existsByCustomerPackageIdAndItemId(501L, 8L)).thenReturn(false);
        when(reservationRepository.findById(10L)).thenReturn(Optional.of(reservation));

        AddCustomerPackageItemRequest request = new AddCustomerPackageItemRequest();
        request.setItemId(8L);
        request.setReservationId(10L);

        assertThrows(IllegalArgumentException.class, () -> service.addItem(501L, request));
        verify(itemRepository, never()).save(any(CustomerPackageItem.class));
    }

    @Test
    void addItemCreatesReservationForAvailableItemBeforeSavingPackageItem() {
        Reservation reservationTemplate = activeReservation(false);
        CustomerPackage customerPackage = customerPackage(reservationTemplate);
        Item availableItem = reservationTemplate.getItem();
        availableItem.setStatus(ItemStatus.AVAILABLE);
        CustomerPackageItem[] savedItem = new CustomerPackageItem[1];

        when(repository.findById(501L)).thenReturn(Optional.of(customerPackage));
        when(itemEntityRepository.findById(8L)).thenReturn(Optional.of(availableItem));
        when(itemRepository.existsByCustomerPackageIdAndItemId(501L, 8L)).thenReturn(false);
        when(reservationRepository.findByItemIdAndStatus(8L, ReservationStatus.ACTIVE))
                .thenReturn(Optional.empty());
        when(itemEntityRepository.reserveIfAvailable(
                eq(1L),
                eq(6L),
                eq(8L),
                eq(ItemStatus.AVAILABLE),
                eq(ItemStatus.RESERVED)
        )).thenReturn(1);
        when(salesChannelRepository.findByCode("DOOR_RESERVATION"))
                .thenReturn(Optional.of(salesChannel()));
        when(itemEntityRepository.save(any(Item.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(invocation -> {
            Reservation reservation = invocation.getArgument(0);
            ReflectionTestUtils.setField(reservation, "id", 88L);
            ReflectionTestUtils.setField(reservation, "createdAt", LocalDateTime.now());
            return reservation;
        });
        when(itemRepository.save(any(CustomerPackageItem.class))).thenAnswer(invocation -> {
            CustomerPackageItem packageItem = invocation.getArgument(0);
            ReflectionTestUtils.setField(packageItem, "id", 701L);
            ReflectionTestUtils.setField(packageItem, "createdAt", LocalDateTime.now());
            savedItem[0] = packageItem;
            return packageItem;
        });
        when(itemRepository.findByCustomerPackageIdOrderByCreatedAtAsc(501L))
                .thenAnswer(invocation -> List.of(savedItem[0]));
        stubFinancialSummary(88L);
        when(jdbcTemplate.query(anyString(), any(RowMapper.class), eq(501L))).thenReturn(List.of());

        AddCustomerPackageItemRequest request = new AddCustomerPackageItemRequest();
        request.setItemId(8L);

        CustomerPackageDetailResponse response = service.addItem(501L, request);

        assertEquals(1, response.getTotalItems());
        assertEquals(88L, response.getItems().get(0).getReservationId());
        verify(reservationRepository).save(any(Reservation.class));
        verify(itemRepository).save(any(CustomerPackageItem.class));
    }

    @Test
    void updateShippingCostWaivedConfirmsZeroCost() {
        CustomerPackage customerPackage = customerPackage(activeReservation(false));

        when(currentUser.getUserId()).thenReturn(99L);
        when(repository.findById(501L)).thenReturn(Optional.of(customerPackage));
        when(repository.save(any(CustomerPackage.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(itemRepository.findByCustomerPackageIdOrderByCreatedAtAsc(501L)).thenReturn(List.of());
        when(jdbcTemplate.query(anyString(), any(RowMapper.class), eq(501L))).thenReturn(List.of());
        when(jdbcTemplate.queryForObject(anyString(), eq(BigDecimal.class), eq(501L)))
                .thenReturn(BigDecimal.ZERO);

        UpdateCustomerPackageShippingRequest request = new UpdateCustomerPackageShippingRequest();
        request.setShippingCostWaived(true);
        request.setShippingNotes("Envio sin costo autorizado");

        CustomerPackageDetailResponse response = service.updateShippingCost(501L, request);

        assertEquals(true, response.getShippingCostConfirmed());
        assertEquals(true, response.getShippingCostWaived());
        assertEquals(BigDecimal.ZERO, response.getShippingCostAmount());
        assertEquals(BigDecimal.ZERO, response.getTotalAmount());
        verify(repository).save(any(CustomerPackage.class));
    }

    @Test
    void updateShippingCostRejectsNegativeAmount() {
        CustomerPackage customerPackage = customerPackage(activeReservation(false));

        when(currentUser.getUserId()).thenReturn(99L);
        when(repository.findById(501L)).thenReturn(Optional.of(customerPackage));

        UpdateCustomerPackageShippingRequest request = new UpdateCustomerPackageShippingRequest();
        request.setShippingCostWaived(false);
        request.setShippingCostAmount(BigDecimal.valueOf(-1));

        assertThrows(IllegalArgumentException.class, () -> service.updateShippingCost(501L, request));
        verify(repository, never()).save(any(CustomerPackage.class));
    }

    @Test
    void updateShippingStoresCustomAddressSnapshotAndAddsCost() {
        CustomerPackage customerPackage = customerPackage(activeReservation(false));

        when(currentUser.getUserId()).thenReturn(99L);
        when(repository.findById(501L)).thenReturn(Optional.of(customerPackage));
        when(repository.save(any(CustomerPackage.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(itemRepository.findByCustomerPackageIdOrderByCreatedAtAsc(501L)).thenReturn(List.of());
        when(jdbcTemplate.query(anyString(), any(RowMapper.class), eq(501L))).thenReturn(List.of());
        when(jdbcTemplate.queryForObject(anyString(), eq(BigDecimal.class), eq(501L)))
                .thenReturn(BigDecimal.ZERO);

        UpdateCustomerPackageShippingRequest request = customShippingRequest();
        request.setShippingCostAmount(BigDecimal.valueOf(180).setScale(2));

        CustomerPackageDetailResponse response = service.updateShipping(501L, request);

        assertEquals("PARCEL_SERVICE", response.getDeliveryType());
        assertEquals("CUSTOM_PACKAGE_ADDRESS", response.getShippingAddressSource());
        assertEquals(true, response.getShippingAddressConfirmed());
        assertEquals("Maria Lopez", response.getShipToName());
        assertEquals("Calle 1 #123", response.getShipToLine1());
        assertEquals(BigDecimal.valueOf(180).setScale(2), response.getShippingCostAmount());
        verify(repository).save(customerPackage);
    }

    @Test
    void updateShippingCopiesPrimaryCustomerAddress() {
        CustomerPackage customerPackage = customerPackage(activeReservation(false));
        CustomerAddress primaryAddress = customerAddress(customerPackage.getCustomer(), true);

        when(currentUser.getUserId()).thenReturn(99L);
        when(repository.findById(501L)).thenReturn(Optional.of(customerPackage));
        when(customerAddressRepository.findByCustomerIdAndStatusOrderByIsDefaultDescLabelAsc(20L, Status.ACTIVE))
                .thenReturn(List.of(primaryAddress));
        when(repository.save(any(CustomerPackage.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(itemRepository.findByCustomerPackageIdOrderByCreatedAtAsc(501L)).thenReturn(List.of());
        when(jdbcTemplate.query(anyString(), any(RowMapper.class), eq(501L))).thenReturn(List.of());
        when(jdbcTemplate.queryForObject(anyString(), eq(BigDecimal.class), eq(501L)))
                .thenReturn(BigDecimal.ZERO);

        UpdateCustomerPackageShippingRequest request = new UpdateCustomerPackageShippingRequest();
        request.setDeliveryType(CustomerPackageDeliveryType.PARCEL_SERVICE);
        request.setAddressSource(CustomerPackageAddressSource.CUSTOMER_PRIMARY_ADDRESS);
        request.setShippingCostWaived(true);

        CustomerPackageDetailResponse response = service.updateShipping(501L, request);

        assertEquals(primaryAddress.getId(), response.getSourceCustomerAddressId());
        assertEquals("CUSTOMER_PRIMARY_ADDRESS", response.getShippingAddressSource());
        assertEquals(primaryAddress.getLine1(), response.getShipToLine1());
        assertEquals(true, response.getShippingCostWaived());
    }

    @Test
    void updateShippingStorePickupDoesNotRequireAddressAndSetsZeroCost() {
        CustomerPackage customerPackage = customerPackage(activeReservation(false));

        when(currentUser.getUserId()).thenReturn(99L);
        when(repository.findById(501L)).thenReturn(Optional.of(customerPackage));
        when(repository.save(any(CustomerPackage.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(itemRepository.findByCustomerPackageIdOrderByCreatedAtAsc(501L)).thenReturn(List.of());
        when(jdbcTemplate.query(anyString(), any(RowMapper.class), eq(501L))).thenReturn(List.of());
        when(jdbcTemplate.queryForObject(anyString(), eq(BigDecimal.class), eq(501L)))
                .thenReturn(BigDecimal.ZERO);

        UpdateCustomerPackageShippingRequest request = new UpdateCustomerPackageShippingRequest();
        request.setDeliveryType(CustomerPackageDeliveryType.STORE_PICKUP);

        CustomerPackageDetailResponse response = service.updateShipping(501L, request);

        assertEquals("STORE_PICKUP", response.getDeliveryType());
        assertEquals("PICKUP_NO_ADDRESS", response.getShippingAddressSource());
        assertEquals(true, response.getShippingAddressConfirmed());
        assertEquals(true, response.getShippingCostConfirmed());
        assertEquals(BigDecimal.ZERO, response.getShippingCostAmount());
    }

    @Test
    void markReadyWithoutShippingConfirmedIsRejected() {
        CustomerPackage customerPackage = customerPackage(activeReservation(false));

        when(currentUser.getUserId()).thenReturn(99L);
        when(repository.findById(501L)).thenReturn(Optional.of(customerPackage));

        CloseCustomerPackageRequest request = new CloseCustomerPackageRequest();
        request.setClosedByUserId(99L);

        assertThrows(IllegalArgumentException.class, () -> service.markReady(501L, request));
        verify(repository, never()).save(any(CustomerPackage.class));
    }

    @Test
    void markReadyPaidPackageWithShippingConfirmedIsAllowed() {
        Reservation reservation = activeReservation(false);
        CustomerPackage customerPackage = customerPackage(reservation);
        customerPackage.setShippingCostConfirmed(true);
        customerPackage.setShippingCostAmount(BigDecimal.valueOf(190).setScale(2));
        confirmParcelAddress(customerPackage);
        CustomerPackageItem packageItem = packageItem(customerPackage, reservation);

        when(currentUser.getUserId()).thenReturn(99L);
        when(repository.findById(501L)).thenReturn(Optional.of(customerPackage));
        when(repository.save(any(CustomerPackage.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(itemRepository.findByCustomerPackageIdOrderByCreatedAtAsc(501L)).thenReturn(List.of(packageItem));
        stubFinancialSummary(BigDecimal.valueOf(300).setScale(2));
        when(jdbcTemplate.queryForObject(anyString(), eq(BigDecimal.class), eq(501L)))
                .thenReturn(BigDecimal.valueOf(190).setScale(2));
        when(jdbcTemplate.query(anyString(), any(RowMapper.class), eq(501L))).thenReturn(List.of());

        CloseCustomerPackageRequest request = new CloseCustomerPackageRequest();
        request.setClosedByUserId(99L);

        CustomerPackageDetailResponse response = service.markReady(501L, request);

        assertEquals(CustomerPackageStatus.READY.name(), response.getStatus());
        assertEquals(0, response.getPendingAmount().compareTo(BigDecimal.ZERO));
        verify(repository).save(customerPackage);
    }

    @Test
    void markReadyPaidPackageWithWaivedShippingIsAllowed() {
        Reservation reservation = activeReservation(false);
        CustomerPackage customerPackage = customerPackage(reservation);
        customerPackage.setShippingCostConfirmed(true);
        customerPackage.setShippingCostWaived(true);
        customerPackage.setShippingCostAmount(BigDecimal.ZERO);
        confirmStorePickup(customerPackage);
        CustomerPackageItem packageItem = packageItem(customerPackage, reservation);

        when(currentUser.getUserId()).thenReturn(99L);
        when(repository.findById(501L)).thenReturn(Optional.of(customerPackage));
        when(repository.save(any(CustomerPackage.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(itemRepository.findByCustomerPackageIdOrderByCreatedAtAsc(501L)).thenReturn(List.of(packageItem));
        stubFinancialSummary(BigDecimal.valueOf(300).setScale(2));
        when(jdbcTemplate.query(anyString(), any(RowMapper.class), eq(501L))).thenReturn(List.of());

        CloseCustomerPackageRequest request = new CloseCustomerPackageRequest();
        request.setClosedByUserId(99L);

        CustomerPackageDetailResponse response = service.markReady(501L, request);

        assertEquals(CustomerPackageStatus.READY.name(), response.getStatus());
        assertEquals(0, response.getPendingAmount().compareTo(BigDecimal.ZERO));
    }

    @Test
    void markReadyWithShippingBalancePendingIsRejectedWithAmount() {
        Reservation reservation = activeReservation(false);
        CustomerPackage customerPackage = customerPackage(reservation);
        customerPackage.setShippingCostConfirmed(true);
        customerPackage.setShippingCostAmount(BigDecimal.valueOf(190).setScale(2));
        confirmParcelAddress(customerPackage);
        CustomerPackageItem packageItem = packageItem(customerPackage, reservation);

        when(currentUser.getUserId()).thenReturn(99L);
        when(repository.findById(501L)).thenReturn(Optional.of(customerPackage));
        when(itemRepository.findByCustomerPackageIdOrderByCreatedAtAsc(501L)).thenReturn(List.of(packageItem));
        stubFinancialSummary(BigDecimal.valueOf(300).setScale(2));
        when(jdbcTemplate.queryForObject(anyString(), eq(BigDecimal.class), eq(501L)))
                .thenReturn(BigDecimal.ZERO.setScale(2));
        when(jdbcTemplate.query(anyString(), any(RowMapper.class), eq(501L))).thenReturn(List.of());

        CloseCustomerPackageRequest request = new CloseCustomerPackageRequest();
        request.setClosedByUserId(99L);

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> service.markReady(501L, request)
        );

        assertTrue(exception.getMessage().contains("$190.00 MXN"));
        verify(repository, never()).save(any(CustomerPackage.class));
    }

    @Test
    void markReadyIgnoresSubCentRoundingResidue() {
        Reservation reservation = activeReservation(false);
        CustomerPackage customerPackage = customerPackage(reservation);
        customerPackage.setShippingCostConfirmed(true);
        customerPackage.setShippingCostAmount(BigDecimal.valueOf(190).setScale(2));
        confirmParcelAddress(customerPackage);
        CustomerPackageItem packageItem = packageItem(customerPackage, reservation);

        when(currentUser.getUserId()).thenReturn(99L);
        when(repository.findById(501L)).thenReturn(Optional.of(customerPackage));
        when(repository.save(any(CustomerPackage.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(itemRepository.findByCustomerPackageIdOrderByCreatedAtAsc(501L)).thenReturn(List.of(packageItem));
        stubFinancialSummary(BigDecimal.valueOf(300).setScale(2));
        when(jdbcTemplate.queryForObject(anyString(), eq(BigDecimal.class), eq(501L)))
                .thenReturn(new BigDecimal("189.996"));
        when(jdbcTemplate.query(anyString(), any(RowMapper.class), eq(501L))).thenReturn(List.of());

        CloseCustomerPackageRequest request = new CloseCustomerPackageRequest();
        request.setClosedByUserId(99L);

        CustomerPackageDetailResponse response = service.markReady(501L, request);

        assertEquals(CustomerPackageStatus.READY.name(), response.getStatus());
        verify(repository).save(customerPackage);
    }

    @Test
    void findReadyForShipmentByBranchReturnsReadyPaidPackageWithoutActiveShipment() {
        Reservation reservation = activeReservation(false);
        CustomerPackage customerPackage = customerPackage(reservation);
        customerPackage.setStatus(CustomerPackageStatus.READY);
        customerPackage.setShippingCostConfirmed(true);
        customerPackage.setShippingCostWaived(true);
        customerPackage.setShippingCostAmount(BigDecimal.ZERO.setScale(2));
        confirmStorePickup(customerPackage);
        CustomerPackageItem packageItem = packageItem(customerPackage, reservation);

        when(currentUser.getUserId()).thenReturn(99L);
        when(repository.findByBranchIdOrderByCreatedAtDesc(6L)).thenReturn(List.of(customerPackage));
        when(itemRepository.findByCustomerPackageIdOrderByCreatedAtAsc(501L)).thenReturn(List.of(packageItem));
        stubFinancialSummary(BigDecimal.valueOf(300).setScale(2));
        when(jdbcTemplate.query(anyString(), any(RowMapper.class), eq(501L))).thenReturn(List.of());

        List<CustomerPackageDetailResponse> response = service.findReadyForShipmentByBranch(6L);

        assertEquals(1, response.size());
        assertEquals(501L, response.get(0).getId());
        assertEquals(CustomerPackageStatus.READY.name(), response.get(0).getStatus());
        assertEquals(0, response.get(0).getPendingAmount().compareTo(BigDecimal.ZERO));
        verify(accessService).assertCan(99L, PermissionCode.MANAGE_SHIPMENTS);
    }

    @Test
    void findReadyForShipmentByBranchExcludesPackageWithActiveShipment() {
        Reservation reservation = activeReservation(false);
        CustomerPackage customerPackage = customerPackage(reservation);
        customerPackage.setStatus(CustomerPackageStatus.READY);
        customerPackage.setShippingCostConfirmed(true);
        customerPackage.setShippingCostWaived(true);
        customerPackage.setShippingCostAmount(BigDecimal.ZERO.setScale(2));
        confirmStorePickup(customerPackage);
        CustomerPackageItem packageItem = packageItem(customerPackage, reservation);
        CustomerPackageDetailResponse.ShipmentLine activeShipment = new CustomerPackageDetailResponse.ShipmentLine(
                900L,
                901L,
                "SHP-901",
                "OPEN",
                "PENDING",
                "PREPAID",
                BigDecimal.ZERO.setScale(2),
                BigDecimal.ZERO.setScale(2),
                BigDecimal.ZERO.setScale(2),
                null,
                null,
                null,
                null
        );

        when(currentUser.getUserId()).thenReturn(99L);
        when(repository.findByBranchIdOrderByCreatedAtDesc(6L)).thenReturn(List.of(customerPackage));
        when(itemRepository.findByCustomerPackageIdOrderByCreatedAtAsc(501L)).thenReturn(List.of(packageItem));
        stubFinancialSummary(BigDecimal.valueOf(300).setScale(2));
        when(jdbcTemplate.query(anyString(), any(RowMapper.class), eq(501L))).thenReturn(List.of(activeShipment));

        List<CustomerPackageDetailResponse> response = service.findReadyForShipmentByBranch(6L);

        assertTrue(response.isEmpty());
    }

    @Test
    void findReadyForShipmentByBranchRequiresShipmentPermission() {
        when(currentUser.getUserId()).thenReturn(99L);
        doThrow(new AccessDeniedException("missing shipments permission"))
                .when(accessService)
                .assertCan(99L, PermissionCode.MANAGE_SHIPMENTS);

        assertThrows(AccessDeniedException.class, () -> service.findReadyForShipmentByBranch(6L));
        verify(repository, never()).findByBranchIdOrderByCreatedAtDesc(6L);
    }

    @Test
    void removeItemWithoutPaidAmountDeletesPackageLineAndRecalculates() {
        Reservation reservation = activeReservation(false);
        CustomerPackage customerPackage = customerPackage(reservation);
        CustomerPackageItem packageItem = packageItem(customerPackage, reservation);

        when(currentUser.getUserId()).thenReturn(99L);
        when(repository.findById(501L)).thenReturn(Optional.of(customerPackage));
        when(itemRepository.findById(700L)).thenReturn(Optional.of(packageItem));
        stubFinancialSummary(BigDecimal.ZERO.setScale(2));
        when(itemRepository.findByCustomerPackageIdOrderByCreatedAtAsc(501L)).thenReturn(List.of());
        when(jdbcTemplate.query(anyString(), any(RowMapper.class), eq(501L))).thenReturn(List.of());

        CustomerPackageDetailResponse response = service.removeItem(501L, 700L, false);

        assertEquals(0, response.getTotalItems());
        assertEquals(0, response.getTotalAmount().compareTo(BigDecimal.ZERO));
        assertEquals(0, response.getPendingAmount().compareTo(BigDecimal.ZERO));
        verify(itemRepository).delete(packageItem);
    }

    @Test
    void removeItemWithoutPaidAmountIgnoresOtherPaidLinesAndKeepsShippingCost() {
        Reservation paidReservationA = activeReservation(
                1L,
                6L,
                "ITEM-1782091793236-0",
                BigDecimal.valueOf(199).setScale(2)
        );
        Reservation paidReservationB = activeReservation(
                2L,
                7L,
                "ITEM-1782146280743-0",
                BigDecimal.valueOf(500).setScale(2)
        );
        Reservation unpaidReservation = activeReservation(
                3L,
                3L,
                "ITEM-1782075838714-0",
                BigDecimal.valueOf(1600).setScale(2)
        );
        CustomerPackage customerPackage = customerPackage(unpaidReservation);
        customerPackage.setShippingCostConfirmed(true);
        customerPackage.setShippingCostAmount(BigDecimal.valueOf(190).setScale(2));
        CustomerPackageItem paidItemA = packageItem(customerPackage, paidReservationA, 1L);
        CustomerPackageItem paidItemB = packageItem(customerPackage, paidReservationB, 2L);
        CustomerPackageItem unpaidItem = packageItem(customerPackage, unpaidReservation, 3L);

        when(currentUser.getUserId()).thenReturn(99L);
        when(accessService.can(99L, PermissionCode.CREATE_CLOSE_CUSTOMER_PACKAGE)).thenReturn(true);
        when(repository.findById(501L)).thenReturn(Optional.of(customerPackage));
        when(itemRepository.findById(3L)).thenReturn(Optional.of(unpaidItem));
        stubFinancialSummary(1L, BigDecimal.valueOf(199).setScale(2), BigDecimal.valueOf(199).setScale(2));
        stubFinancialSummary(2L, BigDecimal.valueOf(500).setScale(2), BigDecimal.valueOf(500).setScale(2));
        stubFinancialSummary(3L, BigDecimal.valueOf(1600).setScale(2), BigDecimal.ZERO.setScale(2));
        when(itemRepository.findByCustomerPackageIdOrderByCreatedAtAsc(501L))
                .thenReturn(List.of(paidItemA, paidItemB));
        when(jdbcTemplate.query(anyString(), any(RowMapper.class), eq(501L))).thenReturn(List.of());
        when(jdbcTemplate.queryForObject(anyString(), eq(BigDecimal.class), eq(501L)))
                .thenReturn(BigDecimal.ZERO.setScale(2));

        CustomerPackageDetailResponse response = service.removeItem(501L, 3L, false);

        assertEquals(2, response.getTotalItems());
        assertEquals(0, response.getItemSubtotalAmount().compareTo(BigDecimal.valueOf(699).setScale(2)));
        assertEquals(0, response.getShippingCostAmount().compareTo(BigDecimal.valueOf(190).setScale(2)));
        assertEquals(0, response.getTotalAmount().compareTo(BigDecimal.valueOf(889).setScale(2)));
        assertEquals(0, response.getPaidAmount().compareTo(BigDecimal.valueOf(699).setScale(2)));
        assertEquals(0, response.getPendingAmount().compareTo(BigDecimal.valueOf(190).setScale(2)));
        verify(itemRepository).delete(unpaidItem);
    }

    @Test
    void removeItemWithPaidAmountIsRejected() {
        Reservation reservation = activeReservation(false);
        CustomerPackage customerPackage = customerPackage(reservation);
        CustomerPackageItem packageItem = packageItem(customerPackage, reservation);

        when(currentUser.getUserId()).thenReturn(99L);
        when(repository.findById(501L)).thenReturn(Optional.of(customerPackage));
        when(itemRepository.findById(700L)).thenReturn(Optional.of(packageItem));
        stubFinancialSummary(BigDecimal.valueOf(50).setScale(2));

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> service.removeItem(501L, 700L, false)
        );

        assertTrue(exception.getMessage().contains("saldo a favor"));
        verify(itemRepository, never()).delete(any(CustomerPackageItem.class));
        verify(balanceService, never()).registerRefundStoreCredit(any(), any(), any(), any(), anyString());
    }

    @Test
    void removeItemWithPaidAmountAndConfirmationCreatesCustomerCredit() {
        Reservation reservation = activeReservation(false);
        CustomerPackage customerPackage = customerPackage(reservation);
        CustomerPackageItem packageItem = packageItem(customerPackage, reservation);

        when(currentUser.getUserId()).thenReturn(99L);
        when(repository.findById(501L)).thenReturn(Optional.of(customerPackage));
        when(itemRepository.findById(700L)).thenReturn(Optional.of(packageItem));
        stubFinancialSummary(BigDecimal.valueOf(50).setScale(2));
        when(itemRepository.findByCustomerPackageIdOrderByCreatedAtAsc(501L)).thenReturn(List.of());
        when(jdbcTemplate.query(anyString(), any(RowMapper.class), eq(501L))).thenReturn(List.of());

        CustomerPackageDetailResponse response = service.removeItem(501L, 700L, true);

        assertEquals(0, response.getTotalItems());
        verify(balanceService).registerRefundStoreCredit(
                eq(20L),
                eq(6L),
                eq(BigDecimal.valueOf(50).setScale(2)),
                eq(99L),
                anyString()
        );
        verify(itemRepository).delete(packageItem);
    }

    @Test
    void removeItemWithPaidAmountRequiresCustomerBalancePermission() {
        Reservation reservation = activeReservation(false);
        CustomerPackage customerPackage = customerPackage(reservation);
        CustomerPackageItem packageItem = packageItem(customerPackage, reservation);

        when(currentUser.getUserId()).thenReturn(99L);
        when(repository.findById(501L)).thenReturn(Optional.of(customerPackage));
        when(itemRepository.findById(700L)).thenReturn(Optional.of(packageItem));
        stubFinancialSummary(BigDecimal.valueOf(50).setScale(2));
        doThrow(new AccessDeniedException("missing balance permission"))
                .when(accessService)
                .assertCan(99L, PermissionCode.APPLY_CUSTOMER_BALANCE);

        assertThrows(AccessDeniedException.class, () -> service.removeItem(501L, 700L, true));
        verify(balanceService, never()).registerRefundStoreCredit(any(), any(), any(), any(), anyString());
        verify(itemRepository, never()).delete(any(CustomerPackageItem.class));
    }

    @Test
    void removeItemFromReadyPackageIsRejected() {
        CustomerPackage customerPackage = customerPackage(activeReservation(false));
        customerPackage.setStatus(CustomerPackageStatus.READY);

        when(currentUser.getUserId()).thenReturn(99L);
        when(repository.findById(501L)).thenReturn(Optional.of(customerPackage));

        assertThrows(IllegalArgumentException.class, () -> service.removeItem(501L, 700L, false));
        verify(itemRepository, never()).findById(700L);
        verify(itemRepository, never()).delete(any(CustomerPackageItem.class));
    }

    @Test
    void removeItemWithoutPermissionIsRejected() {
        when(currentUser.getUserId()).thenReturn(99L);
        doThrow(new AccessDeniedException("missing"))
                .when(accessService)
                .assertCan(any(), any());

        assertThrows(AccessDeniedException.class, () -> service.removeItem(501L, 700L, false));
        verify(repository, never()).findById(501L);
        verify(itemRepository, never()).delete(any(CustomerPackageItem.class));
    }

    private void stubFinancialSummary() {
        stubFinancialSummary(10L);
    }

    private void stubFinancialSummary(BigDecimal paidAmount) {
        stubFinancialSummary(10L, paidAmount);
    }

    private void stubFinancialSummary(Long reservationId) {
        stubFinancialSummary(reservationId, BigDecimal.ZERO.setScale(2));
    }

    private void stubFinancialSummary(Long reservationId, BigDecimal paidAmount) {
        stubFinancialSummary(reservationId, BigDecimal.valueOf(300).setScale(2), paidAmount);
    }

    private void stubFinancialSummary(Long reservationId, BigDecimal price, BigDecimal paidAmount) {
        when(jdbcTemplate.queryForObject(anyString(), any(RowMapper.class), eq(reservationId))).thenAnswer(invocation -> {
            @SuppressWarnings("unchecked")
            RowMapper<Object> mapper = invocation.getArgument(1);
            ResultSet resultSet = mock(ResultSet.class);
            when(resultSet.getBigDecimal("price")).thenReturn(price);
            when(resultSet.getBigDecimal("paid_amount")).thenReturn(paidAmount);
            when(resultSet.getString("source_status")).thenReturn("ACTIVE");
            return mapper.mapRow(resultSet, 0);
        });
        when(jdbcTemplate.queryForObject(anyString(), eq(BigDecimal.class), eq(501L)))
                .thenReturn(BigDecimal.ZERO.setScale(2));
    }

    private Reservation activeReservation(boolean withBox) {
        Branch branch = branch();
        Customer customer = customer(branch);
        Item item = item(branch);

        Reservation reservation = new Reservation();
        ReflectionTestUtils.setField(reservation, "id", 10L);
        reservation.setBranch(branch);
        reservation.setCustomer(customer);
        reservation.setItem(item);
        reservation.setPrice(BigDecimal.valueOf(300).setScale(2));
        reservation.setStatus(ReservationStatus.ACTIVE);
        if (withBox) {
            reservation.setBox(box(branch));
        }
        ReflectionTestUtils.setField(reservation, "createdAt", LocalDateTime.now());
        return reservation;
    }

    private Reservation activeReservation(Long reservationId, Long itemId, String itemCode, BigDecimal price) {
        Branch branch = branch();
        Customer customer = customer(branch);
        Item item = item(branch, itemId, itemCode, price);

        Reservation reservation = new Reservation();
        ReflectionTestUtils.setField(reservation, "id", reservationId);
        reservation.setBranch(branch);
        reservation.setCustomer(customer);
        reservation.setItem(item);
        reservation.setPrice(price);
        reservation.setStatus(ReservationStatus.ACTIVE);
        ReflectionTestUtils.setField(reservation, "createdAt", LocalDateTime.now());
        return reservation;
    }

    private CustomerPackage customerPackage(Reservation reservation) {
        CustomerPackage customerPackage = new CustomerPackage();
        ReflectionTestUtils.setField(customerPackage, "id", 501L);
        customerPackage.setFolio("PKG-501");
        customerPackage.setBranch(reservation.getBranch());
        customerPackage.setCustomer(reservation.getCustomer());
        customerPackage.setStatus(CustomerPackageStatus.OPEN);
        customerPackage.setCreatedByUserId(99L);
        ReflectionTestUtils.setField(customerPackage, "createdAt", LocalDateTime.now());
        return customerPackage;
    }

    private void confirmParcelAddress(CustomerPackage customerPackage) {
        customerPackage.setDeliveryType(CustomerPackageDeliveryType.PARCEL_SERVICE);
        customerPackage.setShippingAddressSource(CustomerPackageAddressSource.CUSTOM_PACKAGE_ADDRESS);
        customerPackage.setShippingAddressConfirmed(true);
        customerPackage.setShipToName("Maria Lopez");
        customerPackage.setShipToPhone("5555555555");
        customerPackage.setShipToLine1("Calle 1 #123");
        customerPackage.setShipToCity("Ciudad de Mexico");
        customerPackage.setShipToState("CDMX");
        customerPackage.setShipToPostalCode("01000");
        customerPackage.setShipToCountry("Mexico");
    }

    private void confirmStorePickup(CustomerPackage customerPackage) {
        customerPackage.setDeliveryType(CustomerPackageDeliveryType.STORE_PICKUP);
        customerPackage.setShippingAddressSource(CustomerPackageAddressSource.PICKUP_NO_ADDRESS);
        customerPackage.setShippingAddressConfirmed(true);
    }

    private UpdateCustomerPackageShippingRequest customShippingRequest() {
        UpdateCustomerPackageShippingRequest request = new UpdateCustomerPackageShippingRequest();
        request.setDeliveryType(CustomerPackageDeliveryType.PARCEL_SERVICE);
        request.setAddressSource(CustomerPackageAddressSource.CUSTOM_PACKAGE_ADDRESS);
        request.setRecipientName("Maria Lopez");
        request.setRecipientPhone("5555555555");
        request.setLine1("Calle 1 #123");
        request.setCity("Ciudad de Mexico");
        request.setState("CDMX");
        request.setPostalCode("01000");
        request.setCountry("Mexico");
        request.setShippingCostWaived(false);
        return request;
    }

    private CustomerAddress customerAddress(Customer customer, boolean isDefault) {
        CustomerAddress address = new CustomerAddress();
        ReflectionTestUtils.setField(address, "id", 44L);
        address.setCustomer(customer);
        address.setLabel("Casa");
        address.setLine1("Av Principal 10");
        address.setCity("Ciudad de Mexico");
        address.setState("CDMX");
        address.setPostalCode("01000");
        address.setCountry("Mexico");
        address.setIsDefault(isDefault);
        address.setStatus(Status.ACTIVE);
        return address;
    }

    private CustomerPackageItem packageItem(CustomerPackage customerPackage, Reservation reservation) {
        return packageItem(customerPackage, reservation, 700L);
    }

    private CustomerPackageItem packageItem(CustomerPackage customerPackage, Reservation reservation, Long packageItemId) {
        CustomerPackageItem packageItem = new CustomerPackageItem();
        ReflectionTestUtils.setField(packageItem, "id", packageItemId);
        packageItem.setCustomerPackageId(customerPackage.getId());
        packageItem.setItem(reservation.getItem());
        packageItem.setReservationId(reservation.getId());
        ReflectionTestUtils.setField(packageItem, "createdAt", LocalDateTime.now());
        return packageItem;
    }

    private Branch branch() {
        Company company = new Company();
        company.setId(1L);
        company.setCode("QA");
        company.setName("QA Company");

        Branch branch = new Branch();
        branch.setId(6L);
        branch.setCompany(company);
        branch.setCode("QA");
        branch.setName("QA Centro");
        return branch;
    }

    private Customer customer(Branch branch) {
        Customer customer = new Customer();
        ReflectionTestUtils.setField(customer, "id", 20L);
        customer.setBranch(branch);
        customer.setName("Cliente QA");
        customer.setPhone("5555555555");
        return customer;
    }

    private Item item(Branch branch) {
        return item(branch, 8L, "IT-8", BigDecimal.valueOf(300).setScale(2));
    }

    private Item item(Branch branch, Long itemId, String itemCode, BigDecimal price) {
        ProductType productType = new ProductType();
        productType.setName("Blusa");

        Item item = new Item();
        ReflectionTestUtils.setField(item, "id", itemId);
        item.setCompany(branch.getCompany());
        item.setBranch(branch);
        item.setCode(itemCode);
        item.setQrCode("QR-" + itemId);
        item.setProductType(productType);
        item.setPrice(price);
        item.setStatus(ItemStatus.RESERVED);
        return item;
    }

    private SalesChannel salesChannel() {
        SalesChannel salesChannel = new SalesChannel();
        salesChannel.setId(3L);
        salesChannel.setCode("DOOR_RESERVATION");
        salesChannel.setName("Apartado puerta");
        return salesChannel;
    }

    private Box box(Branch branch) {
        Box box = new Box();
        ReflectionTestUtils.setField(box, "id", 3L);
        box.setBranch(branch);
        box.setCode("BX-1");
        box.setDescription("Caja QA");
        return box;
    }
}
