package com.flowerdelivery.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "gps_point")
public class GpsPoint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tracking_no", nullable = false, length = 32)
    private String trackingNo;

    @Column(name = "rider_id", length = 32)
    private String riderId;

    @Column(name = "latitude", nullable = false)
    private Double latitude;

    @Column(name = "longitude", nullable = false)
    private Double longitude;

    @Column(name = "speed")
    private Double speed;

    @Column(name = "heading")
    private Double heading;

    @CreationTimestamp
    @Column(name = "report_time", nullable = false)
    private LocalDateTime reportTime;

    @Column(name = "sequence", nullable = false)
    private Integer sequence;
}
