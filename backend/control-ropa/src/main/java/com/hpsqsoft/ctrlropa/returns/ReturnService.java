package com.hpsqsoft.ctrlropa.returns;

import com.hpsqsoft.ctrlropa.item.Item;
import com.hpsqsoft.ctrlropa.item.ItemRepository;
import com.hpsqsoft.ctrlropa.item.ItemStatus;
import com.hpsqsoft.ctrlropa.sale.Sale;
import com.hpsqsoft.ctrlropa.sale.SaleRepository;
import com.hpsqsoft.ctrlropa.sale.SaleStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class ReturnService {

    private final CustomerReturnRepository returnRepository;
    private final ReturnItemRepository returnItemRepository;
    private final SaleRepository saleRepository;
    private final ItemRepository itemRepository;

    public ReturnService(CustomerReturnRepository returnRepository,
                         ReturnItemRepository returnItemRepository,
                         SaleRepository saleRepository,
                         ItemRepository itemRepository) {
        this.returnRepository = returnRepository;
        this.returnItemRepository = returnItemRepository;
        this.saleRepository = saleRepository;
        this.itemRepository = itemRepository;
    }

    public ReturnResponse create(CreateReturnRequest request) {
        Sale sale = saleRepository.findById(request.getSaleId())
                .orElseThrow(() -> new IllegalArgumentException("Venta no encontrada"));

        if (sale.getStatus() != SaleStatus.ACTIVE) {
            throw new IllegalArgumentException("Solo se puede crear devolución sobre una venta activa");
        }
        
        if (returnRepository.existsBySaleIdAndStatus(sale.getId(), ReturnStatus.OPEN)) {
            throw new IllegalArgumentException("El item ya tiene una devolución OPEN");
        }

        Long itemId = sale.getItem().getId();
        if (returnItemRepository.existsOpenReturnForItem(itemId)) {
            throw new IllegalArgumentException("El item ya tiene una devolución OPEN");
        }

        CustomerReturn entity = new CustomerReturn();
        entity.setSale(sale);
        entity.setType(request.getType());
        entity.setReason(request.getReason());
        entity.setNotes(request.getNotes());
        entity.setStatus(ReturnStatus.OPEN);
        entity.setCreatedByUserId(request.getCreatedByUserId());

        return toResponse(returnRepository.save(entity));
    }

    public ReturnResponse addItem(Long returnId, AddReturnItemRequest request) {
        CustomerReturn customerReturn = findEntity(returnId);

        if (customerReturn.getStatus() != ReturnStatus.OPEN) {
            throw new IllegalArgumentException("Solo se pueden agregar items a devoluciones OPEN");
        }

        Item item = itemRepository.findById(request.getItemId())
                .orElseThrow(() -> new IllegalArgumentException("Item no encontrado"));

        Sale sale = customerReturn.getSale();

        if (!sale.getItem().getId().equals(item.getId())) {
            throw new IllegalArgumentException("El item no pertenece a la venta del return");
        }
        
        if (returnItemRepository.existsByCustomerReturnIdAndItemId(customerReturn.getId(), item.getId())) {
            throw new IllegalArgumentException("El item ya fue agregado a esta devolución");
        }

        if (returnItemRepository.existsOpenReturnForItemExcludingReturn(item.getId(), customerReturn.getId())) {
            throw new IllegalArgumentException("El item ya tiene una devolución OPEN");
        }

        ReturnItem returnItem = new ReturnItem();
        returnItem.setCustomerReturn(customerReturn);
        returnItem.setItem(item);
        returnItem.setCondition(request.getCondition());

        returnItemRepository.save(returnItem);

        return toResponse(customerReturn);
    }

    public ReturnResponse process(Long returnId, ProcessReturnRequest request) {
        CustomerReturn customerReturn = findEntity(returnId);

        if (customerReturn.getStatus() != ReturnStatus.OPEN) {
            throw new IllegalArgumentException("Solo se pueden procesar devoluciones OPEN");
        }

        List<ReturnItem> items = returnItemRepository.findByCustomerReturnIdOrderByCreatedAtAsc(returnId);

        if (items.isEmpty()) {
            throw new IllegalArgumentException("No se puede procesar una devolución sin retorno físico del item");
        }

        for (ReturnItem returnItem : items) {
            Item item = returnItem.getItem();

            if (returnItem.getCondition() == ReturnItemCondition.GOOD) {
                item.setStatus(ItemStatus.AVAILABLE);
            } else {
                item.setStatus(ItemStatus.DISABLED);
            }

            itemRepository.save(item);
        }

        customerReturn.setStatus(ReturnStatus.PROCESSED);
        customerReturn.setProcessedAt(LocalDateTime.now());
        customerReturn.setProcessedByUserId(request.getProcessedByUserId());

        return toResponse(returnRepository.save(customerReturn));
    }

    public ReturnResponse cancel(Long returnId, CancelReturnRequest request) {
        CustomerReturn customerReturn = findEntity(returnId);

        if (customerReturn.getStatus() != ReturnStatus.OPEN) {
            throw new IllegalArgumentException("Solo se pueden cancelar devoluciones OPEN");
        }

        customerReturn.setStatus(ReturnStatus.CANCELLED);
        customerReturn.setCancelledAt(LocalDateTime.now());
        customerReturn.setCancelledByUserId(request.getCancelledByUserId());
        customerReturn.setCancelReason(request.getReason());

        return toResponse(returnRepository.save(customerReturn));
    }

    @Transactional(readOnly = true)
    public ReturnResponse findById(Long id) {
        return toResponse(findEntity(id));
    }

    @Transactional(readOnly = true)
    public List<ReturnResponse> findBySale(Long saleId) {
        return returnRepository.findBySaleIdOrderByCreatedAtDesc(saleId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReturnResponse> findByStatus(ReturnStatus status) {
        return returnRepository.findByStatusOrderByCreatedAtDesc(status)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private CustomerReturn findEntity(Long id) {
        return returnRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Devolución no encontrada con id: " + id));
    }

    private ReturnResponse toResponse(CustomerReturn entity) {
        List<ReturnResponse.ItemLine> items = returnItemRepository
                .findByCustomerReturnIdOrderByCreatedAtAsc(entity.getId())
                .stream()
                .map(this::toItemLine)
                .toList();

        Sale sale = entity.getSale();

        return new ReturnResponse(
                entity.getId(),
                sale.getId(),
                sale.getCustomer().getId(),
                sale.getCustomer().getName(),
                sale.getItem().getId(),
                sale.getItem().getCode(),
                entity.getType().name(),
                entity.getReason(),
                entity.getStatus().name(),
                entity.getProcessedByUserId(),
                entity.getCreatedByUserId(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getProcessedAt(),
                entity.getCancelledAt(),
                entity.getCancelledByUserId(),
                entity.getCancelReason(),
                entity.getNotes(),
                items
        );
    }

    private ReturnResponse.ItemLine toItemLine(ReturnItem item) {
        return new ReturnResponse.ItemLine(
                item.getId(),
                item.getItem().getId(),
                item.getItem().getCode(),
                item.getCondition().name(),
                item.getCreatedAt()
        );
    }
    
    public ReturnResponse createByItemCode(String itemCode, CreateReturnByItemRequest request) {
        Item item = itemRepository.findByCode(itemCode)
                .orElseThrow(() -> new IllegalArgumentException("Item no encontrado con código: " + itemCode));

        return createByResolvedItem(item, request);
    }

    public ReturnResponse createByQrCode(String qrCode, CreateReturnByItemRequest request) {
        Item item = itemRepository.findByQrCode(qrCode)
                .orElseThrow(() -> new IllegalArgumentException("Item no encontrado con QR: " + qrCode));

        return createByResolvedItem(item, request);
    }

    private ReturnResponse createByResolvedItem(Item item, CreateReturnByItemRequest request) {
        Sale sale = saleRepository.findByItemIdAndStatus(item.getId(), SaleStatus.ACTIVE)
                .orElseThrow(() -> new IllegalArgumentException("No existe venta activa para este item"));

        if (returnRepository.existsBySaleIdAndStatus(sale.getId(), ReturnStatus.OPEN)) {
            throw new IllegalArgumentException("El item ya tiene una devolución OPEN");
        }

        if (returnItemRepository.existsOpenReturnForItem(item.getId())) {
            throw new IllegalArgumentException("El item ya tiene una devolución OPEN");
        }

        CustomerReturn entity = new CustomerReturn();
        entity.setSale(sale);
        entity.setType(request.getType());
        entity.setReason(request.getReason());
        entity.setNotes(request.getNotes());
        entity.setStatus(ReturnStatus.OPEN);
        entity.setCreatedByUserId(request.getCreatedByUserId());

        CustomerReturn saved = returnRepository.save(entity);

        ReturnItem returnItem = new ReturnItem();
        returnItem.setCustomerReturn(saved);
        returnItem.setItem(item);
        returnItem.setCondition(request.getCondition());

        returnItemRepository.save(returnItem);

        return toResponse(saved);
    }
}