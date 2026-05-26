package com.hpsqsoft.ctrlropa.customer;

import com.hpsqsoft.ctrlropa.branch.Branch;
import com.hpsqsoft.ctrlropa.branch.BranchRepository;
import com.hpsqsoft.ctrlropa.common.Status;
import com.hpsqsoft.ctrlropa.company.Company;
import com.hpsqsoft.ctrlropa.security.access.AccessService;
import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import com.hpsqsoft.ctrlropa.security.access.PermissionCode;
import com.hpsqsoft.ctrlropa.tenant.CurrentTenantContext;
import com.hpsqsoft.ctrlropa.tenant.TenantResolver;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CustomerServiceTests {

    private final CustomerRepository repository = mock(CustomerRepository.class);
    private final BranchRepository branchRepository = mock(BranchRepository.class);
    private final TenantResolver tenantResolver = mock(TenantResolver.class);
    private final AccessService accessService = mock(AccessService.class);
    private final CurrentUser currentUser = mock(CurrentUser.class);
    private final CustomerService service = new CustomerService(
            repository,
            branchRepository,
            tenantResolver,
            accessService,
            currentUser
    );

    @Test
    void listCustomersUsesActiveCompanyScope() {
        when(currentUser.getUserId()).thenReturn(99L);
        when(tenantResolver.resolveCurrent()).thenReturn(tenant());

        service.findByBranch(10L);

        verify(accessService).assertCan(99L, PermissionCode.VIEW_CUSTOMERS);
        verify(tenantResolver).assertBranchBelongsToCompany(10L, 1L);
        verify(repository).findByCompanyIdAndBranchIdOrderByNameAsc(1L, 10L);
    }

    @Test
    void createAssignsCustomerCompanyFromBranch() {
        Company company = company();
        Branch branch = branch(company);
        Customer request = new Customer();
        request.setName("Cliente QA");
        request.setPhone("5511112222");
        request.setIsGeneric(false);

        when(currentUser.getUserId()).thenReturn(99L);
        when(tenantResolver.resolveCurrent()).thenReturn(tenant());
        when(branchRepository.findById(10L)).thenReturn(Optional.of(branch));
        when(repository.existsByCompanyIdAndBranchIdAndPhone(1L, 10L, "5511112222")).thenReturn(false);
        when(repository.save(request)).thenReturn(request);

        service.create(10L, request);

        verify(accessService).assertCan(99L, PermissionCode.CREATE_CUSTOMER);
        assertEquals(company, request.getCompany());
        assertEquals(branch, request.getBranch());
        assertEquals(99L, request.getCreatedByUserId());
        assertEquals(Status.ACTIVE, request.getStatus());
    }

    @Test
    void customerLookupByIdIsTenantScoped() {
        Customer customer = customer();
        when(currentUser.getUserId()).thenReturn(99L);
        when(tenantResolver.resolveCurrent()).thenReturn(tenant());
        when(repository.findByCompanyIdAndId(1L, 7L)).thenReturn(Optional.of(customer));

        assertEquals(7L, service.findById(7L).getId());
        verify(accessService).assertCan(99L, PermissionCode.VIEW_CUSTOMERS);
    }

    @Test
    void customerLookupByIdFromAnotherActiveBranchIsRejected() {
        Customer customer = customer();
        customer.setBranch(branch(company(), 11L));
        when(currentUser.getUserId()).thenReturn(99L);
        when(tenantResolver.resolveCurrent()).thenReturn(tenant());
        when(repository.findByCompanyIdAndId(1L, 7L)).thenReturn(Optional.of(customer));

        assertThrows(AccessDeniedException.class, () -> service.findById(7L));
    }

    @Test
    void branchFromAnotherCompanyIsRejectedBeforeQuery() {
        when(currentUser.getUserId()).thenReturn(99L);
        when(tenantResolver.resolveCurrent()).thenReturn(tenant());
        doThrow(new AccessDeniedException("cross-company"))
                .when(tenantResolver)
                .assertBranchBelongsToCompany(10L, 1L);

        assertThrows(AccessDeniedException.class, () -> service.findByBranch(10L));
    }

    @Test
    void customerLookupWithoutPermissionIsRejectedBeforeQuery() {
        when(currentUser.getUserId()).thenReturn(99L);
        doThrow(new AccessDeniedException("missing"))
                .when(accessService)
                .assertCan(99L, PermissionCode.VIEW_CUSTOMERS);

        assertThrows(AccessDeniedException.class, () -> service.findById(7L));
    }

    @Test
    void customerCreateWithoutPermissionIsRejectedBeforeTenantValidation() {
        when(currentUser.getUserId()).thenReturn(99L);
        doThrow(new AccessDeniedException("missing"))
                .when(accessService)
                .assertCan(99L, PermissionCode.CREATE_CUSTOMER);

        assertThrows(AccessDeniedException.class, () -> service.create(10L, new Customer()));
    }

    @Test
    void updateLegacyCustomerWithNullStatusDefaultsToActive() {
        Customer existing = customer();
        existing.setStatus(null);

        Customer request = new Customer();
        request.setName("Cliente QA Actualizado");
        request.setPhone(existing.getPhone());
        request.setEmail("qa@example.test");
        request.setIsGeneric(false);

        when(currentUser.getUserId()).thenReturn(99L);
        when(tenantResolver.resolveCurrent()).thenReturn(tenant());
        when(repository.findByCompanyIdAndId(1L, 7L)).thenReturn(Optional.of(existing));
        when(repository.save(existing)).thenReturn(existing);

        CustomerResponse response = service.update(7L, request);

        verify(accessService).assertCan(99L, PermissionCode.EDIT_CUSTOMER);
        assertEquals(Status.ACTIVE, existing.getStatus());
        assertEquals("ACTIVE", response.getStatus());
    }

    @Test
    void updateCustomerWithoutEditPermissionIsRejectedBeforeQuery() {
        when(currentUser.getUserId()).thenReturn(99L);
        doThrow(new AccessDeniedException("missing"))
                .when(accessService)
                .assertCan(99L, PermissionCode.EDIT_CUSTOMER);

        assertThrows(AccessDeniedException.class, () -> service.update(7L, new Customer()));
    }

    private CurrentTenantContext tenant() {
        return new CurrentTenantContext(1L, "DEFAULT", "HPSQ-SOFT Default Company", 10L, "QA_CTR", "QA Centro", 99L);
    }

    private Company company() {
        Company company = new Company();
        company.setId(1L);
        company.setCode("DEFAULT");
        company.setName("HPSQ-SOFT Default Company");
        company.setStatus("ACTIVE");
        return company;
    }

    private Branch branch(Company company) {
        return branch(company, 10L);
    }

    private Branch branch(Company company, Long id) {
        Branch branch = new Branch();
        branch.setId(id);
        branch.setCompany(company);
        branch.setCode("QA_CTR");
        branch.setName("QA Centro");
        branch.setStatus(Status.ACTIVE);
        return branch;
    }

    private Customer customer() {
        Company company = company();
        Customer customer = new Customer();
        customer.setCompany(company);
        customer.setBranch(branch(company));
        customer.setName("Cliente QA");
        customer.setPhone("5511112222");
        customer.setIsGeneric(false);
        customer.setCreatedByUserId(99L);
        customer.setStatus(Status.ACTIVE);
        setId(customer, 7L);
        return customer;
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
}
