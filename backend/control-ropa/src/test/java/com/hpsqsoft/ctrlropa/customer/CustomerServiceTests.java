package com.hpsqsoft.ctrlropa.customer;

import com.hpsqsoft.ctrlropa.branch.Branch;
import com.hpsqsoft.ctrlropa.branch.BranchRepository;
import com.hpsqsoft.ctrlropa.common.Status;
import com.hpsqsoft.ctrlropa.company.Company;
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
    private final CustomerService service = new CustomerService(repository, branchRepository, tenantResolver);

    @Test
    void listCustomersUsesActiveCompanyScope() {
        when(tenantResolver.resolveCurrent()).thenReturn(tenant());

        service.findByBranch(10L);

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

        when(tenantResolver.resolveCurrent()).thenReturn(tenant());
        when(branchRepository.findById(10L)).thenReturn(Optional.of(branch));
        when(repository.existsByCompanyIdAndBranchIdAndPhone(1L, 10L, "5511112222")).thenReturn(false);
        when(repository.save(request)).thenReturn(request);

        service.create(10L, request);

        assertEquals(company, request.getCompany());
        assertEquals(branch, request.getBranch());
        assertEquals(99L, request.getCreatedByUserId());
        assertEquals(Status.ACTIVE, request.getStatus());
    }

    @Test
    void customerLookupByIdIsTenantScoped() {
        Customer customer = customer();
        when(tenantResolver.resolveCurrent()).thenReturn(tenant());
        when(repository.findByCompanyIdAndId(1L, 7L)).thenReturn(Optional.of(customer));

        assertEquals(7L, service.findById(7L).getId());
    }

    @Test
    void branchFromAnotherCompanyIsRejectedBeforeQuery() {
        when(tenantResolver.resolveCurrent()).thenReturn(tenant());
        doThrow(new AccessDeniedException("cross-company"))
                .when(tenantResolver)
                .assertBranchBelongsToCompany(10L, 1L);

        assertThrows(AccessDeniedException.class, () -> service.findByBranch(10L));
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
        Branch branch = new Branch();
        branch.setId(10L);
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
