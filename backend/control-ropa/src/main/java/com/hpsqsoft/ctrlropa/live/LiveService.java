package com.hpsqsoft.ctrlropa.live;

import com.hpsqsoft.ctrlropa.branch.Branch;
import com.hpsqsoft.ctrlropa.branch.BranchRepository;
import com.hpsqsoft.ctrlropa.security.access.AccessService;
import com.hpsqsoft.ctrlropa.security.access.ChannelCode;
import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import com.hpsqsoft.ctrlropa.security.access.PermissionCode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class LiveService {

    private final LiveRepository repository;
    private final BranchRepository branchRepository;
    private final AccessService accessService;
    private final CurrentUser currentUser;

    public LiveService(LiveRepository repository,
                       BranchRepository branchRepository,
                       AccessService accessService,
                       CurrentUser currentUser) {
        this.repository = repository;
        this.branchRepository = branchRepository;
        this.accessService = accessService;
        this.currentUser = currentUser;
    }

    @Transactional(readOnly = true)
    public List<LiveResponse> findByBranch(Long branchId) {
        return repository.findByBranchIdOrderByCreatedAtDesc(branchId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public LiveResponse findById(Long id) {
        return toResponse(findEntityById(id));
    }

    public LiveResponse create(Long branchId, Live entity) {
        Long userId = currentUser.getUserId();

        accessService.assertCan(
                userId,
                PermissionCode.DO_LIVE_RESERVATION,
                ChannelCode.LIVE,
                branchId
        );

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
        Long userId = currentUser.getUserId();
        Live existing = findEntityById(id);

        accessService.assertCan(
                userId,
                PermissionCode.DO_LIVE_RESERVATION,
                ChannelCode.LIVE,
                existing.getBranch().getId()
        );

        existing.setStatus(LiveStatus.ACTIVE);

        if (existing.getStartedAt() == null) {
            existing.setStartedAt(LocalDateTime.now());
        }

        return toResponse(repository.save(existing));
    }

    public LiveResponse close(Long id) {
        Long userId = currentUser.getUserId();
        Live existing = findEntityById(id);

        accessService.assertCan(
                userId,
                PermissionCode.DO_LIVE_RESERVATION,
                ChannelCode.LIVE,
                existing.getBranch().getId()
        );

        existing.setStatus(LiveStatus.CLOSED);
        existing.setEndedAt(LocalDateTime.now());

        return toResponse(repository.save(existing));
    }

    private Live findEntityById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Live no encontrado con id: " + id));
    }

    private LiveResponse toResponse(Live entity) {
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
                entity.getEndedAt()
        );
    }
}