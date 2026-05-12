package com.hpsqsoft.ctrlropa.catalog;

import com.hpsqsoft.ctrlropa.common.Status;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class PaymentMethodService {

    private final PaymentMethodRepository repository;

    public PaymentMethodService(PaymentMethodRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<PaymentMethod> findAll() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public PaymentMethod findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Método de pago no encontrado con id: " + id));
    }

    public PaymentMethod create(PaymentMethod entity) {
        validateNew(entity);
        return saveSafely(entity);
    }

    public PaymentMethod update(Long id, PaymentMethod request) {
        PaymentMethod existing = findById(id);

        if (!existing.getCode().equals(request.getCode()) && repository.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Ya existe un método de pago con código: " + request.getCode());
        }

        if (!existing.getName().equals(request.getName()) && repository.existsByName(request.getName())) {
            throw new IllegalArgumentException("Ya existe un método de pago con nombre: " + request.getName());
        }

        existing.setCode(request.getCode());
        existing.setName(request.getName());
        existing.setStatus(request.getStatus());

        return saveSafely(existing);
    }

    public void deactivate(Long id) {
        PaymentMethod existing = findById(id);
        existing.setStatus(Status.INACTIVE);
        repository.save(existing);
    }

    private void validateNew(PaymentMethod entity) {
        if (repository.existsByCode(entity.getCode())) {
            throw new IllegalArgumentException("Ya existe un método de pago con código: " + entity.getCode());
        }
        if (repository.existsByName(entity.getName())) {
            throw new IllegalArgumentException("Ya existe un método de pago con nombre: " + entity.getName());
        }
    }

    private PaymentMethod saveSafely(PaymentMethod entity) {
        try {
            return repository.save(entity);
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalArgumentException("Ya existe un método de pago con el mismo código o nombre");
        }
    }
}