package com.flowerdelivery.service;

import com.flowerdelivery.entity.GpsPoint;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class MockGpsService {

    private final GpsService gpsService;

    public static class RoutePoint {
        public double lat;
        public double lng;

        public RoutePoint(double lat, double lng) {
            this.lat = lat;
            this.lng = lng;
        }
    }

    public List<RoutePoint> generateMockRoute(double startLat, double startLng,
                                               double endLat, double endLng, int steps) {
        List<RoutePoint> route = new ArrayList<>();

        double latStep = (endLat - startLat) / steps;
        double lngStep = (endLng - startLng) / steps;

        for (int i = 0; i <= steps; i++) {
            double lat = startLat + latStep * i;
            double lng = startLng + lngStep * i;

            double offset = 0.0001 * Math.sin(i * 0.5);
            lat += offset;
            lng += offset * 0.8;

            route.add(new RoutePoint(lat, lng));
        }

        return route;
    }

    public List<RoutePoint> getDefaultRoute() {
        List<RoutePoint> route = new ArrayList<>();

        route.add(new RoutePoint(39.9087, 116.3975));
        route.add(new RoutePoint(39.9120, 116.4020));
        route.add(new RoutePoint(39.9150, 116.4080));
        route.add(new RoutePoint(39.9180, 116.4120));
        route.add(new RoutePoint(39.9200, 116.4180));
        route.add(new RoutePoint(39.9230, 116.4230));
        route.add(new RoutePoint(39.9260, 116.4280));
        route.add(new RoutePoint(39.9290, 116.4330));
        route.add(new RoutePoint(39.9320, 116.4380));
        route.add(new RoutePoint(39.9350, 116.4430));

        return route;
    }

    public GpsPoint reportMockGps(String trackingNo, String riderId, int sequence) {
        List<RoutePoint> route = getDefaultRoute();
        if (sequence < 0 || sequence >= route.size()) {
            throw new RuntimeException("GPS序号超出范围: " + sequence);
        }

        RoutePoint point = route.get(sequence);
        double speed = 20 + Math.random() * 15;
        double heading = Math.random() * 360;

        return gpsService.reportGps(trackingNo, riderId, point.lat, point.lng, speed, heading);
    }

    public List<GpsPoint> initMockTrack(String trackingNo, String riderId, int points) {
        List<RoutePoint> route = getDefaultRoute();
        int count = Math.min(points, route.size());
        List<GpsPoint> result = new ArrayList<>();

        for (int i = 0; i < count; i++) {
            RoutePoint point = route.get(i);
            double speed = 20 + Math.random() * 15;
            double heading = Math.random() * 360;
            GpsPoint gps = gpsService.reportGps(trackingNo, riderId, point.lat, point.lng, speed, heading);
            result.add(gps);
        }

        log.info("初始化运单 {} 的模拟GPS轨迹，共 {} 个点", trackingNo, count);
        return result;
    }
}
