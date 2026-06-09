package com.flowerdelivery.controller;

import com.flowerdelivery.entity.GpsPoint;
import com.flowerdelivery.service.GpsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/gps")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class GpsController {

    private final GpsService gpsService;

    @PostMapping("/report")
    public ResponseEntity<Map<String, Object>> reportGps(@RequestBody Map<String, Object> request) {
        String trackingNo = (String) request.get("trackingNo");
        String riderId = (String) request.get("riderId");
        Double latitude = ((Number) request.get("latitude")).doubleValue();
        Double longitude = ((Number) request.get("longitude")).doubleValue();
        Double speed = request.get("speed") != null ? ((Number) request.get("speed")).doubleValue() : null;
        Double heading = request.get("heading") != null ? ((Number) request.get("heading")).doubleValue() : null;

        GpsPoint point = gpsService.reportGps(trackingNo, riderId, latitude, longitude, speed, heading);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", point);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/latest/{trackingNo}")
    public ResponseEntity<Map<String, Object>> getLatestGps(@PathVariable String trackingNo) {
        GpsPoint point = gpsService.getLatestGps(trackingNo);
        Map<String, Object> result = new HashMap<>();
        if (point != null) {
            result.put("success", true);
            result.put("data", point);
        } else {
            result.put("success", false);
            result.put("message", "暂无GPS数据");
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/track/{trackingNo}")
    public ResponseEntity<Map<String, Object>> getGpsTrack(@PathVariable String trackingNo) {
        List<GpsPoint> track = gpsService.getGpsTrack(trackingNo);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", track);
        return ResponseEntity.ok(result);
    }
}
