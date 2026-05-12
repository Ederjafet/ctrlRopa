package com.hpsqsoft.ctrlropa.transfer;

import com.hpsqsoft.ctrlropa.branch.Branch;
import com.hpsqsoft.ctrlropa.branch.BranchRepository;
import com.hpsqsoft.ctrlropa.item.Item;
import com.hpsqsoft.ctrlropa.item.ItemRepository;
import com.hpsqsoft.ctrlropa.order.CustomerOrder;
import com.hpsqsoft.ctrlropa.order.CustomerOrderRepository;
import com.hpsqsoft.ctrlropa.security.access.AccessService;
import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import com.hpsqsoft.ctrlropa.security.access.PermissionCode;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Year;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@Transactional
public class BranchTransferService {

    private final BranchTransferRepository repository;
    private final BranchTransferItemRepository itemRepository;
    private final BranchRepository branchRepository;
    private final ItemRepository inventoryItemRepository;
    private final CustomerOrderRepository customerOrderRepository;
    private final JdbcTemplate jdbcTemplate;
    private final AccessService accessService;
    private final CurrentUser currentUser;

    public BranchTransferService(BranchTransferRepository repository,
                                 BranchTransferItemRepository itemRepository,
                                 BranchRepository branchRepository,
                                 ItemRepository inventoryItemRepository,
                                 CustomerOrderRepository customerOrderRepository,
                                 JdbcTemplate jdbcTemplate,
                                 AccessService accessService,
                                 CurrentUser currentUser) {
        this.repository = repository;
        this.itemRepository = itemRepository;
        this.branchRepository = branchRepository;
        this.inventoryItemRepository = inventoryItemRepository;
        this.customerOrderRepository = customerOrderRepository;
        this.jdbcTemplate = jdbcTemplate;
        this.accessService = accessService;
        this.currentUser = currentUser;
    }

    public BranchTransferResponse create(CreateBranchTransferRequest request) {
        Long userId = currentUser.getUserId();
        accessService.assertCan(userId, PermissionCode.MANAGE_TRANSFERS);

        Branch fromBranch = branchRepository.findById(request.getFromBranchId())
                .orElseThrow(() -> new IllegalArgumentException("Sucursal origen no encontrada"));

        Branch toBranch = branchRepository.findById(request.getToBranchId())
                .orElseThrow(() -> new IllegalArgumentException("Sucursal destino no encontrada"));

        if (fromBranch.getId().equals(toBranch.getId())) {
            throw new IllegalArgumentException("La sucursal origen y destino no pueden ser la misma");
        }

        CustomerOrder order = null;

        if (request.getCustomerOrderId() != null) {
            order = customerOrderRepository.findById(request.getCustomerOrderId())
                    .orElseThrow(() -> new IllegalArgumentException("Pedido no encontrado"));

            if (!order.getBranch().getId().equals(fromBranch.getId())) {
                throw new IllegalArgumentException("El pedido no pertenece a la sucursal origen");
            }
        }

        List<Long> itemIds = normalizeIds(request.getItemIds());

        if (itemIds.isEmpty()) {
            throw new IllegalArgumentException("Debes agregar al menos un item a la transferencia");
        }

        BranchTransfer transfer = new BranchTransfer();
        transfer.setFolio(generateUniqueFolio());
        transfer.setFromBranch(fromBranch);
        transfer.setToBranch(toBranch);
        transfer.setCustomerOrder(order);
        transfer.setStatus(BranchTransferStatus.OPEN);
        transfer.setNotes(cleanNullable(request.getNotes()));
        transfer.setCreatedByUserId(userId);

        BranchTransfer saved = repository.save(transfer);

        for (Long itemId : itemIds) {
            addItemInternal(saved, itemId);
        }

        return findById(saved.getId());
    }

    @Transactional(readOnly = true)
    public BranchTransferResponse findById(Long id) {
        return toResponse(findEntity(id));
    }

    @Transactional(readOnly = true)
    public BranchTransferResponse findByFolio(String folio) {
        return toResponse(findByFolioEntity(folio));
    }

    @Transactional(readOnly = true)
    public List<BranchTransferResponse> findByBranch(Long branchId) {
        return repository.findByFromBranchIdOrToBranchIdOrderByCreatedAtDesc(branchId, branchId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BranchTransferResponse> findByStatus(BranchTransferStatus status) {
        return repository.findByStatusOrderByCreatedAtDesc(status)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public BranchTransferResponse addItem(Long transferId, Long itemId) {
        Long userId = currentUser.getUserId();
        accessService.assertCan(userId, PermissionCode.MANAGE_TRANSFERS);

        BranchTransfer transfer = findEntity(transferId);

        if (transfer.getStatus() != BranchTransferStatus.OPEN) {
            throw new IllegalArgumentException("Solo se pueden modificar transferencias OPEN");
        }

        addItemInternal(transfer, itemId);

        return findById(transferId);
    }

    public BranchTransferResponse send(Long transferId) {
        Long userId = currentUser.getUserId();
        accessService.assertCan(userId, PermissionCode.SEND_TRANSFERS);

        BranchTransfer transfer = findEntity(transferId);

        if (transfer.getStatus() != BranchTransferStatus.OPEN) {
            throw new IllegalArgumentException("Solo se pueden enviar transferencias OPEN");
        }

        List<BranchTransferItem> items = itemRepository.findByBranchTransferIdOrderByIdAsc(transfer.getId());

        if (items.isEmpty()) {
            throw new IllegalArgumentException("No se puede enviar una transferencia sin items");
        }

        transfer.setStatus(BranchTransferStatus.IN_TRANSIT);
        transfer.setSentAt(LocalDateTime.now());

        return toResponse(repository.save(transfer));
    }

    public BranchTransferResponse receiveItem(Long transferId, ReceiveTransferItemRequest request) {
        Long userId = currentUser.getUserId();
        accessService.assertCan(userId, PermissionCode.RECEIVE_TRANSFERS);

        BranchTransfer transfer = findEntity(transferId);

        if (transfer.getStatus() != BranchTransferStatus.IN_TRANSIT) {
            throw new IllegalArgumentException("Solo se pueden recibir items de transferencias IN_TRANSIT");
        }

        Item item = resolveItem(request);

        BranchTransferItem transferItem = itemRepository
                .findByBranchTransferIdAndItemId(transfer.getId(), item.getId())
                .orElseThrow(() -> new IllegalArgumentException("El item no pertenece a esta transferencia"));

        if (transferItem.getReceivedAt() != null) {
            throw new IllegalArgumentException("El item ya fue recibido");
        }

        transferItem.setReceivedAt(LocalDateTime.now());
        transferItem.setReceivedByUserId(userId);
        itemRepository.save(transferItem);

        item.setBranch(transfer.getToBranch());
        item.setStorageLocation(null);
        inventoryItemRepository.save(item);

        markReceivedIfComplete(transfer);

        return findById(transferId);
    }

    public BranchTransferResponse cancel(Long transferId, CancelBranchTransferRequest request) {
        Long userId = currentUser.getUserId();
        accessService.assertCan(userId, PermissionCode.CANCEL_TRANSFERS);

        BranchTransfer transfer = findEntity(transferId);

        if (transfer.getStatus() != BranchTransferStatus.OPEN) {
            throw new IllegalArgumentException("Solo se pueden cancelar transferencias OPEN");
        }

        String reason = request != null ? cleanNullable(request.getReason()) : null;

        if (reason != null) {
            String currentNotes = transfer.getNotes() == null ? "" : transfer.getNotes() + "\n";
            transfer.setNotes(currentNotes + "CANCELLED: " + reason);
        }

        transfer.setStatus(BranchTransferStatus.CANCELLED);

        return toResponse(repository.save(transfer));
    }

    private void addItemInternal(BranchTransfer transfer, Long itemId) {
        Item item = inventoryItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Item no encontrado con id: " + itemId));

        if (!item.getBranch().getId().equals(transfer.getFromBranch().getId())) {
            throw new IllegalArgumentException("El item " + item.getCode() + " no pertenece a la sucursal origen");
        }

        if (itemRepository.findByBranchTransferIdAndItemId(transfer.getId(), item.getId()).isPresent()) {
            throw new IllegalArgumentException("El item " + item.getCode() + " ya está en esta transferencia");
        }

        if (itemRepository.existsInActiveTransfer(
                item.getId(),
                List.of(BranchTransferStatus.OPEN, BranchTransferStatus.IN_TRANSIT)
        )) {
            throw new IllegalArgumentException("El item " + item.getCode() + " ya está en una transferencia activa");
        }

        if (transfer.getCustomerOrder() != null && !itemBelongsToOrder(item.getId(), transfer.getCustomerOrder().getId())) {
            throw new IllegalArgumentException("El item " + item.getCode() + " no pertenece al pedido indicado");
        }

        BranchTransferItem transferItem = new BranchTransferItem();
        transferItem.setBranchTransfer(transfer);
        transferItem.setItem(item);

        itemRepository.save(transferItem);
    }

    private boolean itemBelongsToOrder(Long itemId, Long orderId) {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM customer_order_items
                WHERE customer_order_id = ?
                  AND item_id = ?
                """,
                Integer.class,
                orderId,
                itemId
        );

        return count != null && count > 0;
    }

    private void markReceivedIfComplete(BranchTransfer transfer) {
        List<BranchTransferItem> items = itemRepository.findByBranchTransferIdOrderByIdAsc(transfer.getId());

        boolean complete = !items.isEmpty() && items.stream().allMatch(item -> item.getReceivedAt() != null);

        if (complete) {
            transfer.setStatus(BranchTransferStatus.RECEIVED);
            transfer.setReceivedAt(LocalDateTime.now());
            repository.save(transfer);
        }
    }

    private Item resolveItem(ReceiveTransferItemRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Datos de item requeridos");
        }

        if (request.getItemId() != null) {
            return inventoryItemRepository.findById(request.getItemId())
                    .orElseThrow(() -> new IllegalArgumentException("Item no encontrado"));
        }

        if (request.getItemCode() != null && !request.getItemCode().isBlank()) {
            return inventoryItemRepository.findByCode(request.getItemCode().trim())
                    .orElseThrow(() -> new IllegalArgumentException("Item no encontrado con código: " + request.getItemCode()));
        }

        if (request.getQrCode() != null && !request.getQrCode().isBlank()) {
            return inventoryItemRepository.findByQrCode(request.getQrCode().trim())
                    .orElseThrow(() -> new IllegalArgumentException("Item no encontrado con QR: " + request.getQrCode()));
        }

        throw new IllegalArgumentException("Debes enviar itemId, itemCode o qrCode");
    }

    private BranchTransfer findEntity(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Transferencia no encontrada con id: " + id));
    }

    private BranchTransfer findByFolioEntity(String folio) {
        return repository.findByFolio(folio)
                .orElseThrow(() -> new IllegalArgumentException("Transferencia no encontrada con folio: " + folio));
    }

    private String generateUniqueFolio() {
        String folio;

        do {
            folio = "TR-" + Year.now().getValue() + "-" +
                    UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        } while (repository.existsByFolio(folio));

        return folio;
    }

    private List<Long> normalizeIds(List<Long> ids) {
        if (ids == null) {
            return List.of();
        }

        Set<Long> normalized = new LinkedHashSet<>();

        for (Long id : ids) {
            if (id != null) {
                normalized.add(id);
            }
        }

        return normalized.stream().toList();
    }

    private String cleanNullable(String value) {
        if (value == null) {
            return null;
        }

        String cleaned = value.trim();
        return cleaned.isBlank() ? null : cleaned;
    }

    private BranchTransferResponse toResponse(BranchTransfer transfer) {
        List<BranchTransferItem> items = itemRepository.findByBranchTransferIdOrderByIdAsc(transfer.getId());

        List<BranchTransferResponse.ItemLine> itemLines = items.stream()
                .map(item -> new BranchTransferResponse.ItemLine(
                        item.getId(),
                        item.getItem().getId(),
                        item.getItem().getCode(),
                        item.getItem().getQrCode(),
                        item.getItem().getStatus().name(),
                        item.getReceivedAt(),
                        item.getReceivedByUserId()
                ))
                .toList();

        int receivedItems = (int) items.stream()
                .filter(item -> item.getReceivedAt() != null)
                .count();

        return new BranchTransferResponse(
                transfer.getId(),
                transfer.getFolio(),
                transfer.getFromBranch().getId(),
                transfer.getFromBranch().getCode(),
                transfer.getFromBranch().getName(),
                transfer.getToBranch().getId(),
                transfer.getToBranch().getCode(),
                transfer.getToBranch().getName(),
                transfer.getCustomerOrder() != null ? transfer.getCustomerOrder().getId() : null,
                transfer.getStatus().name(),
                transfer.getNotes(),
                transfer.getCreatedAt(),
                transfer.getCreatedByUserId(),
                transfer.getSentAt(),
                transfer.getReceivedAt(),
                items.size(),
                receivedItems,
                itemLines
        );
    }
}