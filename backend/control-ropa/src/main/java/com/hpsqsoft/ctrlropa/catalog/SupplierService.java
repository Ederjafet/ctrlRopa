package com.hpsqsoft.ctrlropa.catalog;

import com.hpsqsoft.ctrlropa.common.Status;
import com.hpsqsoft.ctrlropa.security.access.AccessService;
import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import com.hpsqsoft.ctrlropa.security.access.PermissionCode;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
@Transactional
public class SupplierService {

    private final SupplierRepository repository;
    private final AccessService accessService;
    private final CurrentUser currentUser;

    public SupplierService(SupplierRepository repository,
                           AccessService accessService,
                           CurrentUser currentUser) {
        this.repository = repository;
        this.accessService = accessService;
        this.currentUser = currentUser;
    }

    @Transactional(readOnly = true)
    public List<Supplier> findAll() {
        assertCanReadSuppliers();
        return repository.findAll()
                .stream()
                .sorted(Comparator.comparing(Supplier::getName, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    @Transactional(readOnly = true)
    public Supplier findById(Long id) {
        assertCanReadSuppliers();
        return repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Proveedor no encontrado con id: " + id));
    }

    public Supplier create(Supplier entity) {
        assertCanManageSuppliers();
        normalize(entity);
        validateNew(entity);
        return saveSafely(entity);
    }

    public Supplier update(Long id, Supplier request) {
        assertCanManageSuppliers();
        Supplier existing = findById(id);
        normalize(request);

        if (!existing.getCode().equalsIgnoreCase(request.getCode())
                && repository.existsByCodeIgnoreCase(request.getCode())) {
            throw new IllegalArgumentException("Ya existe un proveedor con código: " + request.getCode());
        }

        if (!existing.getName().equalsIgnoreCase(request.getName())
                && repository.existsByNameIgnoreCase(request.getName())) {
            throw new IllegalArgumentException("Ya existe un proveedor con nombre: " + request.getName());
        }

        existing.setCode(request.getCode());
        existing.setName(request.getName());
        existing.setDescription(cleanNullable(request.getDescription()));
        existing.setStatus(request.getStatus() == null ? Status.ACTIVE : request.getStatus());

        return saveSafely(existing);
    }

    public void deactivate(Long id) {
        assertCanManageSuppliers();
        Supplier existing = findById(id);
        existing.setStatus(Status.INACTIVE);
        repository.save(existing);
    }

    private void validateNew(Supplier entity) {
        if (repository.existsByCodeIgnoreCase(entity.getCode())) {
            throw new IllegalArgumentException("Ya existe un proveedor con código: " + entity.getCode());
        }
        if (repository.existsByNameIgnoreCase(entity.getName())) {
            throw new IllegalArgumentException("Ya existe un proveedor con nombre: " + entity.getName());
        }
    }

    private void normalize(Supplier entity) {
        entity.setCode(requireClean(entity.getCode(), "código").toUpperCase(Locale.ROOT));
        entity.setName(requireClean(entity.getName(), "nombre"));
        entity.setDescription(cleanNullable(entity.getDescription()));
        if (entity.getStatus() == null) {
            entity.setStatus(Status.ACTIVE);
        }
    }

    private void assertCanReadSuppliers() {
        Long userId = currentUser.getUserId();
        if (accessService.can(userId, PermissionCode.VIEW_INVENTORY)
                || accessService.can(userId, PermissionCode.MANAGE_CATALOGS)) {
            return;
        }
        accessService.assertCan(userId, PermissionCode.VIEW_INVENTORY);
    }

    private void assertCanManageSuppliers() {
        accessService.assertCan(currentUser.getUserId(), PermissionCode.MANAGE_CATALOGS);
    }

    private Supplier saveSafely(Supplier entity) {
        try {
            return repository.save(entity);
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalArgumentException("Ya existe un proveedor con el mismo código o nombre");
        }
    }

    private String requireClean(String value, String label) {
        String clean = cleanNullable(value);
        if (clean == null) {
            throw new IllegalArgumentException("El " + label + " es obligatorio");
        }
        return clean;
    }

    private String cleanNullable(String value) {
        if (value == null) return null;
        String clean = value.trim();
        return clean.isEmpty() ? null : clean;
    }
}
