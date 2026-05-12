package com.hpsqsoft.ctrlropa.inventory;

import com.hpsqsoft.ctrlropa.branch.Branch;
import com.hpsqsoft.ctrlropa.branch.BranchRepository;
import com.hpsqsoft.ctrlropa.common.Status;
import com.hpsqsoft.ctrlropa.item.Item;
import com.hpsqsoft.ctrlropa.item.ItemRepository;
import com.hpsqsoft.ctrlropa.item.ItemStatus;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class StorageLocationService {

    private final StorageLocationRepository repository;
    private final BranchRepository branchRepository;
    private final ItemRepository itemRepository;

    public StorageLocationService(StorageLocationRepository repository,
                                  BranchRepository branchRepository,
                                  ItemRepository itemRepository) {
        this.repository = repository;
        this.branchRepository = branchRepository;
        this.itemRepository = itemRepository;
    }

    @Transactional(readOnly = true)
    public List<StorageLocationResponse> findByBranch(Long branchId) {
        return repository.findByBranchIdOrderByNameAsc(branchId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StorageLocationResponse> findActiveByBranch(Long branchId) {
        return repository.findByBranchIdAndStatusOrderByNameAsc(branchId, Status.ACTIVE)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public StorageLocationResponse findById(Long id) {
        return toResponse(findEntity(id));
    }

    @Transactional(readOnly = true)
    public StorageLocationDetailResponse findDetail(Long id) {
        StorageLocation location = findEntity(id);
        List<Item> items = itemRepository.findByStorageLocationIdOrderByCreatedAtDesc(id);

        int availableItems = countByStatus(items, ItemStatus.AVAILABLE);
        int reservedItems = countByStatus(items, ItemStatus.RESERVED);
        int soldItems = countByStatus(items, ItemStatus.SOLD);
        int disabledItems = countByStatus(items, ItemStatus.DISABLED);
        int onConsignmentItems = countByStatus(items, ItemStatus.ON_CONSIGNMENT);

        return new StorageLocationDetailResponse(
                toResponse(location),
                items.size(),
                availableItems,
                reservedItems,
                soldItems,
                disabledItems,
                onConsignmentItems
        );
    }

    public StorageLocationResponse create(Long branchId, StorageLocation entity) {
        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new IllegalArgumentException("Sucursal no encontrada"));

        String code = cleanRequired(entity.getCode(), "code");
        String name = cleanRequired(entity.getName(), "name");

        if (repository.existsByBranchIdAndCode(branchId, code)) {
            throw new IllegalArgumentException("Ya existe una ubicación con código: " + code);
        }

        if (repository.existsByBranchIdAndName(branchId, name)) {
            throw new IllegalArgumentException("Ya existe una ubicación con nombre: " + name);
        }

        entity.setBranch(branch);
        entity.setCode(code);
        entity.setName(name);
        entity.setStatus(Status.ACTIVE);

        return toResponse(saveSafely(entity));
    }

    public StorageLocationResponse update(Long id, UpdateStorageLocationRequest request) {
        StorageLocation location = findEntity(id);

        if (request.getCode() != null) {
            String code = cleanRequired(request.getCode(), "code");

            if (repository.existsByBranchIdAndCodeAndIdNot(location.getBranch().getId(), code, location.getId())) {
                throw new IllegalArgumentException("Ya existe una ubicación con código: " + code);
            }

            location.setCode(code);
        }

        if (request.getName() != null) {
            String name = cleanRequired(request.getName(), "name");

            if (repository.existsByBranchIdAndNameAndIdNot(location.getBranch().getId(), name, location.getId())) {
                throw new IllegalArgumentException("Ya existe una ubicación con nombre: " + name);
            }

            location.setName(name);
        }

        return toResponse(saveSafely(location));
    }

    public StorageLocationResponse deactivate(Long id) {
        StorageLocation location = findEntity(id);

        List<Item> activeItems = itemRepository.findByStorageLocationIdOrderByCreatedAtDesc(id)
                .stream()
                .filter(item -> item.getStatus() == ItemStatus.AVAILABLE || item.getStatus() == ItemStatus.RESERVED)
                .toList();

        if (!activeItems.isEmpty()) {
            throw new IllegalArgumentException("No se puede desactivar una ubicación con items disponibles o reservados");
        }

        location.setStatus(Status.INACTIVE);

        return toResponse(saveSafely(location));
    }

    public StorageLocationResponse activate(Long id) {
        StorageLocation location = findEntity(id);

        location.setStatus(Status.ACTIVE);

        return toResponse(saveSafely(location));
    }

    private StorageLocation findEntity(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ubicación no encontrada con id: " + id));
    }

    private int countByStatus(List<Item> items, ItemStatus status) {
        return (int) items.stream()
                .filter(item -> item.getStatus() == status)
                .count();
    }

    private String cleanRequired(String value, String fieldName) {
        if (value == null || value.trim().isBlank()) {
            throw new IllegalArgumentException(fieldName + " es obligatorio");
        }

        return value.trim();
    }

    private StorageLocation saveSafely(StorageLocation entity) {
        try {
            return repository.save(entity);
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalArgumentException("Ya existe una ubicación con el mismo código o nombre en la sucursal");
        }
    }

    private StorageLocationResponse toResponse(StorageLocation entity) {
        return new StorageLocationResponse(
                entity.getId(),
                entity.getBranch().getId(),
                entity.getBranch().getCode(),
                entity.getBranch().getName(),
                entity.getCode(),
                entity.getName(),
                entity.getStatus().name(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}