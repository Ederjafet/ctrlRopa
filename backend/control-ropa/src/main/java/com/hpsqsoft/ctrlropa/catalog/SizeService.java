package com.hpsqsoft.ctrlropa.catalog;

import com.hpsqsoft.ctrlropa.common.Status;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class SizeService {

    private final SizeRepository repository;

    public SizeService(SizeRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<Size> findAll() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public Size findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Talla no encontrada con id: " + id));
    }

    public Size create(Size entity) {
        validateNew(entity);
        return saveSafely(entity);
    }

    public Size update(Long id, Size request) {
        Size existing = findById(id);

        if (!existing.getCode().equals(request.getCode()) && repository.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Ya existe una talla con código: " + request.getCode());
        }

        if (!existing.getName().equals(request.getName()) && repository.existsByName(request.getName())) {
            throw new IllegalArgumentException("Ya existe una talla con nombre: " + request.getName());
        }

        existing.setCode(request.getCode());
        existing.setName(request.getName());
        existing.setSortOrder(request.getSortOrder());
        existing.setStatus(request.getStatus());

        return saveSafely(existing);
    }

    public void deactivate(Long id) {
        Size existing = findById(id);
        existing.setStatus(Status.INACTIVE);
        repository.save(existing);
    }

    private void validateNew(Size entity) {
        if (repository.existsByCode(entity.getCode())) {
            throw new IllegalArgumentException("Ya existe una talla con código: " + entity.getCode());
        }
        if (repository.existsByName(entity.getName())) {
            throw new IllegalArgumentException("Ya existe una talla con nombre: " + entity.getName());
        }
    }

    private Size saveSafely(Size entity) {
        try {
            return repository.save(entity);
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalArgumentException("Ya existe una talla con el mismo código o nombre");
        }
    }
}