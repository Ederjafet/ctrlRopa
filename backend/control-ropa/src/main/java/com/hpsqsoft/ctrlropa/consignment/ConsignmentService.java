package com.hpsqsoft.ctrlropa.consignment;

import com.hpsqsoft.ctrlropa.branch.Branch;
import com.hpsqsoft.ctrlropa.branch.BranchRepository;
import com.hpsqsoft.ctrlropa.catalog.SalesChannel;
import com.hpsqsoft.ctrlropa.catalog.SalesChannelRepository;
import com.hpsqsoft.ctrlropa.common.Status;
import com.hpsqsoft.ctrlropa.customer.Customer;
import com.hpsqsoft.ctrlropa.customer.CustomerRepository;
import com.hpsqsoft.ctrlropa.customer.GenericType;
import com.hpsqsoft.ctrlropa.item.Item;
import com.hpsqsoft.ctrlropa.item.ItemRepository;
import com.hpsqsoft.ctrlropa.item.ItemStatus;
import com.hpsqsoft.ctrlropa.sale.Sale;
import com.hpsqsoft.ctrlropa.sale.SalePaymentStatus;
import com.hpsqsoft.ctrlropa.sale.SaleRepository;
import com.hpsqsoft.ctrlropa.sale.SaleStatus;
import com.hpsqsoft.ctrlropa.security.access.AccessService;
import com.hpsqsoft.ctrlropa.security.access.ChannelCode;
import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import com.hpsqsoft.ctrlropa.security.access.PermissionCode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@Transactional
public class ConsignmentService {

    private final ConsignmentRepository consignmentRepository;
    private final ConsignmentItemRepository consignmentItemRepository;
    private final ConsignmentSettlementRepository settlementRepository;
    private final ConsignmentSettlementItemRepository settlementItemRepository;
    private final ConsigneeRepository consigneeRepository;
    private final BranchRepository branchRepository;
    private final ItemRepository itemRepository;
    private final CustomerRepository customerRepository;
    private final SalesChannelRepository salesChannelRepository;
    private final SaleRepository saleRepository;
    private final AccessService accessService;
    private final CurrentUser currentUser;

    public ConsignmentService(ConsignmentRepository consignmentRepository,
                              ConsignmentItemRepository consignmentItemRepository,
                              ConsignmentSettlementRepository settlementRepository,
                              ConsignmentSettlementItemRepository settlementItemRepository,
                              ConsigneeRepository consigneeRepository,
                              BranchRepository branchRepository,
                              ItemRepository itemRepository,
                              CustomerRepository customerRepository,
                              SalesChannelRepository salesChannelRepository,
                              SaleRepository saleRepository,
                              AccessService accessService,
                              CurrentUser currentUser) {
        this.consignmentRepository = consignmentRepository;
        this.consignmentItemRepository = consignmentItemRepository;
        this.settlementRepository = settlementRepository;
        this.settlementItemRepository = settlementItemRepository;
        this.consigneeRepository = consigneeRepository;
        this.branchRepository = branchRepository;
        this.itemRepository = itemRepository;
        this.customerRepository = customerRepository;
        this.salesChannelRepository = salesChannelRepository;
        this.saleRepository = saleRepository;
        this.accessService = accessService;
        this.currentUser = currentUser;
    }

    public ConsignmentResponse create(CreateConsignmentRequest request) {
        Long userId = currentUser.getUserId();

        accessService.assertCan(
                userId,
                PermissionCode.MANAGE_CONSIGNMENTS,
                ChannelCode.CONSIGNMENT,
                request.getBranchId()
        );

        Branch branch = branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new IllegalArgumentException("Sucursal no encontrada"));

        Consignee consignee = consigneeRepository.findById(request.getConsigneeId())
                .orElseThrow(() -> new IllegalArgumentException("Consignatario no encontrado"));

        if (!consignee.getBranch().getId().equals(branch.getId())) {
            throw new IllegalArgumentException("El consignatario no pertenece a la sucursal indicada");
        }

        if (consignee.getStatus() != Status.ACTIVE) {
            throw new IllegalArgumentException("El consignatario no está activo");
        }

        Consignment consignment = new Consignment();
        consignment.setFolio(generateUniqueFolio());
        consignment.setBranch(branch);
        consignment.setConsignee(consignee);
        consignment.setStatus(ConsignmentStatus.OPEN);
        consignment.setNotes(cleanNullable(request.getNotes()));
        consignment.setCreatedByUserId(userId);

        Consignment saved = consignmentRepository.save(consignment);

        if (request.getItems() != null) {
            for (AddConsignmentItemRequest itemRequest : request.getItems()) {
                addItemInternal(saved, itemRequest);
            }
        }

        return findById(saved.getId());
    }

    @Transactional(readOnly = true)
    public ConsignmentResponse findById(Long id) {
        Consignment consignment = findEntity(id);

        accessService.assertCan(
                currentUser.getUserId(),
                PermissionCode.MANAGE_CONSIGNMENTS,
                ChannelCode.CONSIGNMENT,
                consignment.getBranch().getId()
        );

        return toResponse(consignment);
    }

    @Transactional(readOnly = true)
    public ConsignmentResponse findByFolio(String folio) {
        Consignment consignment = consignmentRepository.findByFolio(folio)
                .orElseThrow(() -> new IllegalArgumentException("Consignación no encontrada con folio: " + folio));

        accessService.assertCan(
                currentUser.getUserId(),
                PermissionCode.MANAGE_CONSIGNMENTS,
                ChannelCode.CONSIGNMENT,
                consignment.getBranch().getId()
        );

        return toResponse(consignment);
    }

    @Transactional(readOnly = true)
    public List<ConsignmentResponse> findByBranch(Long branchId) {
        accessService.assertCan(
                currentUser.getUserId(),
                PermissionCode.MANAGE_CONSIGNMENTS,
                ChannelCode.CONSIGNMENT,
                branchId
        );

        return consignmentRepository.findByBranchIdOrderByCreatedAtDesc(branchId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ConsignmentResponse> findByStatus(ConsignmentStatus status) {
        accessService.assertCan(currentUser.getUserId(), PermissionCode.MANAGE_CONSIGNMENTS);

        return consignmentRepository.findByStatusOrderByCreatedAtDesc(status)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public ConsignmentResponse addItem(Long consignmentId, AddConsignmentItemRequest request) {
        Consignment consignment = findEntity(consignmentId);

        accessService.assertCan(
                currentUser.getUserId(),
                PermissionCode.MANAGE_CONSIGNMENTS,
                ChannelCode.CONSIGNMENT,
                consignment.getBranch().getId()
        );

        if (consignment.getStatus() != ConsignmentStatus.OPEN) {
            throw new IllegalArgumentException("Solo se pueden agregar items a consignaciones OPEN");
        }

        addItemInternal(consignment, request);

        return findById(consignmentId);
    }

    public ConsignmentResponse deliver(Long consignmentId) {
        Consignment consignment = findEntity(consignmentId);

        accessService.assertCan(
                currentUser.getUserId(),
                PermissionCode.MANAGE_CONSIGNMENTS,
                ChannelCode.CONSIGNMENT,
                consignment.getBranch().getId()
        );

        if (consignment.getStatus() != ConsignmentStatus.OPEN) {
            throw new IllegalArgumentException("Solo se pueden entregar consignaciones OPEN");
        }

        List<ConsignmentItem> items = consignmentItemRepository.findByConsignmentIdOrderByCreatedAtAsc(consignment.getId());

        if (items.isEmpty()) {
            throw new IllegalArgumentException("No se puede entregar una consignación sin items");
        }

        consignment.setStatus(ConsignmentStatus.DELIVERED);
        consignment.setDeliveredAt(LocalDateTime.now());

        return toResponse(consignmentRepository.save(consignment));
    }

    public ConsignmentResponse settle(Long consignmentId, CreateConsignmentSettlementRequest request) {
        Consignment consignment = findEntity(consignmentId);
        Long userId = currentUser.getUserId();

        accessService.assertCan(
                userId,
                PermissionCode.SETTLE_CONSIGNMENTS,
                ChannelCode.CONSIGNMENT,
                consignment.getBranch().getId()
        );

        if (consignment.getStatus() != ConsignmentStatus.DELIVERED
                && consignment.getStatus() != ConsignmentStatus.IN_SETTLEMENT) {
            throw new IllegalArgumentException("Solo se pueden liquidar consignaciones DELIVERED o IN_SETTLEMENT");
        }

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("Debes enviar al menos un item para liquidar");
        }

        ConsignmentSettlement settlement = new ConsignmentSettlement();
        settlement.setConsignment(consignment);
        settlement.setNotes(cleanNullable(request.getNotes()));
        settlement.setCreatedByUserId(userId);

        ConsignmentSettlement savedSettlement = settlementRepository.save(settlement);

        for (CreateConsignmentSettlementRequest.SettlementItemRequest itemRequest : request.getItems()) {
            settleItem(consignment, savedSettlement, itemRequest, userId);
        }

        refreshConsignmentStatus(consignment);

        return findById(consignmentId);
    }

    public ConsignmentResponse cancel(Long consignmentId, CancelConsignmentRequest request) {
        Long userId = currentUser.getUserId();

        Consignment consignment = findEntity(consignmentId);

        accessService.assertCan(
                userId,
                PermissionCode.CANCEL_CONSIGNMENTS,
                ChannelCode.CONSIGNMENT,
                consignment.getBranch().getId()
        );

        if (consignment.getStatus() == ConsignmentStatus.CANCELLED) {
            throw new IllegalArgumentException("La consignación ya está cancelada");
        }

        if (consignment.getStatus() == ConsignmentStatus.CLOSED) {
            throw new IllegalArgumentException("No se puede cancelar una consignación cerrada");
        }

        String reason = request != null ? cleanNullable(request.getReason()) : null;

        List<ConsignmentItem> items = consignmentItemRepository
                .findByConsignmentIdOrderByCreatedAtAsc(consignment.getId());

        for (ConsignmentItem consignmentItem : items) {
            if (consignmentItem.getStatus() == ConsignmentItemStatus.OUT_ON_CONSIGNMENT) {
                consignmentItem.setStatus(ConsignmentItemStatus.RETURNED);
                consignmentItemRepository.save(consignmentItem);

                Item item = consignmentItem.getItem();
                item.setStatus(ItemStatus.AVAILABLE);
                itemRepository.save(item);
            }
        }

        if (reason != null) {
            String currentNotes = consignment.getNotes() == null ? "" : consignment.getNotes() + "\n";
            consignment.setNotes(currentNotes + "CANCELLED: " + reason);
        }

        consignment.setStatus(ConsignmentStatus.CANCELLED);
        consignment.setCancelledAt(LocalDateTime.now());
        consignment.setCancelledByUserId(userId);
        consignment.setCancelReason(reason);

        return toResponse(consignmentRepository.save(consignment));
    }

    private void addItemInternal(Consignment consignment, AddConsignmentItemRequest request) {
        Item item = resolveItem(request);

        if (!item.getBranch().getId().equals(consignment.getBranch().getId())) {
            throw new IllegalArgumentException("El item no pertenece a la sucursal de la consignación");
        }

        if (item.getStatus() != ItemStatus.AVAILABLE) {
            throw new IllegalArgumentException("Solo se pueden consignar items AVAILABLE");
        }

        if (consignmentItemRepository.existsActiveByItemId(item.getId())) {
            throw new IllegalArgumentException("El item ya está en una consignación activa");
        }

        if (consignmentItemRepository.findByConsignmentIdAndItemId(consignment.getId(), item.getId()).isPresent()) {
            throw new IllegalArgumentException("El item ya está en esta consignación");
        }

        ConsignmentItem consignmentItem = new ConsignmentItem();
        consignmentItem.setConsignment(consignment);
        consignmentItem.setItem(item);
        consignmentItem.setSuggestedPrice(request.getSuggestedPrice());
        consignmentItem.setNotes(cleanNullable(request.getNotes()));
        consignmentItem.setStatus(ConsignmentItemStatus.OUT_ON_CONSIGNMENT);

        consignmentItemRepository.save(consignmentItem);

        item.setStatus(ItemStatus.ON_CONSIGNMENT);
        item.setStorageLocation(null);
        itemRepository.save(item);
    }

    private void settleItem(Consignment consignment,
                            ConsignmentSettlement settlement,
                            CreateConsignmentSettlementRequest.SettlementItemRequest request,
                            Long userId) {
        if (request.getConsignmentItemId() == null) {
            throw new IllegalArgumentException("consignmentItemId es obligatorio");
        }

        if (request.getResult() == null) {
            throw new IllegalArgumentException("result es obligatorio");
        }

        ConsignmentItem consignmentItem = consignmentItemRepository.findById(request.getConsignmentItemId())
                .orElseThrow(() -> new IllegalArgumentException("Item de consignación no encontrado"));

        if (!consignmentItem.getConsignment().getId().equals(consignment.getId())) {
            throw new IllegalArgumentException("El item no pertenece a esta consignación");
        }

        if (consignmentItem.getStatus() != ConsignmentItemStatus.OUT_ON_CONSIGNMENT) {
            throw new IllegalArgumentException("El item ya fue liquidado");
        }

        ConsignmentSettlementItem settlementItem = new ConsignmentSettlementItem();
        settlementItem.setConsignmentSettlement(settlement);
        settlementItem.setConsignmentItem(consignmentItem);
        settlementItem.setResult(request.getResult());
        settlementItem.setNotes(cleanNullable(request.getNotes()));

        if (request.getResult() == ConsignmentSettlementResult.SOLD) {
            handleSold(consignment, consignmentItem, settlementItem, request, userId);
        } else if (request.getResult() == ConsignmentSettlementResult.RETURNED) {
            handleReturned(consignmentItem);
        } else {
            throw new IllegalArgumentException("Resultado de liquidación no soportado");
        }

        settlementItemRepository.save(settlementItem);
    }

    private void handleSold(Consignment consignment,
                            ConsignmentItem consignmentItem,
                            ConsignmentSettlementItem settlementItem,
                            CreateConsignmentSettlementRequest.SettlementItemRequest request,
                            Long userId) {
        BigDecimal salePrice = request.getSalePrice();

        if (salePrice == null || salePrice.signum() <= 0) {
            throw new IllegalArgumentException("salePrice debe ser mayor a 0 para SOLD");
        }

        Customer customer = resolveCustomerForSale(consignment.getBranch().getId(), request.getCustomerId());
        SalesChannel salesChannel = salesChannelRepository.findByCode(ChannelCode.CONSIGNMENT)
                .orElseThrow(() -> new IllegalArgumentException("Canal CONSIGNMENT no encontrado"));

        Item item = consignmentItem.getItem();

        if (saleRepository.existsByItemIdAndStatus(item.getId(), SaleStatus.ACTIVE)) {
            throw new IllegalArgumentException("El item ya tiene una venta activa");
        }

        Sale sale = new Sale();
        sale.setItem(item);
        sale.setCustomer(customer);
        sale.setBranch(consignment.getBranch());
        sale.setSellerUserId(userId);
        sale.setCustomerOrderId(null);
        sale.setSalesChannel(salesChannel);
        sale.setPrice(salePrice);
        sale.setStatus(SaleStatus.ACTIVE);
        sale.setPaymentStatus(SalePaymentStatus.UNPAID);
        sale.setCreatedByUserId(userId);

        saleRepository.save(sale);

        consignmentItem.setStatus(ConsignmentItemStatus.SOLD);

        item.setPrice(salePrice);
        item.setStatus(ItemStatus.SOLD);
        itemRepository.save(item);

        settlementItem.setSalePrice(salePrice);
        settlementItem.setCustomer(customer);
    }

    private void handleReturned(ConsignmentItem consignmentItem) {
        consignmentItem.setStatus(ConsignmentItemStatus.RETURNED);

        Item item = consignmentItem.getItem();
        item.setStatus(ItemStatus.AVAILABLE);
        itemRepository.save(item);
    }

    private Customer resolveCustomerForSale(Long branchId, Long customerId) {
        if (customerId != null) {
            Customer customer = customerRepository.findById(customerId)
                    .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado"));

            if (!customer.getBranch().getId().equals(branchId)) {
                throw new IllegalArgumentException("El cliente no pertenece a la sucursal de la consignación");
            }

            if (customer.getStatus() != Status.ACTIVE) {
                throw new IllegalArgumentException("El cliente no está activo");
            }

            return customer;
        }

        return customerRepository.findByBranchIdAndIsGenericTrueAndGenericType(branchId, GenericType.CONSIGNMENT)
                .orElseThrow(() -> new IllegalArgumentException("No existe cliente genérico de consignación para la sucursal"));
    }

    private void refreshConsignmentStatus(Consignment consignment) {
        List<ConsignmentItem> items = consignmentItemRepository.findByConsignmentIdOrderByCreatedAtAsc(consignment.getId());

        long openItems = items.stream()
                .filter(item -> item.getStatus() == ConsignmentItemStatus.OUT_ON_CONSIGNMENT)
                .count();

        if (openItems == 0) {
            consignment.setStatus(ConsignmentStatus.CLOSED);
            consignment.setClosedAt(LocalDateTime.now());
        } else {
            consignment.setStatus(ConsignmentStatus.IN_SETTLEMENT);
        }

        consignmentRepository.save(consignment);
    }

    private Item resolveItem(AddConsignmentItemRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Datos de item requeridos");
        }

        if (request.getItemId() != null) {
            return itemRepository.findById(request.getItemId())
                    .orElseThrow(() -> new IllegalArgumentException("Item no encontrado"));
        }

        if (request.getItemCode() != null && !request.getItemCode().isBlank()) {
            return itemRepository.findByCode(request.getItemCode().trim())
                    .orElseThrow(() -> new IllegalArgumentException("Item no encontrado con código: " + request.getItemCode()));
        }

        if (request.getQrCode() != null && !request.getQrCode().isBlank()) {
            return itemRepository.findByQrCode(request.getQrCode().trim())
                    .orElseThrow(() -> new IllegalArgumentException("Item no encontrado con QR: " + request.getQrCode()));
        }

        throw new IllegalArgumentException("Debes enviar itemId, itemCode o qrCode");
    }

    private Consignment findEntity(Long id) {
        return consignmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Consignación no encontrada con id: " + id));
    }

    private String generateUniqueFolio() {
        String folio;

        do {
            folio = "CN-" + Year.now().getValue() + "-" +
                    UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        } while (consignmentRepository.existsByFolio(folio));

        return folio;
    }

    private String cleanNullable(String value) {
        if (value == null) {
            return null;
        }

        String cleaned = value.trim();
        return cleaned.isBlank() ? null : cleaned;
    }

    private ConsignmentResponse toResponse(Consignment consignment) {
        List<ConsignmentItem> items = consignmentItemRepository.findByConsignmentIdOrderByCreatedAtAsc(consignment.getId());

        List<ConsignmentResponse.ItemLine> itemLines = items.stream()
                .map(item -> new ConsignmentResponse.ItemLine(
                        item.getId(),
                        item.getItem().getId(),
                        item.getItem().getCode(),
                        item.getItem().getQrCode(),
                        item.getItem().getStatus().name(),
                        item.getSuggestedPrice(),
                        item.getStatus().name(),
                        item.getNotes(),
                        item.getCreatedAt()
                ))
                .toList();

        int soldItems = (int) items.stream()
                .filter(item -> item.getStatus() == ConsignmentItemStatus.SOLD)
                .count();

        int returnedItems = (int) items.stream()
                .filter(item -> item.getStatus() == ConsignmentItemStatus.RETURNED)
                .count();

        int openItems = (int) items.stream()
                .filter(item -> item.getStatus() == ConsignmentItemStatus.OUT_ON_CONSIGNMENT)
                .count();

        List<ConsignmentResponse.SettlementLine> settlementLines =
                settlementRepository.findByConsignmentIdOrderByCreatedAtDesc(consignment.getId())
                        .stream()
                        .map(settlement -> {
                            List<ConsignmentResponse.SettlementItemLine> settlementItems =
                                    settlementItemRepository.findByConsignmentSettlementIdOrderByCreatedAtAsc(settlement.getId())
                                            .stream()
                                            .map(item -> new ConsignmentResponse.SettlementItemLine(
                                                    item.getId(),
                                                    item.getConsignmentItem().getId(),
                                                    item.getResult().name(),
                                                    item.getSalePrice(),
                                                    item.getCustomer() != null ? item.getCustomer().getId() : null,
                                                    item.getCustomer() != null ? item.getCustomer().getName() : null,
                                                    item.getNotes(),
                                                    item.getCreatedAt()
                                            ))
                                            .toList();

                            return new ConsignmentResponse.SettlementLine(
                                    settlement.getId(),
                                    settlement.getNotes(),
                                    settlement.getCreatedAt(),
                                    settlement.getCreatedByUserId(),
                                    settlementItems
                            );
                        })
                        .toList();

        return new ConsignmentResponse(
                consignment.getId(),
                consignment.getFolio(),
                consignment.getBranch().getId(),
                consignment.getBranch().getCode(),
                consignment.getBranch().getName(),
                consignment.getConsignee().getId(),
                consignment.getConsignee().getName(),
                consignment.getStatus().name(),
                consignment.getNotes(),
                consignment.getCreatedAt(),
                consignment.getCreatedByUserId(),
                consignment.getDeliveredAt(),
                consignment.getClosedAt(),
                consignment.getCancelledAt(),
                consignment.getCancelledByUserId(),
                consignment.getCancelReason(),
                items.size(),
                soldItems,
                returnedItems,
                openItems,
                itemLines,
                settlementLines
        );
    }
}