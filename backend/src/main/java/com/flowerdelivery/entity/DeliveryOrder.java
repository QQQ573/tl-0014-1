package com.flowerdelivery.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "delivery_order")
public class DeliveryOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_no", unique = true, nullable = false, length = 32)
    private String orderNo;

    @Column(name = "tracking_no", unique = true, nullable = false, length = 32)
    private String trackingNo;

    @Column(name = "customer_name", nullable = false, length = 64)
    private String customerName;

    @Column(name = "customer_phone", nullable = false, length = 20)
    private String customerPhone;

    @Column(name = "recipient_name", nullable = false, length = 64)
    private String recipientName;

    @Column(name = "recipient_phone", nullable = false, length = 20)
    private String recipientPhone;

    @Column(name = "delivery_address", nullable = false, length = 512)
    private String deliveryAddress;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "flower_type", nullable = false, length = 64)
    private String flowerType;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "amount", precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "card_message", length = 500)
    private String cardMessage;

    @Column(name = "rider_id", length = 32)
    private String riderId;

    @Column(name = "rider_name", length = 64)
    private String riderName;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    private OrderStatus status;

    @Column(name = "is_exception", nullable = false)
    private Boolean isException = false;

    @Column(name = "exception_type", length = 32)
    private String exceptionType;

    @CreationTimestamp
    @Column(name = "create_time", nullable = false, updatable = false)
    private LocalDateTime createTime;

    @UpdateTimestamp
    @Column(name = "update_time", nullable = false)
    private LocalDateTime updateTime;

    @Column(name = "outbound_time")
    private LocalDateTime outboundTime;

    @Column(name = "loaded_time")
    private LocalDateTime loadedTime;

    @Column(name = "delivering_time")
    private LocalDateTime deliveringTime;

    @Column(name = "delivered_time")
    private LocalDateTime deliveredTime;

    public enum OrderStatus {
        PENDING,
        OUTBOUND,
        LOADED,
        DELIVERING,
        DELIVERED,
        EXCEPTION
    }
}
