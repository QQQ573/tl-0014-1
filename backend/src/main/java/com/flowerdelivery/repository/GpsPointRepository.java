package com.flowerdelivery.repository;

import com.flowerdelivery.entity.GpsPoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GpsPointRepository extends JpaRepository<GpsPoint, Long> {

    List<GpsPoint> findByTrackingNoOrderBySequenceAsc(String trackingNo);

    List<GpsPoint> findByTrackingNoOrderByReportTimeDesc(String trackingNo);

    GpsPoint findTopByTrackingNoOrderBySequenceDesc(String trackingNo);
}
