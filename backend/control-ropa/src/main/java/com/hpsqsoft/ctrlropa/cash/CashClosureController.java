package com.hpsqsoft.ctrlropa.cash;

import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/cash-closures")
public class CashClosureController {

    private final CashClosureService service;

    public CashClosureController(CashClosureService service) {
        this.service = service;
    }

    @PostMapping
    public CashClosureResponse create(@Valid @RequestBody CreateCashClosureRequest request) {
        return service.create(request);
    }

    @GetMapping("/{id}")
    public CashClosureResponse findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @GetMapping("/branch/{branchId}")
    public List<CashClosureResponse> findByBranch(@PathVariable Long branchId) {
        return service.findByBranch(branchId);
    }

    @GetMapping("/branch/{branchId}/date/{date}")
    public CashClosureResponse findByBranchAndDate(
            @PathVariable Long branchId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return service.findByBranchAndDate(branchId, date);
    }

    @PutMapping("/{id}")
    public CashClosureResponse update(@PathVariable Long id,
                                      @Valid @RequestBody UpdateCashClosureRequest request) {
        return service.update(id, request);
    }

    @PostMapping("/{id}/expenses")
    public CashClosureResponse addExpense(@PathVariable Long id,
                                          @Valid @RequestBody AddCashExpenseRequest request) {
        return service.addExpense(id, request);
    }

    @PatchMapping("/{closureId}/expenses/{expenseId}/cancel")
    public CashClosureResponse cancelExpense(@PathVariable Long closureId,
                                             @PathVariable Long expenseId,
                                             @Valid @RequestBody CancelCashExpenseRequest request) {
        return service.cancelExpense(closureId, expenseId, request);
    }

    @PatchMapping("/{id}/close")
    public CashClosureResponse close(@PathVariable Long id,
                                     @Valid @RequestBody CloseCashClosureRequest request) {
        return service.close(id, request);
    }

    @PatchMapping("/{id}/cancel")
    public CashClosureResponse cancel(@PathVariable Long id,
                                      @Valid @RequestBody CancelCashClosureRequest request) {
        return service.cancel(id, request);
    }
}