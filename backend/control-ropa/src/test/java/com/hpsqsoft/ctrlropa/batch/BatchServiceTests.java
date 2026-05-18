package com.hpsqsoft.ctrlropa.batch;

import com.hpsqsoft.ctrlropa.branch.Branch;
import com.hpsqsoft.ctrlropa.branch.BranchRepository;
import com.hpsqsoft.ctrlropa.catalog.ProductTypeRepository;
import com.hpsqsoft.ctrlropa.catalog.Supplier;
import com.hpsqsoft.ctrlropa.catalog.SupplierRepository;
import com.hpsqsoft.ctrlropa.common.Status;
import com.hpsqsoft.ctrlropa.company.Company;
import com.hpsqsoft.ctrlropa.item.ItemRepository;
import com.hpsqsoft.ctrlropa.security.access.AccessService;
import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import com.hpsqsoft.ctrlropa.security.access.PermissionCode;
import com.hpsqsoft.ctrlropa.tenant.CurrentTenantContext;
import com.hpsqsoft.ctrlropa.tenant.TenantResolver;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class BatchServiceTests {

    private final BatchRepository batchRepository = mock(BatchRepository.class);
    private final BatchClassificationDetailRepository classificationRepository = mock(BatchClassificationDetailRepository.class);
    private final BranchRepository branchRepository = mock(BranchRepository.class);
    private final ProductTypeRepository productTypeRepository = mock(ProductTypeRepository.class);
    private final SupplierRepository supplierRepository = mock(SupplierRepository.class);
    private final ItemRepository itemRepository = mock(ItemRepository.class);
    private final AccessService accessService = mock(AccessService.class);
    private final CurrentUser currentUser = mock(CurrentUser.class);
    private final TenantResolver tenantResolver = mock(TenantResolver.class);

    private final BatchService service = new BatchService(
            batchRepository,
            classificationRepository,
            branchRepository,
            productTypeRepository,
            supplierRepository,
            itemRepository,
            accessService,
            currentUser,
            tenantResolver
    );

    @Test
    void listBatchesUsesActiveCompanyScope() {
        when(currentUser.getUserId()).thenReturn(99L);
        when(tenantResolver.resolveCurrent()).thenReturn(tenant());

        service.findByBranch(10L);

        verify(accessService).assertCan(99L, PermissionCode.VIEW_INVENTORY);
        verify(tenantResolver).assertBranchBelongsToCompany(10L, 1L);
        verify(batchRepository).findByCompanyIdAndBranchIdOrderByCreatedAtDesc(1L, 10L);
    }

    @Test
    void createAssignsCompanyFromBranchAndUsesCompanyScopedFolio() {
        Company company = company();
        Branch branch = branch(company);
        Supplier supplier = supplier();
        CreateBatchRequest request = new CreateBatchRequest();
        request.setExpectedQuantity(5);
        request.setSupplierId(30L);

        when(currentUser.getUserId()).thenReturn(99L);
        when(tenantResolver.resolveCurrent()).thenReturn(tenant());
        when(branchRepository.findById(10L)).thenReturn(Optional.of(branch));
        when(supplierRepository.findById(30L)).thenReturn(Optional.of(supplier));
        when(batchRepository.existsByCompanyIdAndFolio(eq(1L), anyString())).thenReturn(false);
        when(classificationRepository.findByBatchIdOrderByProductTypeNameAsc(7L)).thenReturn(List.of());
        when(itemRepository.countByCompanyIdAndBatchId(1L, 7L)).thenReturn(0L);
        when(batchRepository.save(org.mockito.ArgumentMatchers.any(Batch.class))).thenAnswer(invocation -> {
            Batch saved = invocation.getArgument(0);
            setId(saved, 7L);
            return saved;
        });

        BatchResponse response = service.create(10L, request);

        assertEquals(10L, response.getBranchId());
        verify(tenantResolver).assertBranchBelongsToCompany(10L, 1L);
        verify(batchRepository).existsByCompanyIdAndFolio(1L, response.getFolio());
    }

    @Test
    void findByFolioIsTenantScoped() {
        Batch batch = batch();
        when(currentUser.getUserId()).thenReturn(99L);
        when(tenantResolver.resolveCurrent()).thenReturn(tenant());
        when(batchRepository.findByCompanyIdAndFolio(1L, "L-2026-QA")).thenReturn(Optional.of(batch));

        BatchResponse response = service.findByFolio("L-2026-QA");

        assertEquals("L-2026-QA", response.getFolio());
        verify(batchRepository).findByCompanyIdAndFolio(1L, "L-2026-QA");
        verify(tenantResolver).assertBranchBelongsToCompany(10L, 1L);
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
    void cancelUsesTenantItemCount() {
        Batch batch = batch();
        CancelBatchRequest request = new CancelBatchRequest();
        request.setReason("QA");

        when(currentUser.getUserId()).thenReturn(99L);
        when(tenantResolver.resolveCurrent()).thenReturn(tenant());
        when(batchRepository.findByCompanyIdAndId(1L, 7L)).thenReturn(Optional.of(batch));
        when(itemRepository.countByBatchId(7L)).thenReturn(0L);
        when(itemRepository.countByCompanyIdAndBatchId(1L, 7L)).thenReturn(0L);
        when(batchRepository.save(batch)).thenReturn(batch);

        BatchResponse response = service.cancel(7L, request);

        assertEquals(BatchStatus.CANCELLED.name(), response.getStatus());
        verify(itemRepository).countByBatchId(7L);
        verify(itemRepository, atLeastOnce()).countByCompanyIdAndBatchId(1L, 7L);
    }

    @Test
    void cancelBlocksItemCompanyBatchMismatch() {
        Batch batch = batch();
        CancelBatchRequest request = new CancelBatchRequest();
        request.setReason("QA");

        when(currentUser.getUserId()).thenReturn(99L);
        when(tenantResolver.resolveCurrent()).thenReturn(tenant());
        when(batchRepository.findByCompanyIdAndId(1L, 7L)).thenReturn(Optional.of(batch));
        when(itemRepository.countByBatchId(7L)).thenReturn(2L);
        when(itemRepository.countByCompanyIdAndBatchId(1L, 7L)).thenReturn(1L);

        assertThrows(IllegalStateException.class, () -> service.cancel(7L, request));
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

    private Supplier supplier() {
        Supplier supplier = new Supplier();
        supplier.setId(30L);
        supplier.setCode("QA-SUP");
        supplier.setName("Proveedor QA");
        supplier.setStatus(Status.ACTIVE);
        return supplier;
    }

    private Batch batch() {
        Company company = company();
        Batch batch = new Batch();
        setId(batch, 7L);
        batch.setCompany(company);
        batch.setBranch(branch(company));
        batch.setSupplier(supplier());
        batch.setFolio("L-2026-QA");
        batch.setExpectedQuantity(5);
        batch.setStatus(BatchStatus.ANNOUNCED);
        batch.setCreatedByUserId(99L);
        when(classificationRepository.findByBatchIdOrderByProductTypeNameAsc(7L)).thenReturn(List.of());
        when(itemRepository.countByCompanyIdAndBatchId(1L, 7L)).thenReturn(0L);
        return batch;
    }

    private void setId(Batch batch, Long id) {
        try {
            java.lang.reflect.Field idField = Batch.class.getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(batch, id);
        } catch (ReflectiveOperationException ex) {
            throw new IllegalStateException(ex);
        }
    }
}
