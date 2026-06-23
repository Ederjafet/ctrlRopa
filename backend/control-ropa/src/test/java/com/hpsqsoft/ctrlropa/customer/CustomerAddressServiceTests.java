package com.hpsqsoft.ctrlropa.customer;

import com.hpsqsoft.ctrlropa.branch.Branch;
import com.hpsqsoft.ctrlropa.common.Status;
import com.hpsqsoft.ctrlropa.company.Company;
import com.hpsqsoft.ctrlropa.security.access.AccessService;
import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import com.hpsqsoft.ctrlropa.security.access.PermissionCode;
import com.hpsqsoft.ctrlropa.tenant.TenantAccessGuard;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CustomerAddressServiceTests {

    private final CustomerAddressRepository repository = mock(CustomerAddressRepository.class);
    private final CustomerRepository customerRepository = mock(CustomerRepository.class);
    private final TenantAccessGuard tenantAccessGuard = mock(TenantAccessGuard.class);
    private final AccessService accessService = mock(AccessService.class);
    private final CurrentUser currentUser = mock(CurrentUser.class);
    private final CustomerAddressService service = new CustomerAddressService(
            repository,
            customerRepository,
            tenantAccessGuard,
            accessService,
            currentUser
    );

    @Test
    void findByCustomerRequiresViewCustomersPermission() {
        Customer customer = customer();
        CustomerAddress address = address(customer, true);

        when(currentUser.getUserId()).thenReturn(99L);
        when(customerRepository.findById(7L)).thenReturn(Optional.of(customer));
        when(repository.findByCustomerIdOrderByIsDefaultDescLabelAsc(7L)).thenReturn(List.of(address));

        List<CustomerAddressResponse> response = service.findByCustomer(7L);

        verify(accessService).assertCan(99L, PermissionCode.VIEW_CUSTOMERS);
        verify(tenantAccessGuard).requireBranch(10L, "El cliente no pertenece a la sucursal activa");
        assertEquals(1, response.size());
        assertEquals("Casa", response.get(0).getLabel());
    }

    @Test
    void createRequiresEditCustomerPermission() {
        Customer customer = customer();
        CustomerAddress request = address(customer, false);
        request.setLabel("Trabajo");

        when(currentUser.getUserId()).thenReturn(99L);
        when(customerRepository.findById(7L)).thenReturn(Optional.of(customer));
        when(repository.existsByCustomerIdAndLabel(7L, "Trabajo")).thenReturn(false);
        when(repository.save(request)).thenReturn(request);

        CustomerAddressResponse response = service.create(7L, request);

        verify(accessService).assertCan(99L, PermissionCode.EDIT_CUSTOMER);
        assertEquals("Trabajo", response.getLabel());
        assertEquals(Status.ACTIVE.name(), response.getStatus());
    }

    @Test
    void createWithoutEditPermissionIsRejectedBeforeTenantLookup() {
        when(currentUser.getUserId()).thenReturn(99L);
        doThrow(new AccessDeniedException("missing"))
                .when(accessService)
                .assertCan(99L, PermissionCode.EDIT_CUSTOMER);

        assertThrows(AccessDeniedException.class, () -> service.create(7L, new CustomerAddress()));
    }

    @Test
    void updateWithoutEditPermissionIsRejectedBeforeAddressLookup() {
        when(currentUser.getUserId()).thenReturn(99L);
        doThrow(new AccessDeniedException("missing"))
                .when(accessService)
                .assertCan(99L, PermissionCode.EDIT_CUSTOMER);

        assertThrows(AccessDeniedException.class, () -> service.update(1L, new CustomerAddress()));
    }

    private Customer customer() {
        Company company = new Company();
        company.setId(1L);
        company.setCode("DEFAULT");
        company.setName("HPSQ-SOFT Default Company");
        company.setStatus("ACTIVE");

        Branch branch = new Branch();
        branch.setId(10L);
        branch.setCompany(company);
        branch.setCode("QA_CTR");
        branch.setName("QA Centro");
        branch.setStatus(Status.ACTIVE);

        Customer customer = new Customer();
        customer.setCompany(company);
        customer.setBranch(branch);
        customer.setName("Cliente QA");
        customer.setPhone("5511112222");
        customer.setIsGeneric(false);
        customer.setCreatedByUserId(99L);
        customer.setStatus(Status.ACTIVE);
        setId(customer, 7L);
        return customer;
    }

    private CustomerAddress address(Customer customer, boolean isDefault) {
        CustomerAddress address = new CustomerAddress();
        address.setCustomer(customer);
        address.setLabel("Casa");
        address.setLine1("Av Principal 10");
        address.setLine2("Interior 2");
        address.setCity("CDMX");
        address.setState("CDMX");
        address.setPostalCode("01000");
        address.setCountry("Mexico");
        address.setIsDefault(isDefault);
        address.setStatus(Status.ACTIVE);
        setId(address, 100L);
        return address;
    }

    private void setId(Customer customer, Long id) {
        try {
            java.lang.reflect.Field idField = Customer.class.getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(customer, id);
        } catch (ReflectiveOperationException ex) {
            throw new IllegalStateException(ex);
        }
    }

    private void setId(CustomerAddress address, Long id) {
        try {
            java.lang.reflect.Field idField = CustomerAddress.class.getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(address, id);
        } catch (ReflectiveOperationException ex) {
            throw new IllegalStateException(ex);
        }
    }
}
