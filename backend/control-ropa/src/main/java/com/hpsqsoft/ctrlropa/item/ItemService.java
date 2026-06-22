package com.hpsqsoft.ctrlropa.item;

import com.hpsqsoft.ctrlropa.batch.Batch;
import com.hpsqsoft.ctrlropa.batch.BatchRepository;
import com.hpsqsoft.ctrlropa.branch.Branch;
import com.hpsqsoft.ctrlropa.branch.BranchRepository;
import com.hpsqsoft.ctrlropa.catalog.Brand;
import com.hpsqsoft.ctrlropa.catalog.BrandRepository;
import com.hpsqsoft.ctrlropa.catalog.ProductType;
import com.hpsqsoft.ctrlropa.catalog.ProductTypeRepository;
import com.hpsqsoft.ctrlropa.catalog.Size;
import com.hpsqsoft.ctrlropa.catalog.SizeRepository;
import com.hpsqsoft.ctrlropa.inventory.StorageLocation;
import com.hpsqsoft.ctrlropa.inventory.StorageLocationRepository;
import com.hpsqsoft.ctrlropa.security.access.AccessService;
import com.hpsqsoft.ctrlropa.security.access.PermissionCode;
import com.hpsqsoft.ctrlropa.tenant.CurrentTenantContext;
import com.hpsqsoft.ctrlropa.tenant.TenantResolver;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hpsqsoft.ctrlropa.customerpackage.CustomerPackage;
import com.hpsqsoft.ctrlropa.customerpackage.CustomerPackageItem;
import com.hpsqsoft.ctrlropa.customerpackage.CustomerPackageItemRepository;
import com.hpsqsoft.ctrlropa.customerpackage.CustomerPackageRepository;
import com.hpsqsoft.ctrlropa.reservation.Reservation;
import com.hpsqsoft.ctrlropa.reservation.ReservationRepository;
import com.hpsqsoft.ctrlropa.reservation.ReservationStatus;
import com.hpsqsoft.ctrlropa.sale.Sale;
import com.hpsqsoft.ctrlropa.sale.SaleRepository;
import com.hpsqsoft.ctrlropa.sale.SaleStatus;
import com.hpsqsoft.ctrlropa.shipment.Shipment;
import com.hpsqsoft.ctrlropa.shipment.ShipmentPackage;
import com.hpsqsoft.ctrlropa.shipment.ShipmentPackageRepository;
import com.hpsqsoft.ctrlropa.shipment.ShipmentRepository;

import java.util.List;

@Service
@Transactional
public class ItemService {

    private final ItemRepository repository;
    private final BranchRepository branchRepository;
    private final BatchRepository batchRepository;
    private final ProductTypeRepository productTypeRepository;
    private final BrandRepository brandRepository;
    private final SizeRepository sizeRepository;
    private final StorageLocationRepository storageLocationRepository;
    private final AccessService accessService;
    private final TenantResolver tenantResolver;
    
    private final SaleRepository saleRepository;
    private final ReservationRepository reservationRepository;
    private final CustomerPackageItemRepository customerPackageItemRepository;
    private final CustomerPackageRepository customerPackageRepository;
    private final ShipmentPackageRepository shipmentPackageRepository;
    private final ShipmentRepository shipmentRepository;

    public ItemService(ItemRepository repository,
                       BranchRepository branchRepository,
                       BatchRepository batchRepository,
                       ProductTypeRepository productTypeRepository,
                       BrandRepository brandRepository,
                       SizeRepository sizeRepository,
                       StorageLocationRepository storageLocationRepository,
                       AccessService accessService,
                       SaleRepository saleRepository,
                       ReservationRepository reservationRepository,
                       CustomerPackageItemRepository customerPackageItemRepository,
                       CustomerPackageRepository customerPackageRepository,
                       ShipmentPackageRepository shipmentPackageRepository,
                       ShipmentRepository shipmentRepository,
                       TenantResolver tenantResolver) {
        this.repository = repository;
        this.branchRepository = branchRepository;
        this.batchRepository = batchRepository;
        this.productTypeRepository = productTypeRepository;
        this.brandRepository = brandRepository;
        this.sizeRepository = sizeRepository;
        this.storageLocationRepository = storageLocationRepository;
        this.accessService = accessService;
        
        this.saleRepository = saleRepository;
        this.reservationRepository = reservationRepository;
        this.customerPackageItemRepository = customerPackageItemRepository;
        this.customerPackageRepository = customerPackageRepository;
        this.shipmentPackageRepository = shipmentPackageRepository;
        this.shipmentRepository = shipmentRepository;
        this.tenantResolver = tenantResolver;
    }

    @Transactional(readOnly = true)
    public List<ItemResponse> findByBranch(Long branchId) {
        CurrentTenantContext tenant = resolveAndValidateBranch(branchId);
        accessService.assertCan(tenant.getUserId(), PermissionCode.VIEW_INVENTORY);
        return repository.findByCompanyIdAndBranchIdOrderByCreatedAtDesc(tenant.getCompanyId(), branchId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ItemResponse findById(Long id) {
        CurrentTenantContext tenant = tenantResolver.resolveCurrent();
        accessService.assertCan(tenant.getUserId(), PermissionCode.VIEW_INVENTORY);
        Item item = findEntityById(id, tenant.getCompanyId());
        assertItemBelongsToCurrentTenant(item);
        return toResponse(item);
    }

    @Transactional(readOnly = true)
    public ItemResponse findByCode(String code) {
        CurrentTenantContext tenant = tenantResolver.resolveCurrent();
        accessService.assertCan(tenant.getUserId(), PermissionCode.VIEW_INVENTORY);
        Item entity = repository.findByCompanyIdAndCode(tenant.getCompanyId(), code)
                .orElseThrow(() -> new IllegalArgumentException("Item no encontrado con código: " + code));
        assertItemBelongsToCurrentTenant(entity);
        return toResponse(entity);
    }
    
    @Transactional(readOnly = true)
    public ItemLookupResponse lookupByCode(String code) {
        CurrentTenantContext tenant = tenantResolver.resolveCurrent();
        accessService.assertCan(tenant.getUserId(), PermissionCode.VIEW_INVENTORY);
        Item item = repository.findByCompanyIdAndCode(tenant.getCompanyId(), code)
                .orElseThrow(() -> new IllegalArgumentException("Item no encontrado con código: " + code));

        assertItemBelongsToCurrentTenant(item);
        return buildLookup(item);
    }

    @Transactional(readOnly = true)
    public ItemLookupResponse lookupByQrCode(String qrCode) {
        CurrentTenantContext tenant = tenantResolver.resolveCurrent();
        accessService.assertCan(tenant.getUserId(), PermissionCode.VIEW_INVENTORY);
        Item item = repository.findByCompanyIdAndQrCode(tenant.getCompanyId(), qrCode)
                .orElseThrow(() -> new IllegalArgumentException("Item no encontrado con QR: " + qrCode));

        assertItemBelongsToCurrentTenant(item);
        return buildLookup(item);
    }

    private ItemLookupResponse buildLookup(Item item) {
        Sale sale = saleRepository.findByItemIdAndStatus(item.getId(), SaleStatus.ACTIVE)
                .orElse(null);

        Reservation reservation = reservationRepository.findByItemIdAndStatus(item.getId(), ReservationStatus.ACTIVE)
                .orElse(null);

        CustomerPackageItem packageItem = customerPackageItemRepository
                .findByItemIdOrderByCreatedAtDesc(item.getId())
                .stream()
                .findFirst()
                .orElse(null);

        CustomerPackage customerPackage = null;
        ShipmentPackage shipmentPackage = null;
        Shipment shipment = null;

        if (packageItem != null) {
            customerPackage = customerPackageRepository.findById(packageItem.getCustomerPackageId()).orElse(null);

            if (customerPackage != null) {
                shipmentPackage = shipmentPackageRepository
                        .findByCustomerPackageIdOrderByIdDesc(customerPackage.getId())
                        .stream()
                        .findFirst()
                        .orElse(null);

                if (shipmentPackage != null) {
                    shipment = shipmentRepository.findById(shipmentPackage.getShipmentId()).orElse(null);
                }
            }
        }

        return new ItemLookupResponse(
                toResponse(item),
                sale != null ? toSaleInfo(sale) : null,
                reservation != null ? toReservationInfo(reservation) : null,
                customerPackage != null ? toPackageInfo(customerPackage, packageItem) : null,
                shipment != null && shipmentPackage != null ? toShipmentInfo(shipment, shipmentPackage) : null
        );
    }

    private ItemLookupResponse.SaleInfo toSaleInfo(Sale sale) {
        return new ItemLookupResponse.SaleInfo(
                sale.getId(),
                sale.getCustomer().getId(),
                sale.getCustomer().getName(),
                sale.getCustomerOrderId(),
                sale.getBranch().getId(),
                sale.getBranch().getCode(),
                sale.getSalesChannel().getId(),
                sale.getSalesChannel().getCode(),
                sale.getPrice(),
                sale.getStatus().name(),
                sale.getPaymentStatus().name(),
                sale.getCreatedAt()
        );
    }

    private ItemLookupResponse.ReservationInfo toReservationInfo(Reservation reservation) {
        return new ItemLookupResponse.ReservationInfo(
                reservation.getId(),
                reservation.getCustomer().getId(),
                reservation.getCustomer().getName(),
                reservation.getBranch().getId(),
                reservation.getBranch().getCode(),
                reservation.getLive() != null ? reservation.getLive().getId() : null,
                reservation.getSalesChannel().getId(),
                reservation.getSalesChannel().getCode(),
                reservation.getPrice(),
                reservation.getStatus().name(),
                reservation.getCreatedAt()
        );
    }

    private ItemLookupResponse.PackageInfo toPackageInfo(CustomerPackage customerPackage,
                                                         CustomerPackageItem packageItem) {
        return new ItemLookupResponse.PackageInfo(
                customerPackage.getId(),
                customerPackage.getFolio(),
                customerPackage.getStatus().name(),
                customerPackage.getCustomer().getId(),
                customerPackage.getCustomer().getName(),
                customerPackage.getBranch().getId(),
                customerPackage.getBranch().getCode(),
                packageItem.getId(),
                packageItem.getSaleId(),
                packageItem.getReservationId()
        );
    }

    private ItemLookupResponse.ShipmentInfo toShipmentInfo(Shipment shipment,
                                                           ShipmentPackage shipmentPackage) {
        return new ItemLookupResponse.ShipmentInfo(
                shipment.getId(),
                shipment.getFolio(),
                shipmentPackage.getId(),
                shipment.getStatus().name(),
                shipmentPackage.getStatus().name(),
                shipmentPackage.getPaymentMode().name()
        );
    }

    public ItemResponse create(CreateItemRequest request) {
        CurrentTenantContext tenant = resolveAndValidateBranch(request.getBranchId());
        accessService.assertCan(tenant.getUserId(), PermissionCode.MANAGE_INVENTORY);
        if (repository.existsByCompanyIdAndCode(tenant.getCompanyId(), request.getCode())) {
            throw new IllegalArgumentException("Ya existe un item con código: " + request.getCode());
        }
        if (repository.existsByCompanyIdAndQrCode(tenant.getCompanyId(), request.getQrCode())) {
            throw new IllegalArgumentException("Ya existe un item con QR: " + request.getQrCode());
        }

        Branch branch = branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new IllegalArgumentException("Sucursal no encontrada"));

        Batch batch = null;
        if (request.getBatchId() != null) {
            batch = batchRepository.findById(request.getBatchId())
                    .orElseThrow(() -> new IllegalArgumentException("Lote no encontrado"));
            validateRelatedBranch(batch.getBranch(), tenant.getCompanyId());
        }

        ProductType productType = productTypeRepository.findById(request.getProductTypeId())
                .orElseThrow(() -> new IllegalArgumentException("Tipo de prenda no encontrado"));

        Brand brand = null;
        if (request.getBrandId() != null) {
            brand = brandRepository.findById(request.getBrandId())
                    .orElseThrow(() -> new IllegalArgumentException("Marca no encontrada"));
        }

        Size size = null;
        if (request.getSizeId() != null) {
            size = sizeRepository.findById(request.getSizeId())
                    .orElseThrow(() -> new IllegalArgumentException("Talla no encontrada"));
        }

        StorageLocation storageLocation = null;
        if (request.getStorageLocationId() != null) {
            storageLocation = storageLocationRepository.findById(request.getStorageLocationId())
                    .orElseThrow(() -> new IllegalArgumentException("Ubicación no encontrada"));
        }

        if (storageLocation != null) {
            validateRelatedBranch(storageLocation.getBranch(), tenant.getCompanyId());
        }

        Item entity = new Item();
        entity.setCompany(branch.getCompany());
        entity.setCode(request.getCode());
        entity.setQrCode(request.getQrCode());
        entity.setBranch(branch);
        entity.setBatch(batch);
        entity.setProductType(productType);
        entity.setBrand(brand);
        entity.setSize(size);
        entity.setComments(request.getComments());
        entity.setPrice(request.getPrice());
        entity.setStatus(request.getStatus() == null ? ItemStatus.AVAILABLE : request.getStatus());
        entity.setStorageLocation(storageLocation);
        entity.setCreatedByUserId(request.getCreatedByUserId() == null ? tenant.getUserId() : request.getCreatedByUserId());

        Item saved = saveSafely(entity);
        return toResponse(saved);
    }

    public ItemResponse update(Long id, UpdateItemRequest request) {
        CurrentTenantContext tenant = tenantResolver.resolveCurrent();
        Long companyId = tenant.getCompanyId();
        accessService.assertCan(tenant.getUserId(), PermissionCode.MANAGE_INVENTORY);
        Item existing = findEntityById(id, companyId);
        assertItemBelongsToCurrentTenant(existing);

        if (existing.getStatus() != ItemStatus.AVAILABLE) {
            throw new IllegalArgumentException("Solo se pueden editar items disponibles");
        }

        if (!existing.getCode().equals(request.getCode()) && repository.existsByCompanyIdAndCode(companyId, request.getCode())) {
            throw new IllegalArgumentException("Ya existe un item con código: " + request.getCode());
        }

        if (!existing.getQrCode().equals(request.getQrCode()) && repository.existsByCompanyIdAndQrCode(companyId, request.getQrCode())) {
            throw new IllegalArgumentException("Ya existe un item con QR: " + request.getQrCode());
        }

        ProductType productType = productTypeRepository.findById(request.getProductTypeId())
                .orElseThrow(() -> new IllegalArgumentException("Tipo de prenda no encontrado"));

        Brand brand = null;
        if (request.getBrandId() != null) {
            brand = brandRepository.findById(request.getBrandId())
                    .orElseThrow(() -> new IllegalArgumentException("Marca no encontrada"));
        }

        Size size = null;
        if (request.getSizeId() != null) {
            size = sizeRepository.findById(request.getSizeId())
                    .orElseThrow(() -> new IllegalArgumentException("Talla no encontrada"));
        }

        StorageLocation storageLocation = null;
        if (request.getStorageLocationId() != null) {
            storageLocation = storageLocationRepository.findById(request.getStorageLocationId())
                    .orElseThrow(() -> new IllegalArgumentException("Ubicación no encontrada"));
        }

        if (storageLocation != null) {
            validateRelatedBranch(storageLocation.getBranch(), companyId);
        }

        existing.setCode(request.getCode());
        existing.setQrCode(request.getQrCode());
        existing.setProductType(productType);
        existing.setBrand(brand);
        existing.setSize(size);
        existing.setComments(request.getComments());
        existing.setPrice(request.getPrice());
        existing.setStorageLocation(storageLocation);

        Item saved = saveSafely(existing);
        return toResponse(saved);
    }

    public ItemResponse changeLocation(Long id, Long storageLocationId) {
        CurrentTenantContext tenant = tenantResolver.resolveCurrent();
        Long companyId = tenant.getCompanyId();
        accessService.assertCan(tenant.getUserId(), PermissionCode.MANAGE_INVENTORY);
        Item existing = findEntityById(id, companyId);
        assertItemBelongsToCurrentTenant(existing);

        if (existing.getStatus() != ItemStatus.AVAILABLE) {
            throw new IllegalArgumentException("Solo se pueden editar items disponibles");
        }

        StorageLocation storageLocation = storageLocationRepository.findById(storageLocationId)
                .orElseThrow(() -> new IllegalArgumentException("Ubicación no encontrada"));

        validateRelatedBranch(storageLocation.getBranch(), companyId);
        existing.setStorageLocation(storageLocation);

        Item saved = repository.save(existing);
        return toResponse(saved);
    }

    private Item saveSafely(Item entity) {
        try {
            return repository.save(entity);
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalArgumentException("No se pudo guardar el item por datos duplicados");
        }
    }

    private CurrentTenantContext resolveAndValidateBranch(Long branchId) {
        CurrentTenantContext tenant = tenantResolver.resolveCurrent();
        tenantResolver.assertBranchBelongsToCompany(branchId, tenant.getCompanyId());
        return tenant;
    }

    private void validateRelatedBranch(Branch branch, Long companyId) {
        tenantResolver.assertBranchBelongsToCompany(branch.getId(), companyId);
    }

    private Item findEntityById(Long id, Long companyId) {
        return repository.findByCompanyIdAndId(companyId, id)
                .orElseThrow(() -> new IllegalArgumentException("Item no encontrado con id: " + id));
    }

    private void assertItemBelongsToCurrentTenant(Item item) {
        CurrentTenantContext tenant = tenantResolver.resolveCurrent();
        Long branchId = item.getBranch().getId();
        tenantResolver.assertBranchBelongsToCompany(branchId, tenant.getCompanyId());
        if (tenant.getBranchId() != null && !tenant.getBranchId().equals(branchId)) {
            throw new AccessDeniedException("El item no pertenece a la sucursal activa");
        }
    }

    private ItemResponse toResponse(Item entity) {
        ProductType productType = entity.getProductType();
        Brand brand = entity.getBrand();
        Size size = entity.getSize();
        StorageLocation storageLocation = entity.getStorageLocation();

        return new ItemResponse(
                entity.getId(),
                entity.getCode(),
                entity.getQrCode(),
                entity.getBranch().getId(),
                entity.getBranch().getCode(),
                entity.getBatch() != null ? entity.getBatch().getId() : null,
                entity.getBatch() != null ? entity.getBatch().getFolio() : null,
                productType != null ? productType.getId() : null,
                productType != null ? productType.getCode() : null,
                productType != null ? productType.getName() : null,
                brand != null ? brand.getId() : null,
                brand != null ? brand.getCode() : null,
                brand != null ? brand.getName() : null,
                size != null ? size.getId() : null,
                size != null ? size.getCode() : null,
                size != null ? size.getName() : null,
                entity.getComments(),
                entity.getPrice(),
                entity.getStatus().name(),
                storageLocation != null ? storageLocation.getId() : null,
                storageLocation != null ? storageLocation.getCode() : null,
                storageLocation != null ? storageLocation.getName() : null,
                entity.getCreatedByUserId()
        );
    }

    public static class CreateItemRequest {
        private String code;
        private String qrCode;
        private Long branchId;
        private Long batchId;
        private Long productTypeId;
        private Long brandId;
        private Long sizeId;
        private String comments;
        private java.math.BigDecimal price;
        private ItemStatus status;
        private Long storageLocationId;
        private Long createdByUserId;

        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }
        public String getQrCode() { return qrCode; }
        public void setQrCode(String qrCode) { this.qrCode = qrCode; }
        public Long getBranchId() { return branchId; }
        public void setBranchId(Long branchId) { this.branchId = branchId; }
        public Long getBatchId() { return batchId; }
        public void setBatchId(Long batchId) { this.batchId = batchId; }
        public Long getProductTypeId() { return productTypeId; }
        public void setProductTypeId(Long productTypeId) { this.productTypeId = productTypeId; }
        public Long getBrandId() { return brandId; }
        public void setBrandId(Long brandId) { this.brandId = brandId; }
        public Long getSizeId() { return sizeId; }
        public void setSizeId(Long sizeId) { this.sizeId = sizeId; }
        public String getComments() { return comments; }
        public void setComments(String comments) { this.comments = comments; }
        public java.math.BigDecimal getPrice() { return price; }
        public void setPrice(java.math.BigDecimal price) { this.price = price; }
        public ItemStatus getStatus() { return status; }
        public void setStatus(ItemStatus status) { this.status = status; }
        public Long getStorageLocationId() { return storageLocationId; }
        public void setStorageLocationId(Long storageLocationId) { this.storageLocationId = storageLocationId; }
        public Long getCreatedByUserId() { return createdByUserId; }
        public void setCreatedByUserId(Long createdByUserId) { this.createdByUserId = createdByUserId; }
    }

    public static class UpdateItemRequest {
        private String code;
        private String qrCode;
        private Long productTypeId;
        private Long brandId;
        private Long sizeId;
        private String comments;
        private java.math.BigDecimal price;
        private ItemStatus status;
        private Long storageLocationId;

        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }
        public String getQrCode() { return qrCode; }
        public void setQrCode(String qrCode) { this.qrCode = qrCode; }
        public Long getProductTypeId() { return productTypeId; }
        public void setProductTypeId(Long productTypeId) { this.productTypeId = productTypeId; }
        public Long getBrandId() { return brandId; }
        public void setBrandId(Long brandId) { this.brandId = brandId; }
        public Long getSizeId() { return sizeId; }
        public void setSizeId(Long sizeId) { this.sizeId = sizeId; }
        public String getComments() { return comments; }
        public void setComments(String comments) { this.comments = comments; }
        public java.math.BigDecimal getPrice() { return price; }
        public void setPrice(java.math.BigDecimal price) { this.price = price; }
        public ItemStatus getStatus() { return status; }
        public void setStatus(ItemStatus status) { this.status = status; }
        public Long getStorageLocationId() { return storageLocationId; }
        public void setStorageLocationId(Long storageLocationId) { this.storageLocationId = storageLocationId; }
    }
}
