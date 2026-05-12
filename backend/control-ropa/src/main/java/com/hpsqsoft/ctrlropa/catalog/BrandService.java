package com.hpsqsoft.ctrlropa.catalog;

import com.hpsqsoft.ctrlropa.common.Status;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class BrandService {

    private final BrandRepository repository;

    public BrandService(BrandRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<Brand> findAll() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public Brand findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Marca no encontrada con id: " + id));
    }

    public Brand create(Brand entity) {
        validateNew(entity);
        return saveSafely(entity);
    }

    public Brand update(Long id, Brand request) {
        Brand existing = findById(id);

        if (!existing.getCode().equals(request.getCode()) && repository.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Ya existe una marca con código: " + request.getCode());
        }

        if (!existing.getName().equals(request.getName()) && repository.existsByName(request.getName())) {
            throw new IllegalArgumentException("Ya existe una marca con nombre: " + request.getName());
        }

        existing.setCode(request.getCode());
        existing.setName(request.getName());
        existing.setStatus(request.getStatus());

        return saveSafely(existing);
    }

    public void deactivate(Long id) {
        Brand existing = findById(id);
        existing.setStatus(Status.INACTIVE);
        repository.save(existing);
    }

    private void validateNew(Brand entity) {
        if (repository.existsByCode(entity.getCode())) {
            throw new IllegalArgumentException("Ya existe una marca con código: " + entity.getCode());
        }
        if (repository.existsByName(entity.getName())) {
            throw new IllegalArgumentException("Ya existe una marca con nombre: " + entity.getName());
        }
    }

    private Brand saveSafely(Brand entity) {
        try {
            return repository.save(entity);
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalArgumentException("Ya existe una marca con el mismo código o nombre");
        }
    }
}