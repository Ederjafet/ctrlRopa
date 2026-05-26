package com.hpsqsoft.ctrlropa.sale;

import com.hpsqsoft.ctrlropa.branch.Branch;
import com.hpsqsoft.ctrlropa.branch.BranchRepository;
import com.hpsqsoft.ctrlropa.catalog.SalesChannel;
import com.hpsqsoft.ctrlropa.catalog.SalesChannelRepository;
import com.hpsqsoft.ctrlropa.customer.Customer;
import com.hpsqsoft.ctrlropa.customer.CustomerRepository;
import com.hpsqsoft.ctrlropa.item.Item;
import com.hpsqsoft.ctrlropa.item.ItemRepository;
import com.hpsqsoft.ctrlropa.order.CustomerOrderService;
import com.hpsqsoft.ctrlropa.payment.PaymentAllocationRepository;
import com.hpsqsoft.ctrlropa.payment.PaymentRepository;
import com.hpsqsoft.ctrlropa.reservation.ReservationRepository;
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
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class SaleServiceAccessTests {

    private final SaleRepository repository = mock(SaleRepository.class);
    private final ItemRepository itemRepository = mock(ItemRepository.class);
    private final CustomerRepository customerRepository = mock(CustomerRepository.class);
    private final BranchRepository branchRepository = mock(BranchRepository.class);
    private final SalesChannelRepository salesChannelRepository = mock(SalesChannelRepository.class);
    private final ReservationRepository reservationRepository = mock(ReservationRepository.class);
    private final PaymentAllocationRepository paymentAllocationRepository = mock(PaymentAllocationRepository.class);
    private final PaymentRepository paymentRepository = mock(PaymentRepository.class);
    private final AccessService accessService = mock(AccessService.class);
    private final CurrentUser currentUser = mock(CurrentUser.class);
    private final CustomerOrderService customerOrderService = mock(CustomerOrderService.class);
    private final TenantResolver tenantResolver = mock(TenantResolver.class);

    private final SaleService service = new SaleService(
            repository,
            itemRepository,
            customerRepository,
            branchRepository,
            salesChannelRepository,
            reservationRepository,
            paymentAllocationRepository,
            paymentRepository,
            accessService,
            currentUser,
            customerOrderService,
            tenantResolver
    );

    @Test
    void findSalesByBranchWithoutViewSalesPermissionIsRejected() {
        when(currentUser.getUserId()).thenReturn(99L);
        doThrow(new AccessDeniedException("missing"))
                .when(accessService)
                .assertCan(99L, PermissionCode.VIEW_SALES);

        assertThrows(AccessDeniedException.class, () -> service.findByBranch(10L));
    }

    @Test
    void findSaleByIdWithoutViewSalesPermissionIsRejected() {
        when(currentUser.getUserId()).thenReturn(99L);
        doThrow(new AccessDeniedException("missing"))
                .when(accessService)
                .assertCan(99L, PermissionCode.VIEW_SALES);

        assertThrows(AccessDeniedException.class, () -> service.findById(1L));
    }

    @Test
    void findSaleByIdFromAnotherActiveBranchIsRejected() {
        when(currentUser.getUserId()).thenReturn(99L);
        when(repository.findById(1L)).thenReturn(Optional.of(sale(1L, branch(4L))));
        when(tenantResolver.resolveCurrent()).thenReturn(tenant(2L, 6L));

        assertThrows(AccessDeniedException.class, () -> service.findById(1L));
    }

    @Test
    void findSaleByIdFromActiveBranchIsAllowed() {
        when(currentUser.getUserId()).thenReturn(99L);
        when(repository.findById(1L)).thenReturn(Optional.of(sale(1L, branch(6L))));
        when(tenantResolver.resolveCurrent()).thenReturn(tenant(2L, 6L));

        SaleResponse response = service.findById(1L);

        assertEquals(6L, response.getBranchId());
    }

    private static CurrentTenantContext tenant(Long companyId, Long branchId) {
        return new CurrentTenantContext(companyId, "QA_A", "Empresa QA A", branchId, "QA_A_CTR", "QA A Centro", 99L);
    }

    private static Sale sale(Long id, Branch branch) {
        Sale sale = new Sale();
        ReflectionTestUtils.setField(sale, "id", id);
        sale.setItem(item(30L));
        sale.setCustomer(customer(20L));
        sale.setBranch(branch);
        sale.setSellerUserId(99L);
        sale.setCustomerOrderId(100L);
        sale.setSalesChannel(salesChannel(7L));
        sale.setPrice(BigDecimal.valueOf(100));
        sale.setStatus(SaleStatus.ACTIVE);
        sale.setPaymentStatus(SalePaymentStatus.UNPAID);
        sale.setCreatedByUserId(99L);
        ReflectionTestUtils.setField(sale, "createdAt", LocalDateTime.now());
        return sale;
    }

    private static Branch branch(Long id) {
        Branch branch = new Branch();
        branch.setId(id);
        branch.setCode("QA_CTR_" + id);
        return branch;
    }

    private static Item item(Long id) {
        Item item = new Item();
        ReflectionTestUtils.setField(item, "id", id);
        item.setCode("ITEM-" + id);
        return item;
    }

    private static Customer customer(Long id) {
        Customer customer = new Customer();
        ReflectionTestUtils.setField(customer, "id", id);
        customer.setName("Cliente QA");
        return customer;
    }

    private static SalesChannel salesChannel(Long id) {
        SalesChannel channel = new SalesChannel();
        channel.setId(id);
        channel.setCode("STORE");
        return channel;
    }
}
