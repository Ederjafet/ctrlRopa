package com.hpsqsoft.ctrlropa.batch;

import com.hpsqsoft.ctrlropa.branch.Branch;
import com.hpsqsoft.ctrlropa.branch.BranchRepository;
import com.hpsqsoft.ctrlropa.catalog.ProductType;
import com.hpsqsoft.ctrlropa.catalog.ProductTypeRepository;
import com.hpsqsoft.ctrlropa.catalog.Supplier;
import com.hpsqsoft.ctrlropa.catalog.SupplierRepository;
import com.hpsqsoft.ctrlropa.common.Status;
import com.hpsqsoft.ctrlropa.item.ItemRepository;
import com.hpsqsoft.ctrlropa.security.access.AccessService;
import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import com.hpsqsoft.ctrlropa.security.access.PermissionCode;
import com.hpsqsoft.ctrlropa.tenant.CurrentTenantContext;
import com.hpsqsoft.ctrlropa.tenant.TenantResolver;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Year;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional
public class BatchService {

    private final BatchRepository batchRepository;
    private final BatchClassificationDetailRepository classificationRepository;
    private final BranchRepository branchRepository;
    private final ProductTypeRepository productTypeRepository;
    private final SupplierRepository supplierRepository;
    private final ItemRepository itemRepository;
    private final AccessService accessService;
    private final CurrentUser currentUser;
    private final TenantResolver tenantResolver;

    public BatchService(BatchRepository batchRepository,
                        BatchClassificationDetailRepository classificationRepository,
                        BranchRepository branchRepository,
                        ProductTypeRepository productTypeRepository,
                        SupplierRepository supplierRepository,
                        ItemRepository itemRepository,
                        AccessService accessService,
                        CurrentUser currentUser,
                        TenantResolver tenantResolver) {
        this.batchRepository = batchRepository;
        this.classificationRepository = classificationRepository;
        this.branchRepository = branchRepository;
        this.productTypeRepository = productTypeRepository;
        this.supplierRepository = supplierRepository;
        this.itemRepository = itemRepository;
        this.accessService = accessService;
        this.currentUser = currentUser;
        this.tenantResolver = tenantResolver;
    }

    @Transactional(readOnly = true)
    public List<BatchResponse> findByBranch(Long branchId) {
        accessService.assertCan(currentUser.getUserId(), PermissionCode.VIEW_INVENTORY);
        CurrentTenantContext tenant = resolveAndValidateBranch(branchId);

        return batchRepository.findByCompanyIdAndBranchIdOrderByCreatedAtDesc(tenant.getCompanyId(), branchId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public BatchResponse findById(Long id) {
        accessService.assertCan(currentUser.getUserId(), PermissionCode.VIEW_INVENTORY);
        return toResponse(findEntity(id, currentCompanyId()));
    }

    @Transactional(readOnly = true)
    public BatchResponse findByFolio(String folio) {
        accessService.assertCan(currentUser.getUserId(), PermissionCode.VIEW_INVENTORY);

        Batch batch = batchRepository.findByCompanyIdAndFolio(currentCompanyId(), folio)
                .orElseThrow(() -> new IllegalArgumentException("Lote no encontrado con folio: " + folio));

        validateBatchBranch(batch);
        return toResponse(batch);
    }

    public BatchResponse create(Long branchId, CreateBatchRequest request) {
        Long userId = currentUser.getUserId();
        accessService.assertCan(userId, PermissionCode.MANAGE_INVENTORY);

        if (request == null) {
            throw new IllegalArgumentException("La solicitud es obligatoria");
        }

        if (request.getExpectedQuantity() == null || request.getExpectedQuantity() <= 0) {
            throw new IllegalArgumentException("La cantidad esperada debe ser mayor a cero");
        }

        CurrentTenantContext tenant = resolveAndValidateBranch(branchId);
        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new IllegalArgumentException("Sucursal no encontrada"));

        Batch batch = new Batch();
        batch.setCompany(branch.getCompany());
        batch.setBranch(branch);
        batch.setSupplier(resolveSupplier(request.getSupplierId()));
        batch.setFolio(generateUniqueFolio(tenant.getCompanyId()));
        batch.setExpectedQuantity(request.getExpectedQuantity());
        batch.setReceivedQuantity(null);
        batch.setStatus(BatchStatus.ANNOUNCED);
        batch.setNotes(cleanNullable(request.getNotes()));
        batch.setCreatedByUserId(userId);

        return toResponse(batchRepository.save(batch));
    }

    public BatchResponse receive(Long id, ReceiveBatchRequest request) {
        Long userId = currentUser.getUserId();
        accessService.assertCan(userId, PermissionCode.MANAGE_INVENTORY);

        if (request == null) {
            throw new IllegalArgumentException("La solicitud es obligatoria");
        }

        if (request.getReceivedQuantity() == null || request.getReceivedQuantity() < 0) {
            throw new IllegalArgumentException("La cantidad recibida debe ser cero o mayor");
        }

        Batch batch = findEntity(id, currentCompanyId());
        assertNotCancelled(batch);

        if (batch.getStatus() == BatchStatus.RECONCILED) {
            throw new IllegalArgumentException("No se puede recibir un lote ya conciliado");
        }

        batch.setReceivedQuantity(request.getReceivedQuantity());
        batch.setReceivedAt(LocalDateTime.now());
        batch.setStatus(BatchStatus.RECEIVED);
        batch.setQualityScore(validateQualityScore(request.getQualityScore()));
        batch.setQualityNotes(cleanNullable(request.getQualityNotes()));

        String receivedNotes = cleanNullable(request.getNotes());
        if (receivedNotes != null) {
            batch.setNotes(appendNote(batch.getNotes(), "Recepción: " + receivedNotes));
        }

        return toResponse(batchRepository.save(batch));
    }

    public BatchResponse saveClassification(Long id, SaveBatchClassificationRequest request) {
        Long userId = currentUser.getUserId();
        accessService.assertCan(userId, PermissionCode.MANAGE_INVENTORY);

        Batch batch = findEntity(id, currentCompanyId());
        assertNotCancelled(batch);

        if (batch.getStatus() == BatchStatus.ANNOUNCED) {
            throw new IllegalArgumentException("Primero debes registrar la recepción del lote");
        }

        if (batch.getStatus() == BatchStatus.RECONCILED) {
            throw new IllegalArgumentException("No se puede modificar la clasificación de un lote conciliado");
        }

        if (request == null || request.getDetails() == null) {
            throw new IllegalArgumentException("La clasificación es obligatoria");
        }

        Map<Long, Integer> quantitiesByProductType = new LinkedHashMap<>();

        for (BatchClassificationDetailRequest detail : request.getDetails()) {
            if (detail == null) continue;

            if (detail.getProductTypeId() == null) {
                throw new IllegalArgumentException("El tipo de prenda es obligatorio");
            }

            if (detail.getQuantity() == null || detail.getQuantity() < 0) {
                throw new IllegalArgumentException("La cantidad clasificada debe ser cero o mayor");
            }

            if (detail.getQuantity() == 0) continue;

            quantitiesByProductType.merge(
                    detail.getProductTypeId(),
                    detail.getQuantity(),
                    Integer::sum
            );
        }

        int totalClassified = quantitiesByProductType.values()
                .stream()
                .mapToInt(Integer::intValue)
                .sum();

        if (batch.getReceivedQuantity() != null && totalClassified > batch.getReceivedQuantity()) {
            throw new IllegalArgumentException("La clasificación no puede superar la cantidad recibida");
        }

        classificationRepository.deleteByBatchId(batch.getId());
        classificationRepository.flush();

        for (Map.Entry<Long, Integer> entry : quantitiesByProductType.entrySet()) {
            ProductType productType = productTypeRepository.findById(entry.getKey())
                    .orElseThrow(() -> new IllegalArgumentException("Tipo de prenda no encontrado: " + entry.getKey()));

            BatchClassificationDetail entity = new BatchClassificationDetail();
            entity.setBatch(batch);
            entity.setProductType(productType);
            entity.setQuantity(entry.getValue());

            classificationRepository.save(entity);
        }

        return toResponse(batchRepository.save(batch));
    }

    public BatchResponse reconcile(Long id) {
        Long userId = currentUser.getUserId();
        accessService.assertCan(userId, PermissionCode.MANAGE_INVENTORY);

        Batch batch = findEntity(id, currentCompanyId());
        assertNotCancelled(batch);

        if (batch.getReceivedQuantity() == null) {
            throw new IllegalArgumentException("Primero debes registrar la recepción del lote");
        }

        int classifiedQuantity = getClassifiedQuantity(batch.getId());

        if (classifiedQuantity != batch.getReceivedQuantity()) {
            throw new IllegalArgumentException("Para conciliar, la clasificación debe coincidir con la cantidad recibida");
        }

        batch.setStatus(BatchStatus.RECONCILED);
        return toResponse(batchRepository.save(batch));
    }

    public BatchResponse cancel(Long id, CancelBatchRequest request) {
        Long userId = currentUser.getUserId();
        accessService.assertCan(userId, PermissionCode.MANAGE_INVENTORY);

        Batch batch = findEntity(id, currentCompanyId());

        if (batch.getStatus() == BatchStatus.CANCELLED) {
            return toResponse(batch);
        }

        assertNoCrossCompanyItems(batch);
        long itemCount = countTenantItems(batch);

        if (itemCount > 0) {
            throw new IllegalArgumentException("No se puede cancelar un lote que ya tiene prendas asociadas");
        }

        String reason = request == null ? null : cleanNullable(request.getReason());

        if (reason == null) {
            throw new IllegalArgumentException("El motivo de cancelación es obligatorio");
        }

        batch.setStatus(BatchStatus.CANCELLED);
        batch.setNotes(appendNote(batch.getNotes(), "Cancelación: " + reason));

        return toResponse(batchRepository.save(batch));
    }

    private Batch findEntity(Long id, Long companyId) {
        Batch batch = batchRepository.findByCompanyIdAndId(companyId, id)
                .orElseThrow(() -> new IllegalArgumentException("Lote no encontrado con id: " + id));
        validateBatchBranch(batch);
        return batch;
    }

    private void assertNotCancelled(Batch batch) {
        if (batch.getStatus() == BatchStatus.CANCELLED) {
            throw new IllegalArgumentException("No se puede modificar un lote cancelado");
        }
    }

    private String generateUniqueFolio(Long companyId) {
        String folio;

        do {
            folio = "L-" + Year.now().getValue() + "-" +
                    UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase();
        } while (batchRepository.existsByCompanyIdAndFolio(companyId, folio));

        return folio;
    }

    private BatchResponse toResponse(Batch batch) {
        List<BatchClassificationDetailResponse> classificationDetails = classificationRepository
                .findByBatchIdOrderByProductTypeNameAsc(batch.getId())
                .stream()
                .map(this::toClassificationResponse)
                .toList();

        int classifiedQuantity = classificationDetails.stream()
                .mapToInt(BatchClassificationDetailResponse::getQuantity)
                .sum();

        int itemCount = Math.toIntExact(countTenantItems(batch));

        return new BatchResponse(
                batch.getId(),
                batch.getBranch().getId(),
                batch.getBranch().getCode(),
                batch.getBranch().getName(),
                batch.getSupplier() == null ? null : batch.getSupplier().getId(),
                batch.getSupplier() == null ? null : batch.getSupplier().getName(),
                batch.getFolio(),
                batch.getExpectedQuantity(),
                batch.getReceivedQuantity(),
                batch.getReceivedAt(),
                classifiedQuantity,
                itemCount,
                batch.getStatus().name(),
                batch.getQualityScore(),
                batch.getQualityNotes(),
                batch.getNotes(),
                batch.getCreatedByUserId(),
                batch.getCreatedAt(),
                batch.getUpdatedAt(),
                classificationDetails
        );
    }

    private BatchClassificationDetailResponse toClassificationResponse(BatchClassificationDetail detail) {
        return new BatchClassificationDetailResponse(
                detail.getId(),
                detail.getProductType().getId(),
                detail.getProductType().getCode(),
                detail.getProductType().getName(),
                detail.getQuantity()
        );
    }

    private int getClassifiedQuantity(Long batchId) {
        return classificationRepository.findByBatchIdOrderByProductTypeNameAsc(batchId)
                .stream()
                .mapToInt(BatchClassificationDetail::getQuantity)
                .sum();
    }

    private String cleanNullable(String value) {
        if (value == null) return null;
        String clean = value.trim();
        return clean.isEmpty() ? null : clean;
    }

    private Supplier resolveSupplier(Long supplierId) {
        if (supplierId == null) {
            throw new IllegalArgumentException("Selecciona el proveedor del lote");
        }
        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new IllegalArgumentException("Proveedor no encontrado"));
        if (supplier.getStatus() != Status.ACTIVE) {
            throw new IllegalArgumentException("El proveedor seleccionado esta inactivo");
        }
        return supplier;
    }

    private Integer validateQualityScore(Integer qualityScore) {
        if (qualityScore == null) {
            throw new IllegalArgumentException("Selecciona la calidad del lote");
        }
        if (qualityScore < 1 || qualityScore > 5) {
            throw new IllegalArgumentException("La calidad debe estar entre 1 y 5");
        }
        return qualityScore;
    }

    private String appendNote(String current, String note) {
        if (current == null || current.isBlank()) return note;
        return current + "\n" + note;
    }

    private Long currentCompanyId() {
        return tenantResolver.resolveCurrent().getCompanyId();
    }

    private CurrentTenantContext resolveAndValidateBranch(Long branchId) {
        CurrentTenantContext tenant = tenantResolver.resolveCurrent();
        tenantResolver.assertBranchBelongsToCompany(branchId, tenant.getCompanyId());
        return tenant;
    }

    private void validateBatchBranch(Batch batch) {
        tenantResolver.assertBranchBelongsToCompany(batch.getBranch().getId(), batch.getCompany().getId());
    }

    private long countTenantItems(Batch batch) {
        return itemRepository.countByCompanyIdAndBatchId(batch.getCompany().getId(), batch.getId());
    }

    private void assertNoCrossCompanyItems(Batch batch) {
        long totalItems = itemRepository.countByBatchId(batch.getId());
        long tenantItems = countTenantItems(batch);
        if (totalItems != tenantItems) {
            throw new IllegalStateException("El lote tiene prendas asociadas a otra compania");
        }
    }
}
