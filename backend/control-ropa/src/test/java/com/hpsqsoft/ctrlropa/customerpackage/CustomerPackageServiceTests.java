package com.hpsqsoft.ctrlropa.customerpackage;

import com.hpsqsoft.ctrlropa.branch.Branch;
import com.hpsqsoft.ctrlropa.branch.BranchRepository;
import com.hpsqsoft.ctrlropa.catalog.ProductType;
import com.hpsqsoft.ctrlropa.customer.Customer;
import com.hpsqsoft.ctrlropa.customer.CustomerRepository;
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
import com.hpsqsoft.ctrlropa.tenant.TenantAccessGuard;
import org.junit.jupiter.api.Test;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CustomerPackageServiceTests {

    private final CustomerPackageRepository repository = mock(CustomerPackageRepository.class);
    private final CustomerPackageItemRepository itemRepository = mock(CustomerPackageItemRepository.class);
    private final CustomerRepository customerRepository = mock(CustomerRepository.class);
    private final BranchRepository branchRepository = mock(BranchRepository.class);
    private final SaleRepository saleRepository = mock(SaleRepository.class);
    private final ReservationRepository reservationRepository = mock(ReservationRepository.class);
    private final ItemRepository itemEntityRepository = mock(ItemRepository.class);
    private final CustomerOrderService customerOrderService = mock(CustomerOrderService.class);
    private final CustomerOrderItemRepository customerOrderItemRepository = mock(CustomerOrderItemRepository.class);
    private final JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
    private final TenantAccessGuard tenantAccessGuard = mock(TenantAccessGuard.class);

    private final CustomerPackageService service = new CustomerPackageService(
            repository,
            itemRepository,
            customerRepository,
            branchRepository,
            saleRepository,
            reservationRepository,
            itemEntityRepository,
            customerOrderService,
            customerOrderItemRepository,
            jdbcTemplate,
            tenantAccessGuard
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
    void prepareFromReservationWithoutBoxIsRejectedBeforeCreatingPackage() {
        Reservation reservation = activeReservation(false);
        when(reservationRepository.findById(10L)).thenReturn(Optional.of(reservation));

        PrepareCustomerPackageFromReservationRequest request = new PrepareCustomerPackageFromReservationRequest();
        request.setCreatedByUserId(99L);

        assertThrows(IllegalArgumentException.class, () -> service.prepareFromReservation(10L, request));
        verify(repository, never()).save(any(CustomerPackage.class));
        verify(itemRepository, never()).save(any(CustomerPackageItem.class));
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

    private void stubFinancialSummary() {
        when(jdbcTemplate.queryForObject(anyString(), any(RowMapper.class), eq(10L))).thenAnswer(invocation -> {
            @SuppressWarnings("unchecked")
            RowMapper<Object> mapper = invocation.getArgument(1);
            ResultSet resultSet = mock(ResultSet.class);
            when(resultSet.getBigDecimal("price")).thenReturn(BigDecimal.valueOf(300).setScale(2));
            when(resultSet.getBigDecimal("paid_amount")).thenReturn(BigDecimal.ZERO.setScale(2));
            when(resultSet.getString("source_status")).thenReturn("ACTIVE");
            return mapper.mapRow(resultSet, 0);
        });
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

    private Branch branch() {
        Branch branch = new Branch();
        branch.setId(6L);
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
        ProductType productType = new ProductType();
        productType.setName("Blusa");

        Item item = new Item();
        ReflectionTestUtils.setField(item, "id", 8L);
        item.setBranch(branch);
        item.setCode("IT-8");
        item.setQrCode("QR-8");
        item.setProductType(productType);
        item.setPrice(BigDecimal.valueOf(300).setScale(2));
        item.setStatus(ItemStatus.RESERVED);
        return item;
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
