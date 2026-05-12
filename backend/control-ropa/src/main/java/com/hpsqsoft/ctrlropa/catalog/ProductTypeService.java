package com.hpsqsoft.ctrlropa.catalog;

import com.hpsqsoft.ctrlropa.common.Status;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ProductTypeService {

    private final ProductTypeRepository repository;

    public ProductTypeService(ProductTypeRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<ProductType> findAll() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public List<ProductType> findActive() {
        return repository.findByStatusOrderByNameAsc(Status.ACTIVE);
    }

    @Transactional(readOnly = true)
    public ProductType findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tipo de prenda no encontrado con id: " + id));
    }

    public ProductType create(ProductType entity) {
        validateNew(entity);
        return saveSafely(entity);
    }

    public ProductType update(Long id, ProductType request) {
        ProductType existing = findById(id);

        if (!existing.getCode().equals(request.getCode()) && repository.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Ya existe un tipo de prenda con código: " + request.getCode());
        }

        if (!existing.getName().equals(request.getName()) && repository.existsByName(request.getName())) {
            throw new IllegalArgumentException("Ya existe un tipo de prenda con nombre: " + request.getName());
        }

        existing.setCode(request.getCode());
        existing.setName(request.getName());
        existing.setStatus(request.getStatus());

        return saveSafely(existing);
    }

    public ProductType deactivate(Long id) {
        ProductType existing = findById(id);
        existing.setStatus(Status.INACTIVE);
        return repository.save(existing);
    }

    private void validateNew(ProductType entity) {
        if (repository.existsByCode(entity.getCode())) {
            throw new IllegalArgumentException("Ya existe un tipo de prenda con código: " + entity.getCode());
        }

        if (repository.existsByName(entity.getName())) {
            throw new IllegalArgumentException("Ya existe un tipo de prenda con nombre: " + entity.getName());
        }
    }

    private ProductType saveSafely(ProductType entity) {
        try {
            return repository.save(entity);
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalArgumentException("Ya existe un tipo de prenda con el mismo código o nombre");
        }
    }
}