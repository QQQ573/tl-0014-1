package com.flowerdelivery.controller;

import com.flowerdelivery.entity.ExceptionOrder;
import com.flowerdelivery.service.ExceptionOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/exceptions")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ExceptionController {

    private final ExceptionOrderService exceptionOrderService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> createException(@RequestBody Map<String, Object> request) {
        String trackingNo = (String) request.get("trackingNo");
        ExceptionOrder.ExceptionType type = ExceptionOrder.ExceptionType.valueOf((String) request.get("exceptionType"));
        String description = (String) request.get("description");
        String damageLevel = (String) request.get("damageLevel");
        String newAddress = (String) request.get("newAddress");
        Double newLatitude = request.get("newLatitude") != null ? ((Number) request.get("newLatitude")).doubleValue() : null;
        Double newLongitude = request.get("newLongitude") != null ? ((Number) request.get("newLongitude")).doubleValue() : null;
        String sensitiveWordHit = (String) request.get("sensitiveWordHit");

        ExceptionOrder exception = exceptionOrderService.createExceptionOrder(
                trackingNo, type, description, damageLevel,
                newAddress, newLatitude, newLongitude, sensitiveWordHit
        );

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", exception);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/pending")
    public ResponseEntity<Map<String, Object>> getPendingExceptions() {
        List<ExceptionOrder> exceptions = exceptionOrderService.getPendingExceptions();
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", exceptions);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<Map<String, Object>> getExceptionsByStatus(@PathVariable String status) {
        List<ExceptionOrder> exceptions = exceptionOrderService.getExceptionsByStatus(
                ExceptionOrder.ExceptionStatus.valueOf(status.toUpperCase())
        );
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", exceptions);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getExceptionById(@PathVariable Long id) {
        ExceptionOrder exception = exceptionOrderService.getExceptionById(id);
        Map<String, Object> result = new HashMap<>();
        if (exception != null) {
            result.put("success", true);
            result.put("data", exception);
        } else {
            result.put("success", false);
            result.put("message", "异常工单不存在");
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{id}/review")
    public ResponseEntity<Map<String, Object>> reviewException(@PathVariable Long id,
                                                                @RequestBody Map<String, Object> request) {
        String reviewerId = (String) request.get("reviewerId");
        String reviewerName = (String) request.get("reviewerName");
        boolean approved = (Boolean) request.get("approved");
        String reviewComment = (String) request.get("reviewComment");
        ExceptionOrder.ResolutionType resolutionType = request.get("resolutionType") != null
                ? ExceptionOrder.ResolutionType.valueOf((String) request.get("resolutionType"))
                : null;
        BigDecimal refundAmount = request.get("refundAmount") != null
                ? new BigDecimal(request.get("refundAmount").toString())
                : null;

        ExceptionOrder exception = exceptionOrderService.reviewException(
                id, reviewerId, reviewerName, approved, reviewComment, resolutionType, refundAmount
        );

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", exception);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/tracking/{trackingNo}")
    public ResponseEntity<Map<String, Object>> getExceptionsByTrackingNo(@PathVariable String trackingNo) {
        List<ExceptionOrder> exceptions = exceptionOrderService.getExceptionsByTrackingNo(trackingNo);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", exceptions);
        return ResponseEntity.ok(result);
    }
}
