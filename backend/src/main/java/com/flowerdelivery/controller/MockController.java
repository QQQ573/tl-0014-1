package com.flowerdelivery.controller;

import com.flowerdelivery.entity.GpsPoint;
import com.flowerdelivery.service.MockGpsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/mock")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MockController {

    private final MockGpsService mockGpsService;

    @PostMapping("/gps/init")
    public ResponseEntity<Map<String, Object>> initMockTrack(@RequestBody Map<String, Object> request) {
        String trackingNo = (String) request.get("trackingNo");
        String riderId = (String) request.get("riderId");
        int points = request.get("points") != null ? ((Number) request.get("points")).intValue() : 5;

        List<GpsPoint> track = mockGpsService.initMockTrack(trackingNo, riderId, points);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", track);
        result.put("count", track.size());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/gps/report")
    public ResponseEntity<Map<String, Object>> reportMockGps(@RequestBody Map<String, Object> request) {
        String trackingNo = (String) request.get("trackingNo");
        String riderId = (String) request.get("riderId");
        int sequence = ((Number) request.get("sequence")).intValue();

        GpsPoint point = mockGpsService.reportMockGps(trackingNo, riderId, sequence);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", point);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/route")
    public ResponseEntity<Map<String, Object>> getDefaultRoute() {
        List<MockGpsService.RoutePoint> route = mockGpsService.getDefaultRoute();
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", route);
        result.put("count", route.size());
        return ResponseEntity.ok(result);
    }
}
