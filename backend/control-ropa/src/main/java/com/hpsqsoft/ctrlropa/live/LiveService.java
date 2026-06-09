package com.hpsqsoft.ctrlropa.live;

import com.hpsqsoft.ctrlropa.branch.Branch;
import com.hpsqsoft.ctrlropa.branch.BranchRepository;
import com.hpsqsoft.ctrlropa.item.Item;
import com.hpsqsoft.ctrlropa.item.ItemRepository;
import com.hpsqsoft.ctrlropa.item.ItemResponse;
import com.hpsqsoft.ctrlropa.security.access.AccessService;
import com.hpsqsoft.ctrlropa.security.access.ChannelCode;
import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import com.hpsqsoft.ctrlropa.security.access.PermissionCode;
import com.hpsqsoft.ctrlropa.tenant.CurrentTenantContext;
import com.hpsqsoft.ctrlropa.tenant.TenantResolver;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class LiveService {

    private final LiveRepository repository;
    private final BranchRepository branchRepository;
    private final ItemRepository itemRepository;
    private final AccessService accessService;
    private final CurrentUser currentUser;
    private final TenantResolver tenantResolver;
    private final LiveEventService liveEventService;

    public LiveService(LiveRepository repository,
                       BranchRepository branchRepository,
                       ItemRepository itemRepository,
                       AccessService accessService,
                       CurrentUser currentUser,
                       TenantResolver tenantResolver,
                       LiveEventService liveEventService) {
        this.repository = repository;
        this.branchRepository = branchRepository;
        this.itemRepository = itemRepository;
        this.accessService = accessService;
        this.currentUser = currentUser;
        this.tenantResolver = tenantResolver;
        this.liveEventService = liveEventService;
    }

    @Transactional(readOnly = true)
    public List<LiveResponse> findByBranch(Long branchId) {
        assertCanViewLive(branchId);
        assertBranchBelongsToCurrentTenant(branchId);

        return repository.findByBranchIdOrderByCreatedAtDesc(branchId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public LiveResponse findById(Long id) {
        Live live = findEntityById(id);
        assertCanViewLive(live.getBranch().getId());
        assertLiveBelongsToCurrentTenant(live);
        return toResponse(live);
    }

    public LiveResponse create(Long branchId, Live entity) {
        Long userId = currentUser.getUserId();
        assertCanOperateLiveSession(branchId);
        assertBranchBelongsToCurrentTenant(branchId);

        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new IllegalArgumentException("Sucursal no encontrada"));

        entity.setBranch(branch);
        entity.setCreatedByUserId(userId);

        if (entity.getStatus() == null) {
            entity.setStatus(LiveStatus.OPEN);
        }

        Live saved = repository.save(entity);
        return toResponse(saved);
    }

    public LiveResponse activate(Long id) {
        Live existing = findEntityById(id);

        assertCanOperateLiveSession(existing.getBranch().getId());
        assertLiveBelongsToCurrentTenant(existing);

        existing.setStatus(LiveStatus.ACTIVE);

        if (existing.getStartedAt() == null) {
            existing.setStartedAt(LocalDateTime.now());
        }

        Live saved = repository.save(existing);
        liveEventService.record(
                saved,
                LiveEventType.LIVE_STARTED,
                currentUser.getUserId(),
                "LIVE",
                saved.getId(),
                "{\"status\":\"" + saved.getStatus().name() + "\"}"
        );
        return toResponse(saved);
    }

    public LiveResponse close(Long id) {
        Live existing = findEntityById(id);

        assertCanOperateLiveSession(existing.getBranch().getId());
        assertLiveBelongsToCurrentTenant(existing);

        existing.setStatus(LiveStatus.CLOSED);
        existing.setEndedAt(LocalDateTime.now());
        existing.setActiveItem(null);

        Live saved = repository.save(existing);
        liveEventService.record(
                saved,
                LiveEventType.LIVE_CLOSED,
                currentUser.getUserId(),
                "LIVE",
                saved.getId(),
                "{\"status\":\"" + saved.getStatus().name() + "\"}"
        );
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public ItemResponse getActiveItem(Long id) {
        Live live = findEntityById(id);
        assertCanViewLive(live.getBranch().getId());
        assertLiveBelongsToCurrentTenant(live);
        return live.getActiveItem() == null ? null : toItemResponse(live.getActiveItem());
    }

    public LiveResponse setActiveItem(Long id, LiveActiveItemRequest request) {
        Live live = findEntityById(id);
        if (request == null || request.getItemId() == null) {
            assertCanRemoveLiveActiveItem(live.getBranch().getId());
        } else {
            assertCanChangeLiveActiveItem(live.getBranch().getId());
        }
        assertLiveBelongsToCurrentTenant(live);

        if (live.getStatus() == LiveStatus.CLOSED) {
            throw new IllegalArgumentException("No se puede cambiar producto activo de un En vivo cerrado");
        }

        Long previousItemId = live.getActiveItem() != null ? live.getActiveItem().getId() : null;

        if (request == null || request.getItemId() == null) {
            live.setActiveItem(null);
            Live saved = repository.save(live);
            recordActiveItemChanged(saved, previousItemId, null);
            return toResponse(saved);
        }

        CurrentTenantContext tenant = tenantResolver.resolveCurrent();
        Item item = itemRepository.findByCompanyIdAndId(tenant.getCompanyId(), request.getItemId())
                .orElseThrow(() -> new IllegalArgumentException("Item no encontrado con id: " + request.getItemId()));

        if (!live.getBranch().getId().equals(item.getBranch().getId())) {
            throw new AccessDeniedException("El item no pertenece a la sucursal del En vivo");
        }

        live.setActiveItem(item);
        Live saved = repository.save(live);
        recordActiveItemChanged(saved, previousItemId, item.getId());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<LiveEventResponse> findEvents(Long id) {
        Live live = findEntityById(id);
        assertCanViewLive(live.getBranch().getId());
        return liveEventService.findByLive(id);
    }

    private void recordActiveItemChanged(Live live, Long previousItemId, Long nextItemId) {
        liveEventService.record(
                live,
                LiveEventType.ACTIVE_ITEM_CHANGED,
                currentUser.getUserId(),
                "ITEM",
                nextItemId,
                "{\"previousItemId\":" + nullableNumber(previousItemId)
                        + ",\"activeItemId\":" + nullableNumber(nextItemId) + "}"
        );
    }

    private String nullableNumber(Long value) {
        return value == null ? "null" : value.toString();
    }

    private Live findEntityById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Live no encontrado con id: " + id));
    }

    private void assertCanViewLive(Long branchId) {
        assertCanAnyLivePermission(
                branchId,
                PermissionCode.VIEW_LIVE,
                PermissionCode.OPERATE_LIVE,
                PermissionCode.DO_LIVE_RESERVATION
        );
    }

    private void assertCanOperateLiveSession(Long branchId) {
        assertCanAnyLivePermission(
                branchId,
                PermissionCode.OPERATE_LIVE,
                PermissionCode.DO_LIVE_RESERVATION
        );
    }

    private void assertCanChangeLiveActiveItem(Long branchId) {
        assertCanAnyLivePermission(
                branchId,
                PermissionCode.CHANGE_LIVE_ACTIVE_ITEM,
                PermissionCode.DO_LIVE_RESERVATION
        );
    }

    private void assertCanRemoveLiveActiveItem(Long branchId) {
        assertCanAnyLivePermission(
                branchId,
                PermissionCode.REMOVE_LIVE_ACTIVE_ITEM,
                PermissionCode.DO_LIVE_RESERVATION
        );
    }

    private void assertCanAnyLivePermission(Long branchId, String primaryPermission, String... fallbackPermissions) {
        Long userId = currentUser.getUserId();

        if (accessService.can(userId, primaryPermission)) {
            accessService.assertCan(userId, primaryPermission, ChannelCode.LIVE, branchId);
            return;
        }

        for (String fallbackPermission : fallbackPermissions) {
            if (accessService.can(userId, fallbackPermission)) {
                accessService.assertCan(userId, fallbackPermission, ChannelCode.LIVE, branchId);
                return;
            }
        }

        accessService.assertCan(userId, primaryPermission, ChannelCode.LIVE, branchId);
    }

    private void assertBranchBelongsToCurrentTenant(Long branchId) {
        CurrentTenantContext tenant = tenantResolver.resolveCurrent();
        tenantResolver.assertBranchBelongsToCompany(branchId, tenant.getCompanyId());
        if (tenant.getBranchId() != null && !tenant.getBranchId().equals(branchId)) {
            throw new AccessDeniedException("La sucursal no pertenece a la sesion activa");
        }
    }

    private void assertLiveBelongsToCurrentTenant(Live live) {
        CurrentTenantContext tenant = tenantResolver.resolveCurrent();
        Long branchId = live.getBranch().getId();
        tenantResolver.assertBranchBelongsToCompany(branchId, tenant.getCompanyId());
        if (tenant.getBranchId() != null && !tenant.getBranchId().equals(branchId)) {
            throw new AccessDeniedException("El En vivo no pertenece a la sucursal activa");
        }
    }

    private LiveResponse toResponse(Live entity) {
        Item activeItem = entity.getActiveItem();

        return new LiveResponse(
                entity.getId(),
                entity.getBranch().getId(),
                entity.getBranch().getCode(),
                entity.getBranch().getName(),
                entity.getStatus().name(),
                entity.getNotes(),
                entity.getCreatedByUserId(),
                entity.getCreatedAt(),
                entity.getStartedAt(),
                entity.getEndedAt(),
                activeItem != null ? activeItem.getId() : null,
                activeItem != null ? activeItem.getCode() : null,
                activeItem != null ? activeItem.getQrCode() : null,
                activeItem != null ? activeItem.getBranch().getId() : null,
                activeItem != null && activeItem.getProductType() != null
                        ? activeItem.getProductType().getName()
                        : null,
                activeItem != null && activeItem.getBrand() != null
                        ? activeItem.getBrand().getName()
                        : null,
                activeItem != null && activeItem.getSize() != null
                        ? activeItem.getSize().getName()
                        : null,
                activeItem != null ? activeItem.getPrice() : null,
                activeItem != null && activeItem.getStatus() != null
                        ? activeItem.getStatus().name()
                        : null
        );
    }

    private ItemResponse toItemResponse(Item item) {
        return new ItemResponse(
                item.getId(),
                item.getCode(),
                item.getQrCode(),
                item.getBranch().getId(),
                item.getBranch().getCode(),
                item.getBatch() != null ? item.getBatch().getId() : null,
                item.getBatch() != null ? item.getBatch().getFolio() : null,
                item.getProductType() != null ? item.getProductType().getId() : null,
                item.getProductType() != null ? item.getProductType().getCode() : null,
                item.getProductType() != null ? item.getProductType().getName() : null,
                item.getBrand() != null ? item.getBrand().getId() : null,
                item.getBrand() != null ? item.getBrand().getCode() : null,
                item.getBrand() != null ? item.getBrand().getName() : null,
                item.getSize() != null ? item.getSize().getId() : null,
                item.getSize() != null ? item.getSize().getCode() : null,
                item.getSize() != null ? item.getSize().getName() : null,
                item.getComments(),
                item.getPrice(),
                item.getStatus() != null ? item.getStatus().name() : null,
                item.getStorageLocation() != null ? item.getStorageLocation().getId() : null,
                item.getStorageLocation() != null ? item.getStorageLocation().getCode() : null,
                item.getStorageLocation() != null ? item.getStorageLocation().getName() : null,
                item.getCreatedByUserId()
        );
    }
}
