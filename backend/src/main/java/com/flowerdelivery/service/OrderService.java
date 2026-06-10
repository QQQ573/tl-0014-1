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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
    private static final String SIGN_CODE_PREFIX = "flower:sign:";
    private static final String SIGN_FAIL_PREFIX = "flower:sign:fail:";
    private static final int MAX_SIGN_ATTEMPTS = 3;
    private static final long SIGN_LOCK_SECONDS = 600;

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

    @Transactional
    public DeliveryOrder getOrderByTrackingNo(String trackingNo) {
        DeliveryOrder order = orderRepository.findByTrackingNo(trackingNo).orElse(null);
        if (order != null && order.getStatus() == DeliveryOrder.OrderStatus.DELIVERING && order.getSignCode() == null) {
            String signCode = generateSignCode();
            order.setSignCode(signCode);
            orderRepository.save(order);
            redisTemplate.opsForValue().set(SIGN_CODE_PREFIX + trackingNo, signCode, 24, java.util.concurrent.TimeUnit.HOURS);
            log.info("运单 {} 补发生成签收码: {}", trackingNo, signCode);
        }
        return order;
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

        if (newStatus == DeliveryOrder.OrderStatus.DELIVERING && order.getSignCode() == null) {
            String signCode = generateSignCode();
            order.setSignCode(signCode);
            redisTemplate.opsForValue().set(SIGN_CODE_PREFIX + trackingNo, signCode, 24, java.util.concurrent.TimeUnit.HOURS);
            log.info("运单 {} 生成签收码: {}", trackingNo, signCode);
        }

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

    private String generateSignCode() {
        int code = (int) (Math.random() * 900000) + 100000;
        return String.valueOf(code);
    }

    public Map<String, Object> getSignStatus(String trackingNo) {
        Map<String, Object> result = new HashMap<>();
        DeliveryOrder order = orderRepository.findByTrackingNo(trackingNo).orElse(null);
        if (order == null) {
            result.put("exists", false);
            return result;
        }
        result.put("exists", true);
        result.put("status", order.getStatus());
        result.put("isDelivering", order.getStatus() == DeliveryOrder.OrderStatus.DELIVERING);
        result.put("isDelivered", order.getStatus() == DeliveryOrder.OrderStatus.DELIVERED);

        String failKey = SIGN_FAIL_PREFIX + trackingNo;
        String failCountStr = redisTemplate.opsForValue().get(failKey);
        int failCount = failCountStr != null ? Integer.parseInt(failCountStr) : 0;
        result.put("failCount", failCount);
        result.put("isLocked", failCount >= MAX_SIGN_ATTEMPTS);

        Long ttl = redisTemplate.getExpire(failKey, java.util.concurrent.TimeUnit.SECONDS);
        if (ttl != null && ttl > 0 && failCount >= MAX_SIGN_ATTEMPTS) {
            result.put("lockRemainingSeconds", ttl);
        } else {
            result.put("lockRemainingSeconds", 0);
        }

        if (order.getStatus() == DeliveryOrder.OrderStatus.DELIVERING && order.getSignCode() != null) {
            String cachedCode = redisTemplate.opsForValue().get(SIGN_CODE_PREFIX + trackingNo);
            if (cachedCode == null) {
                redisTemplate.opsForValue().set(SIGN_CODE_PREFIX + trackingNo, order.getSignCode(),
                        24, java.util.concurrent.TimeUnit.HOURS);
            }
        }

        return result;
    }

    @Transactional
    public Map<String, Object> verifySignAndDeliver(String trackingNo, String signCode,
                                                    String riderId, String riderName) {
        Map<String, Object> result = new HashMap<>();
        DeliveryOrder order = orderRepository.findByTrackingNo(trackingNo)
                .orElseThrow(() -> new RuntimeException("运单不存在: " + trackingNo));

        if (order.getStatus() != DeliveryOrder.OrderStatus.DELIVERING) {
            result.put("success", false);
            result.put("code", 400);
            result.put("message", "运单状态不是派送中，无法签收");
            return result;
        }

        String failKey = SIGN_FAIL_PREFIX + trackingNo;
        String failCountStr = redisTemplate.opsForValue().get(failKey);
        int failCount = failCountStr != null ? Integer.parseInt(failCountStr) : 0;

        if (failCount >= MAX_SIGN_ATTEMPTS) {
            Long ttl = redisTemplate.getExpire(failKey, java.util.concurrent.TimeUnit.SECONDS);
            result.put("success", false);
            result.put("code", 429);
            result.put("message", "签收验证失败次数过多，请" + (ttl != null ? ttl : 600) + "秒后重试");
            result.put("lockRemainingSeconds", ttl != null ? ttl : 600);
            result.put("failCount", failCount);
            return result;
        }

        String cachedCode = redisTemplate.opsForValue().get(SIGN_CODE_PREFIX + trackingNo);
        String dbCode = order.getSignCode();

        if (cachedCode == null && dbCode != null) {
            cachedCode = dbCode;
            redisTemplate.opsForValue().set(SIGN_CODE_PREFIX + trackingNo, dbCode,
                    24, java.util.concurrent.TimeUnit.HOURS);
        }

        if (cachedCode == null || !cachedCode.equals(signCode)) {
            failCount++;
            redisTemplate.opsForValue().set(failKey, String.valueOf(failCount),
                    SIGN_LOCK_SECONDS, java.util.concurrent.TimeUnit.SECONDS);

            result.put("success", false);
            result.put("code", 400);
            result.put("message", "签收码错误，还剩" + (MAX_SIGN_ATTEMPTS - failCount) + "次机会");
            result.put("failCount", failCount);
            result.put("remainingAttempts", MAX_SIGN_ATTEMPTS - failCount);
            if (failCount >= MAX_SIGN_ATTEMPTS) {
                result.put("isLocked", true);
                result.put("lockRemainingSeconds", SIGN_LOCK_SECONDS);
            }
            log.warn("运单 {} 签收码验证失败，次数: {}", trackingNo, failCount);
            return result;
        }

        updateOrderStatus(trackingNo, DeliveryOrder.OrderStatus.DELIVERED,
                "RIDER", riderId, "签收码验证通过（" + signCode.substring(0, 4) + "**）");

        redisTemplate.delete(SIGN_CODE_PREFIX + trackingNo);
        redisTemplate.delete(failKey);

        result.put("success", true);
        result.put("code", 200);
        result.put("message", "签收成功");
        result.put("data", order);
        log.info("运单 {} 签收成功，骑手: {}", trackingNo, riderName);
        return result;
    }
}
