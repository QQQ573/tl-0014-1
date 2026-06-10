package com.flowerdelivery.service;

import com.flowerdelivery.entity.DeliveryOrder;
import com.flowerdelivery.entity.ExceptionOrder;
import com.flowerdelivery.repository.DeliveryOrderRepository;
import com.flowerdelivery.repository.ExceptionOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExceptionOrderService {

    private final ExceptionOrderRepository exceptionOrderRepository;
    private final DeliveryOrderRepository orderRepository;
    private final OrderService orderService;
    private final StringRedisTemplate redisTemplate;

    private static final String EXCEPTION_QUEUE_KEY = "flower:exception:queue";

    @Transactional
    public ExceptionOrder createExceptionOrder(String trackingNo, ExceptionOrder.ExceptionType type,
                                               String description, String damageLevel,
                                               String newAddress, Double newLatitude,
                                               Double newLongitude, String sensitiveWordHit) {
        DeliveryOrder order = orderRepository.findByTrackingNo(trackingNo)
                .orElseThrow(() -> new RuntimeException("运单不存在: " + trackingNo));

        order.setIsException(true);
        order.setExceptionType(type.name());
        order.setStatus(DeliveryOrder.OrderStatus.EXCEPTION);
        orderRepository.save(order);

        ExceptionOrder exception = new ExceptionOrder();
        exception.setTrackingNo(trackingNo);
        exception.setOrderNo(order.getOrderNo());
        exception.setExceptionType(type);
        exception.setStatus(ExceptionOrder.ExceptionStatus.PENDING_REVIEW);
        exception.setDescription(description);
        exception.setDamageLevel(damageLevel);
        exception.setNewAddress(newAddress);
        exception.setNewLatitude(newLatitude);
        exception.setNewLongitude(newLongitude);
        exception.setSensitiveWordHit(sensitiveWordHit);

        ExceptionOrder saved = exceptionOrderRepository.save(exception);

        redisTemplate.opsForSet().add(EXCEPTION_QUEUE_KEY, String.valueOf(saved.getId()));

        log.info("异常工单创建: 运单号={}, 类型={}, 工单ID={}", trackingNo, type, saved.getId());
        return saved;
    }

    public List<ExceptionOrder> getPendingExceptions() {
        return exceptionOrderRepository.findByStatus(ExceptionOrder.ExceptionStatus.PENDING_REVIEW);
    }

    public List<ExceptionOrder> getExceptionsByStatus(ExceptionOrder.ExceptionStatus status) {
        return exceptionOrderRepository.findByStatus(status);
    }

    public List<ExceptionOrder> getExceptionsByType(ExceptionOrder.ExceptionType type) {
        return exceptionOrderRepository.findByExceptionType(type);
    }

    public ExceptionOrder getExceptionById(Long id) {
        return exceptionOrderRepository.findById(id).orElse(null);
    }

    @Transactional
    public ExceptionOrder reviewException(Long id, String reviewerId, String reviewerName,
                                          boolean approved, String reviewComment,
                                          ExceptionOrder.ResolutionType resolutionType,
                                          BigDecimal refundAmount) {
        ExceptionOrder exception = exceptionOrderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("异常工单不存在: " + id));

        if (exception.getStatus() != ExceptionOrder.ExceptionStatus.PENDING_REVIEW) {
            throw new RuntimeException("工单状态不允许审核: " + exception.getStatus());
        }

        exception.setReviewerId(reviewerId);
        exception.setReviewerName(reviewerName);
        exception.setReviewComment(reviewComment);
        exception.setReviewTime(LocalDateTime.now());
        exception.setResolutionType(resolutionType);

        if (approved) {
            exception.setStatus(ExceptionOrder.ExceptionStatus.APPROVED);
            processApprovedException(exception, resolutionType, refundAmount);
        } else {
            exception.setStatus(ExceptionOrder.ExceptionStatus.REJECTED);
            DeliveryOrder order = orderRepository.findByTrackingNo(exception.getTrackingNo()).orElse(null);
            if (order != null) {
                order.setIsException(false);
                order.setExceptionType(null);
                order.setStatus(DeliveryOrder.OrderStatus.DELIVERING);
                orderRepository.save(order);
            }
        }

        redisTemplate.opsForSet().remove(EXCEPTION_QUEUE_KEY, String.valueOf(id));

        ExceptionOrder saved = exceptionOrderRepository.save(exception);
        log.info("异常工单审核完成: ID={}, 结果={}, 处理方式={}", id, approved ? "通过" : "驳回", resolutionType);
        return saved;
    }

    private void processApprovedException(ExceptionOrder exception,
                                          ExceptionOrder.ResolutionType resolutionType,
                                          BigDecimal refundAmount) {
        DeliveryOrder order = orderRepository.findByTrackingNo(exception.getTrackingNo()).orElse(null);
        if (order == null) {
            return;
        }

        switch (resolutionType) {
            case REISSUE:
                exception.setStatus(ExceptionOrder.ExceptionStatus.RESOLVED);
                DeliveryOrder reissueOrder = new DeliveryOrder();
                reissueOrder.setCustomerName(order.getCustomerName());
                reissueOrder.setCustomerPhone(order.getCustomerPhone());
                reissueOrder.setRecipientName(order.getRecipientName());
                reissueOrder.setRecipientPhone(order.getRecipientPhone());
                reissueOrder.setDeliveryAddress(order.getDeliveryAddress());
                reissueOrder.setLatitude(order.getLatitude());
                reissueOrder.setLongitude(order.getLongitude());
                reissueOrder.setFlowerType(order.getFlowerType());
                reissueOrder.setQuantity(order.getQuantity());
                reissueOrder.setAmount(order.getAmount());
                reissueOrder.setCardMessage(order.getCardMessage());
                DeliveryOrder saved = orderService.createOrder(reissueOrder);
                orderService.updateOrderStatus(saved.getTrackingNo(), DeliveryOrder.OrderStatus.OUTBOUND,
                        "SYSTEM", "auto_reissue", "补发订单自动出库");
                exception.setReissueTrackingNo(saved.getTrackingNo());
                order.setIsException(false);
                order.setExceptionType(null);
                orderRepository.save(order);
                break;

            case PARTIAL_REFUND:
                exception.setStatus(ExceptionOrder.ExceptionStatus.RESOLVED);
                exception.setRefundAmount(refundAmount);
                break;

            case FULL_REFUND:
                exception.setStatus(ExceptionOrder.ExceptionStatus.RESOLVED);
                exception.setRefundAmount(order.getAmount());
                break;

            default:
                break;
        }
    }

    public List<ExceptionOrder> getExceptionsByTrackingNo(String trackingNo) {
        return exceptionOrderRepository.findByTrackingNoOrderByCreateTimeDesc(trackingNo);
    }
}
