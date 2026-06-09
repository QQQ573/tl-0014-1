package com.flowerdelivery.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "order_status_log")
public class OrderStatusLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tracking_no", nullable = false, length = 32)
    private String trackingNo;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status", length = 32)
    private DeliveryOrder.OrderStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", nullable = false, length = 32)
    private DeliveryOrder.OrderStatus toStatus;

    @Column(name = "operator_type", length = 32)
    private String operatorType;

    @Column(name = "operator_id", length = 64)
    private String operatorId;

    @Column(name = "remark", length = 500)
    private String remark;

    @CreationTimestamp
    @Column(name = "create_time", nullable = false, updatable = false)
    private LocalDateTime createTime;
}
