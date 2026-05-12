package com.hpsqsoft.ctrlropa.catalog;

import com.hpsqsoft.ctrlropa.common.Status;
import com.hpsqsoft.ctrlropa.security.access.AccessService;
import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import com.hpsqsoft.ctrlropa.security.access.PermissionCode;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class SalesChannelService {

    private final SalesChannelRepository repository;
    private final AccessService accessService;
    private final CurrentUser currentUser;

    public SalesChannelService(SalesChannelRepository repository,
                               AccessService accessService,
                               CurrentUser currentUser) {
        this.repository = repository;
        this.accessService = accessService;
        this.currentUser = currentUser;
    }

    @Transactional(readOnly = true)
    public List<SalesChannel> findAll() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public List<SalesChannel> findActive() {
        return repository.findByStatusAndGlobalEnabledTrueOrderByNameAsc(Status.ACTIVE);
    }

    @Transactional(readOnly = true)
    public SalesChannel findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Canal no encontrado con id: " + id));
    }

    public SalesChannel create(SalesChannel entity) {
        assertSystemAccess();
        validateNew(entity);
        return saveSafely(entity);
    }

    public SalesChannel update(Long id, SalesChannel request) {
        assertSystemAccess();
        SalesChannel existing = findById(id);

        if (!existing.getCode().equals(request.getCode()) && repository.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Ya existe un canal con código: " + request.getCode());
        }

        if (!existing.getName().equals(request.getName()) && repository.existsByName(request.getName())) {
            throw new IllegalArgumentException("Ya existe un canal con nombre: " + request.getName());
        }

        existing.setCode(request.getCode());
        existing.setName(request.getName());
        existing.setStatus(request.getStatus());

        return saveSafely(existing);
    }

    public SalesChannel updateGlobalEnabled(Long id, Boolean globalEnabled) {
        assertSystemAccess();
        SalesChannel existing = findById(id);
        existing.setGlobalEnabled(Boolean.TRUE.equals(globalEnabled));
        return repository.save(existing);
    }

    public SalesChannel deactivate(Long id) {
        assertSystemAccess();
        SalesChannel existing = findById(id);
        existing.setStatus(Status.INACTIVE);
        return repository.save(existing);
    }

    private void validateNew(SalesChannel entity) {
        if (repository.existsByCode(entity.getCode())) {
            throw new IllegalArgumentException("Ya existe un canal con código: " + entity.getCode());
        }
        if (repository.existsByName(entity.getName())) {
            throw new IllegalArgumentException("Ya existe un canal con nombre: " + entity.getName());
        }
    }

    private SalesChannel saveSafely(SalesChannel entity) {
        try {
            return repository.save(entity);
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalArgumentException("Ya existe un canal con el mismo código o nombre");
        }
    }

    private void assertSystemAccess() {
        accessService.assertCan(currentUser.getUserId(), PermissionCode.MANAGE_ROLES);
    }
}
