package com.flowerdelivery.service;

import com.flowerdelivery.entity.DeliveryOrder;
import com.flowerdelivery.entity.OrderStatusLog;
import com.flowerdelivery.repository.DeliveryOrderRepository;
import com.flowerdelivery.repository.OrderStatusLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final DeliveryOrderRepository orderRepository;
    private final OrderStatusLogRepository statusLogRepository;
    private final SensitiveWordService sensitiveWordService;
    private final StringRedisTemplate redisTemplate;

    private static final String ORDER_CACHE_PREFIX = "flower:order:";
    private static final String TRACKING_NO_PREFIX = "FD";

    @Transactional
    public DeliveryOrder createOrder(DeliveryOrder order) {
        String orderNo = generateOrderNo();
        String trackingNo = generateTrackingNo();

        order.setOrderNo(orderNo);
        order.setTrackingNo(trackingNo);
        order.setStatus(DeliveryOrder.OrderStatus.PENDING);
        order.setIsException(false);

        if (order.getCardMessage() != null && !order.getCardMessage().isEmpty()) {
            List<String> hitWords = sensitiveWordService.checkSensitiveWords(order.getCardMessage());
            if (!hitWords.isEmpty()) {
                order.setIsException(true);
                order.setExceptionType("SENSITIVE_WORD");
                log.info("订单 {} 贺卡留言命中敏感词: {}", trackingNo, hitWords);
            }
        }

        DeliveryOrder saved = orderRepository.save(order);
        saveStatusLog(saved.getTrackingNo(), null, DeliveryOrder.OrderStatus.PENDING, "SYSTEM", "order_create", "订单创建");

        redisTemplate.opsForValue().set(ORDER_CACHE_PREFIX + trackingNo, saved.getStatus().name());
        redisTemplate.opsForValue().set(ORDER_CACHE_PREFIX + "no:" + orderNo, trackingNo);

        log.info("订单创建成功, 运单号: {}, 订单号: {}", trackingNo, orderNo);
        return saved;
    }

    public DeliveryOrder getOrderByTrackingNo(String trackingNo) {
        return orderRepository.findByTrackingNo(trackingNo).orElse(null);
    }

    public DeliveryOrder getOrderByOrderNo(String orderNo) {
        return orderRepository.findByOrderNo(orderNo).orElse(null);
    }

    @Transactional
    public DeliveryOrder updateOrderStatus(String trackingNo, DeliveryOrder.OrderStatus newStatus,
                                           String operatorType, String operatorId, String remark) {
        DeliveryOrder order = orderRepository.findByTrackingNo(trackingNo)
                .orElseThrow(() -> new RuntimeException("运单不存在: " + trackingNo));

        DeliveryOrder.OrderStatus oldStatus = order.getStatus();

        if (oldStatus == newStatus) {
            return order;
        }

        order.setStatus(newStatus);
        updateStatusTime(order, newStatus);

        DeliveryOrder saved = orderRepository.save(order);
        saveStatusLog(trackingNo, oldStatus, newStatus, operatorType, operatorId, remark);

        redisTemplate.opsForValue().set(ORDER_CACHE_PREFIX + trackingNo, newStatus.name());

        log.info("运单 {} 状态变更: {} -> {}", trackingNo, oldStatus, newStatus);
        return saved;
    }

    private void updateStatusTime(DeliveryOrder order, DeliveryOrder.OrderStatus status) {
        LocalDateTime now = LocalDateTime.now();
        switch (status) {
            case OUTBOUND:
                order.setOutboundTime(now);
                break;
            case LOADED:
                order.setLoadedTime(now);
                break;
            case DELIVERING:
                order.setDeliveringTime(now);
                break;
            case DELIVERED:
                order.setDeliveredTime(now);
                break;
            default:
                break;
        }
    }

    private void saveStatusLog(String trackingNo, DeliveryOrder.OrderStatus fromStatus,
                               DeliveryOrder.OrderStatus toStatus, String operatorType,
                               String operatorId, String remark) {
        OrderStatusLog log = new OrderStatusLog();
        log.setTrackingNo(trackingNo);
        log.setFromStatus(fromStatus);
        log.setToStatus(toStatus);
        log.setOperatorType(operatorType);
        log.setOperatorId(operatorId);
        log.setRemark(remark);
        statusLogRepository.save(log);
    }

    public List<OrderStatusLog> getOrderStatusLogs(String trackingNo) {
        return statusLogRepository.findByTrackingNoOrderByCreateTimeAsc(trackingNo);
    }

    public List<DeliveryOrder> getExceptionOrders() {
        return orderRepository.findExceptionOrders();
    }

    public List<DeliveryOrder> getOrdersByRider(String riderId) {
        return orderRepository.findByRiderId(riderId);
    }

    @Transactional
    public DeliveryOrder assignRider(String trackingNo, String riderId, String riderName) {
        DeliveryOrder order = orderRepository.findByTrackingNo(trackingNo)
                .orElseThrow(() -> new RuntimeException("运单不存在: " + trackingNo));
        order.setRiderId(riderId);
        order.setRiderName(riderName);
        return orderRepository.save(order);
    }

    private String generateOrderNo() {
        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String uuid = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        return "ORD" + dateStr + uuid;
    }

    private String generateTrackingNo() {
        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMdd"));
        String uuid = UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase();
        return TRACKING_NO_PREFIX + dateStr + uuid;
    }
}
