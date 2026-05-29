package com.hpsqsoft.ctrlropa.live;

import com.hpsqsoft.ctrlropa.branch.Branch;
import com.hpsqsoft.ctrlropa.branch.BranchRepository;
import com.hpsqsoft.ctrlropa.catalog.ProductType;
import com.hpsqsoft.ctrlropa.common.Status;
import com.hpsqsoft.ctrlropa.company.Company;
import com.hpsqsoft.ctrlropa.item.Item;
import com.hpsqsoft.ctrlropa.item.ItemRepository;
import com.hpsqsoft.ctrlropa.item.ItemStatus;
import com.hpsqsoft.ctrlropa.security.access.AccessService;
import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import com.hpsqsoft.ctrlropa.tenant.CurrentTenantContext;
import com.hpsqsoft.ctrlropa.tenant.TenantResolver;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LiveServiceTests {

    private final LiveRepository liveRepository = mock(LiveRepository.class);
    private final BranchRepository branchRepository = mock(BranchRepository.class);
    private final ItemRepository itemRepository = mock(ItemRepository.class);
    private final AccessService accessService = mock(AccessService.class);
    private final CurrentUser currentUser = mock(CurrentUser.class);
    private final TenantResolver tenantResolver = mock(TenantResolver.class);

    private final LiveService service = new LiveService(
            liveRepository,
            branchRepository,
            itemRepository,
            accessService,
            currentUser,
            tenantResolver
    );

    @Test
    void findByBranchRejectsBranchOutsideActiveSession() {
        when(tenantResolver.resolveCurrent()).thenReturn(tenant());

        assertThrows(AccessDeniedException.class, () -> service.findByBranch(7L));

        verify(tenantResolver).assertBranchBelongsToCompany(7L, 2L);
    }

    @Test
    void setActiveItemPersistsItemOnSameBranch() {
        Live live = live(4L, branch(6L, company(2L)));
        Item item = item(8L, live.getBranch());
        LiveActiveItemRequest request = new LiveActiveItemRequest();
        request.setItemId(8L);

        when(currentUser.getUserId()).thenReturn(10L);
        when(tenantResolver.resolveCurrent()).thenReturn(tenant());
        when(liveRepository.findById(4L)).thenReturn(Optional.of(live));
        when(itemRepository.findByCompanyIdAndId(2L, 8L)).thenReturn(Optional.of(item));
        when(liveRepository.save(live)).thenReturn(live);

        LiveResponse response = service.setActiveItem(4L, request);

        assertEquals(8L, response.getActiveItemId());
        assertEquals("QA-CTR-005", response.getActiveItemCode());
        assertEquals("Blusa Verde", response.getActiveItemProductTypeName());
        verify(tenantResolver).assertBranchBelongsToCompany(6L, 2L);
    }

    @Test
    void setActiveItemRejectsItemFromAnotherBranch() {
        Live live = live(4L, branch(6L, company(2L)));
        Item item = item(8L, branch(4L, company(2L)));
        LiveActiveItemRequest request = new LiveActiveItemRequest();
        request.setItemId(8L);

        when(currentUser.getUserId()).thenReturn(10L);
        when(tenantResolver.resolveCurrent()).thenReturn(tenant());
        when(liveRepository.findById(4L)).thenReturn(Optional.of(live));
        when(itemRepository.findByCompanyIdAndId(2L, 8L)).thenReturn(Optional.of(item));

        assertThrows(AccessDeniedException.class, () -> service.setActiveItem(4L, request));
    }

    @Test
    void closeClearsActiveItem() {
        Live live = live(4L, branch(6L, company(2L)));
        live.setActiveItem(item(8L, live.getBranch()));

        when(currentUser.getUserId()).thenReturn(10L);
        when(tenantResolver.resolveCurrent()).thenReturn(tenant());
        when(liveRepository.findById(4L)).thenReturn(Optional.of(live));
        when(liveRepository.save(live)).thenReturn(live);

        LiveResponse response = service.close(4L);

        assertEquals("CLOSED", response.getStatus());
        assertEquals(null, response.getActiveItemId());
    }

    private CurrentTenantContext tenant() {
        return new CurrentTenantContext(2L, "DEFAULT", "Default", 6L, "QA_CTR", "Centro", 10L);
    }

    private Company company(Long id) {
        Company company = new Company();
        company.setId(id);
        company.setCode("DEFAULT");
        company.setName("Default");
        company.setStatus("ACTIVE");
        return company;
    }

    private Branch branch(Long id, Company company) {
        Branch branch = new Branch();
        branch.setId(id);
        branch.setCompany(company);
        branch.setCode(id.equals(6L) ? "QA_CTR" : "OTHER");
        branch.setName(id.equals(6L) ? "Centro" : "Otra");
        branch.setStatus(Status.ACTIVE);
        return branch;
    }

    private Live live(Long id, Branch branch) {
        Live live = new Live();
        ReflectionTestUtils.setField(live, "id", id);
        ReflectionTestUtils.setField(live, "createdAt", java.time.LocalDateTime.now());
        live.setBranch(branch);
        live.setStatus(LiveStatus.ACTIVE);
        live.setCreatedByUserId(10L);
        return live;
    }

    private Item item(Long id, Branch branch) {
        ProductType productType = new ProductType();
        productType.setId(20L);
        productType.setCode("BLUSA");
        productType.setName("Blusa Verde");
        productType.setStatus(Status.ACTIVE);

        Item item = new Item();
        ReflectionTestUtils.setField(item, "id", id);
        item.setCompany(branch.getCompany());
        item.setBranch(branch);
        item.setCode("QA-CTR-005");
        item.setQrCode("QR-QA-CTR-005");
        item.setProductType(productType);
        item.setPrice(new BigDecimal("300.00"));
        item.setStatus(ItemStatus.AVAILABLE);
        item.setCreatedByUserId(10L);
        return item;
    }
}
