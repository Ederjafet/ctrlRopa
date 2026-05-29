package com.hpsqsoft.ctrlropa.live;

import com.hpsqsoft.ctrlropa.tenant.CurrentTenantContext;
import com.hpsqsoft.ctrlropa.tenant.TenantResolver;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class LiveEventService {

    private final LiveEventRepository repository;
    private final LiveRepository liveRepository;
    private final TenantResolver tenantResolver;

    public LiveEventService(LiveEventRepository repository,
                            LiveRepository liveRepository,
                            TenantResolver tenantResolver) {
        this.repository = repository;
        this.liveRepository = liveRepository;
        this.tenantResolver = tenantResolver;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void record(Live live,
                       LiveEventType eventType,
                       Long actorUserId,
                       String entityType,
                       Long entityId,
                       String payloadJson) {
        if (live == null || eventType == null || live.getBranch() == null) {
            return;
        }

        LiveEvent event = new LiveEvent();
        event.setCompanyId(live.getBranch().getCompany().getId());
        event.setBranchId(live.getBranch().getId());
        event.setLive(live);
        event.setActorUserId(actorUserId);
        event.setEventType(eventType);
        event.setEntityType(entityType);
        event.setEntityId(entityId);
        event.setPayloadJson(payloadJson);
        repository.save(event);
    }

    @Transactional(readOnly = true)
    public List<LiveEventResponse> findByLive(Long liveId) {
        Live live = liveRepository.findById(liveId)
                .orElseThrow(() -> new IllegalArgumentException("Live no encontrado con id: " + liveId));
        assertLiveBelongsToCurrentTenant(live);

        return repository.findTop50ByLiveIdOrderByCreatedAtDesc(liveId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private void assertLiveBelongsToCurrentTenant(Live live) {
        CurrentTenantContext tenant = tenantResolver.resolveCurrent();
        Long branchId = live.getBranch().getId();
        tenantResolver.assertBranchBelongsToCompany(branchId, tenant.getCompanyId());
        if (tenant.getBranchId() != null && !tenant.getBranchId().equals(branchId)) {
            throw new AccessDeniedException("El En vivo no pertenece a la sucursal activa");
        }
    }

    private LiveEventResponse toResponse(LiveEvent event) {
        return new LiveEventResponse(
                event.getId(),
                event.getCompanyId(),
                event.getBranchId(),
                event.getLive().getId(),
                event.getActorUserId(),
                event.getEventType().name(),
                event.getEntityType(),
                event.getEntityId(),
                event.getPayloadJson(),
                event.getCreatedAt()
        );
    }
}
