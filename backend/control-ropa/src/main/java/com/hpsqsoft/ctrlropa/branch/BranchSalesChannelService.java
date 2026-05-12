package com.hpsqsoft.ctrlropa.branch;

import com.hpsqsoft.ctrlropa.catalog.SalesChannel;
import com.hpsqsoft.ctrlropa.catalog.SalesChannelRepository;
import com.hpsqsoft.ctrlropa.security.access.AccessService;
import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import com.hpsqsoft.ctrlropa.security.access.PermissionCode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class BranchSalesChannelService {

    private final BranchSalesChannelRepository repository;
    private final BranchRepository branchRepository;
    private final SalesChannelRepository salesChannelRepository;
    private final AccessService accessService;
    private final CurrentUser currentUser;

    public BranchSalesChannelService(BranchSalesChannelRepository repository,
                                     BranchRepository branchRepository,
                                     SalesChannelRepository salesChannelRepository,
                                     AccessService accessService,
                                     CurrentUser currentUser) {
        this.repository = repository;
        this.branchRepository = branchRepository;
        this.salesChannelRepository = salesChannelRepository;
        this.accessService = accessService;
        this.currentUser = currentUser;
    }

    @Transactional(readOnly = true)
    public List<BranchSalesChannelResponse> findByBranch(Long branchId) {
        return repository.findConfigurableByBranchId(branchId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public BranchSalesChannelResponse create(Long branchId, Long salesChannelId, Boolean enabled) {
        Long userId = currentUser.getUserId();

        accessService.assertCan(
                userId,
                PermissionCode.MANAGE_BRANCH_CHANNELS
        );

        if (repository.existsByBranchIdAndSalesChannelId(branchId, salesChannelId)) {
            throw new IllegalArgumentException("Ese canal ya está configurado para la sucursal");
        }

        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new IllegalArgumentException("Sucursal no encontrada con id: " + branchId));

        SalesChannel salesChannel = salesChannelRepository.findById(salesChannelId)
                .orElseThrow(() -> new IllegalArgumentException("Canal no encontrado con id: " + salesChannelId));
        assertGlobalChannelEnabled(salesChannel);

        BranchSalesChannel entity = new BranchSalesChannel();
        entity.setBranch(branch);
        entity.setSalesChannel(salesChannel);
        entity.setEnabled(enabled);
        entity.setUpdatedByUserId(userId);

        BranchSalesChannel saved = repository.save(entity);
        return toResponse(saved);
    }

    public BranchSalesChannelResponse update(Long id, Boolean enabled) {
        Long userId = currentUser.getUserId();

        accessService.assertCan(
                userId,
                PermissionCode.MANAGE_BRANCH_CHANNELS
        );

        BranchSalesChannel existing = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Configuración no encontrada con id: " + id));

        assertGlobalChannelEnabled(existing.getSalesChannel());

        existing.setEnabled(enabled);
        existing.setUpdatedByUserId(userId);

        BranchSalesChannel saved = repository.save(existing);
        return toResponse(saved);
    }

    private BranchSalesChannelResponse toResponse(BranchSalesChannel entity) {
        return new BranchSalesChannelResponse(
                entity.getId(),
                entity.getBranch().getId(),
                entity.getBranch().getCode(),
                entity.getBranch().getName(),
                entity.getSalesChannel().getId(),
                entity.getSalesChannel().getCode(),
                entity.getSalesChannel().getName(),
                entity.getEnabled(),
                entity.getUpdatedByUserId()
        );
    }

    private void assertGlobalChannelEnabled(SalesChannel salesChannel) {
        if (!Boolean.TRUE.equals(salesChannel.getGlobalEnabled()) || !"ACTIVE".equals(salesChannel.getStatus().name())) {
            throw new IllegalArgumentException("El canal no esta habilitado globalmente por Sistema");
        }
    }
}
