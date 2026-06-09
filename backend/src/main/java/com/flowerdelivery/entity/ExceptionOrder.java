package com.flowerdelivery.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "exception_order")
public class ExceptionOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tracking_no", nullable = false, length = 32)
    private String trackingNo;

    @Column(name = "order_no", nullable = false, length = 32)
    private String orderNo;

    @Enumerated(EnumType.STRING)
    @Column(name = "exception_type", nullable = false, length = 32)
    private ExceptionType exceptionType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    private ExceptionStatus status;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "damage_level", length = 32)
    private String damageLevel;

    @Column(name = "new_address", length = 512)
    private String newAddress;

    @Column(name = "new_latitude")
    private Double newLatitude;

    @Column(name = "new_longitude")
    private Double newLongitude;

    @Column(name = "sensitive_word_hit", length = 256)
    private String sensitiveWordHit;

    @Column(name = "reviewer_id", length = 32)
    private String reviewerId;

    @Column(name = "reviewer_name", length = 64)
    private String reviewerName;

    @Column(name = "review_comment", length = 1000)
    private String reviewComment;

    @Enumerated(EnumType.STRING)
    @Column(name = "resolution_type", length = 32)
    private ResolutionType resolutionType;

    @Column(name = "refund_amount", precision = 10, scale = 2)
    private BigDecimal refundAmount;

    @Column(name = "reissue_tracking_no", length = 32)
    private String reissueTrackingNo;

    @CreationTimestamp
    @Column(name = "create_time", nullable = false, updatable = false)
    private LocalDateTime createTime;

    @UpdateTimestamp
    @Column(name = "update_time", nullable = false)
    private LocalDateTime updateTime;

    @Column(name = "review_time")
    private LocalDateTime reviewTime;

    public enum ExceptionType {
        PETAL_DAMAGE,
        ADDRESS_CHANGE,
        SENSITIVE_WORD
    }

    public enum ExceptionStatus {
        PENDING_REVIEW,
        UNDER_REVIEW,
        APPROVED,
        REJECTED,
        RESOLVED
    }

    public enum ResolutionType {
        REISSUE,
        PARTIAL_REFUND,
        FULL_REFUND,
        NONE
    }
}
