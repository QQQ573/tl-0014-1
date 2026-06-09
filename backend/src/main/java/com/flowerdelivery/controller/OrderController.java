package com.flowerdelivery.controller;

import com.flowerdelivery.entity.DeliveryOrder;
import com.flowerdelivery.entity.OrderStatusLog;
import com.flowerdelivery.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> createOrder(@RequestBody DeliveryOrder order) {
        DeliveryOrder created = orderService.createOrder(order);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", created);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/tracking/{trackingNo}")
    public ResponseEntity<Map<String, Object>> getOrderByTrackingNo(@PathVariable String trackingNo) {
        DeliveryOrder order = orderService.getOrderByTrackingNo(trackingNo);
        Map<String, Object> result = new HashMap<>();
        if (order != null) {
            result.put("success", true);
            result.put("data", order);
        } else {
            result.put("success", false);
            result.put("message", "运单不存在");
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/orderNo/{orderNo}")
    public ResponseEntity<Map<String, Object>> getOrderByOrderNo(@PathVariable String orderNo) {
        DeliveryOrder order = orderService.getOrderByOrderNo(orderNo);
        Map<String, Object> result = new HashMap<>();
        if (order != null) {
            result.put("success", true);
            result.put("data", order);
        } else {
            result.put("success", false);
            result.put("message", "订单不存在");
        }
        return ResponseEntity.ok(result);
    }

    @PutMapping("/{trackingNo}/status")
    public ResponseEntity<Map<String, Object>> updateStatus(@PathVariable String trackingNo,
                                                             @RequestParam DeliveryOrder.OrderStatus status,
                                                             @RequestParam(required = false, defaultValue = "SYSTEM") String operatorType,
                                                             @RequestParam(required = false) String operatorId,
                                                             @RequestParam(required = false) String remark) {
        DeliveryOrder updated = orderService.updateOrderStatus(trackingNo, status, operatorType, operatorId, remark);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", updated);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{trackingNo}/logs")
    public ResponseEntity<Map<String, Object>> getStatusLogs(@PathVariable String trackingNo) {
        List<OrderStatusLog> logs = orderService.getOrderStatusLogs(trackingNo);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", logs);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/exceptions")
    public ResponseEntity<Map<String, Object>> getExceptionOrders() {
        List<DeliveryOrder> orders = orderService.getExceptionOrders();
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", orders);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/rider/{riderId}")
    public ResponseEntity<Map<String, Object>> getOrdersByRider(@PathVariable String riderId) {
        List<DeliveryOrder> orders = orderService.getOrdersByRider(riderId);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", orders);
        return ResponseEntity.ok(result);
    }

    @PutMapping("/{trackingNo}/assign-rider")
    public ResponseEntity<Map<String, Object>> assignRider(@PathVariable String trackingNo,
                                                            @RequestParam String riderId,
                                                            @RequestParam String riderName) {
        DeliveryOrder updated = orderService.assignRider(trackingNo, riderId, riderName);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", updated);
        return ResponseEntity.ok(result);
    }
}
