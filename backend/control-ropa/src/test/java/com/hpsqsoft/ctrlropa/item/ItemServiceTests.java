package com.hpsqsoft.ctrlropa.item;

import com.hpsqsoft.ctrlropa.batch.BatchRepository;
import com.hpsqsoft.ctrlropa.branch.Branch;
import com.hpsqsoft.ctrlropa.branch.BranchRepository;
import com.hpsqsoft.ctrlropa.catalog.BrandRepository;
import com.hpsqsoft.ctrlropa.catalog.ProductType;
import com.hpsqsoft.ctrlropa.catalog.ProductTypeRepository;
import com.hpsqsoft.ctrlropa.catalog.SizeRepository;
import com.hpsqsoft.ctrlropa.common.Status;
import com.hpsqsoft.ctrlropa.company.Company;
import com.hpsqsoft.ctrlropa.customerpackage.CustomerPackageItemRepository;
import com.hpsqsoft.ctrlropa.customerpackage.CustomerPackageRepository;
import com.hpsqsoft.ctrlropa.inventory.StorageLocationRepository;
import com.hpsqsoft.ctrlropa.reservation.ReservationRepository;
import com.hpsqsoft.ctrlropa.sale.SaleRepository;
import com.hpsqsoft.ctrlropa.shipment.ShipmentPackageRepository;
import com.hpsqsoft.ctrlropa.shipment.ShipmentRepository;
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

class ItemServiceTests {

    private final ItemRepository repository = mock(ItemRepository.class);
    private final BranchRepository branchRepository = mock(BranchRepository.class);
    private final BatchRepository batchRepository = mock(BatchRepository.class);
    private final ProductTypeRepository productTypeRepository = mock(ProductTypeRepository.class);
    private final BrandRepository brandRepository = mock(BrandRepository.class);
    private final SizeRepository sizeRepository = mock(SizeRepository.class);
    private final StorageLocationRepository storageLocationRepository = mock(StorageLocationRepository.class);
    private final SaleRepository saleRepository = mock(SaleRepository.class);
    private final ReservationRepository reservationRepository = mock(ReservationRepository.class);
    private final CustomerPackageItemRepository customerPackageItemRepository = mock(CustomerPackageItemRepository.class);
    private final CustomerPackageRepository customerPackageRepository = mock(CustomerPackageRepository.class);
    private final ShipmentPackageRepository shipmentPackageRepository = mock(ShipmentPackageRepository.class);
    private final ShipmentRepository shipmentRepository = mock(ShipmentRepository.class);
    private final TenantResolver tenantResolver = mock(TenantResolver.class);

    private final ItemService service = new ItemService(
            repository,
            branchRepository,
            batchRepository,
            productTypeRepository,
            brandRepository,
            sizeRepository,
            storageLocationRepository,
            saleRepository,
            reservationRepository,
            customerPackageItemRepository,
            customerPackageRepository,
            shipmentPackageRepository,
            shipmentRepository,
            tenantResolver
    );

    @Test
    void listItemsUsesActiveCompanyScope() {
        when(tenantResolver.resolveCurrent()).thenReturn(tenant());

        service.findByBranch(10L);

        verify(tenantResolver).assertBranchBelongsToCompany(10L, 1L);
        verify(repository).findByCompanyIdAndBranchIdOrderByCreatedAtDesc(1L, 10L);
    }

    @Test
    void createAssignsItemCompanyFromBranch() {
        Company company = company();
        Branch branch = branch(company);
        ProductType productType = productType();
        ItemService.CreateItemRequest request = new ItemService.CreateItemRequest();
        request.setCode("ITEM-QA-001");
        request.setQrCode("QR-QA-001");
        request.setBranchId(10L);
        request.setProductTypeId(20L);

        when(tenantResolver.resolveCurrent()).thenReturn(tenant());
        when(repository.existsByCompanyIdAndCode(1L, "ITEM-QA-001")).thenReturn(false);
        when(repository.existsByCompanyIdAndQrCode(1L, "QR-QA-001")).thenReturn(false);
        when(branchRepository.findById(10L)).thenReturn(Optional.of(branch));
        when(productTypeRepository.findById(20L)).thenReturn(Optional.of(productType));
        when(repository.save(org.mockito.ArgumentMatchers.any(Item.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ItemResponse response = service.create(request);

        assertEquals("ITEM-QA-001", response.getCode());
        assertEquals(99L, response.getCreatedByUserId());
        verify(tenantResolver).assertBranchBelongsToCompany(10L, 1L);
    }

    @Test
    void itemLookupByCodeIsTenantScoped() {
        Item item = item();
        when(tenantResolver.resolveCurrent()).thenReturn(tenant());
        when(repository.findByCompanyIdAndCode(1L, "ITEM-QA-001")).thenReturn(Optional.of(item));

        assertEquals("ITEM-QA-001", service.findByCode("ITEM-QA-001").getCode());
    }

    @Test
    void itemLookupByCodeFromAnotherActiveBranchIsRejected() {
        Item item = item();
        item.setBranch(branch(company(), 11L));
        when(tenantResolver.resolveCurrent()).thenReturn(tenant());
        when(repository.findByCompanyIdAndCode(1L, "ITEM-QA-001")).thenReturn(Optional.of(item));

        assertThrows(AccessDeniedException.class, () -> service.findByCode("ITEM-QA-001"));
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

    private ProductType productType() {
        ProductType productType = new ProductType();
        productType.setId(20L);
        productType.setCode("BLUSA");
        productType.setName("Blusa");
        productType.setStatus(Status.ACTIVE);
        return productType;
    }

    private Item item() {
        Company company = company();
        Item item = new Item();
        item.setCompany(company);
        item.setBranch(branch(company));
        item.setCode("ITEM-QA-001");
        item.setQrCode("QR-QA-001");
        item.setProductType(productType());
        item.setStatus(ItemStatus.AVAILABLE);
        item.setCreatedByUserId(99L);
        return item;
    }
}
