package com.flowerdelivery.service;

import com.flowerdelivery.entity.GpsPoint;
import com.flowerdelivery.repository.GpsPointRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class GpsService {

    private final GpsPointRepository gpsPointRepository;
    private final StringRedisTemplate redisTemplate;

    private static final String GPS_LATEST_PREFIX = "flower:gps:latest:";
    private static final String GPS_TRACK_PREFIX = "flower:gps:track:";
    private static final long GPS_CACHE_TTL = 3600;

    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule());

    @Transactional
    public GpsPoint reportGps(String trackingNo, String riderId, Double latitude,
                              Double longitude, Double speed, Double heading) {
        GpsPoint lastPoint = gpsPointRepository.findTopByTrackingNoOrderBySequenceDesc(trackingNo);
        int sequence = (lastPoint != null) ? lastPoint.getSequence() + 1 : 1;

        GpsPoint point = new GpsPoint();
        point.setTrackingNo(trackingNo);
        point.setRiderId(riderId);
        point.setLatitude(latitude);
        point.setLongitude(longitude);
        point.setSpeed(speed);
        point.setHeading(heading);
        point.setSequence(sequence);

        GpsPoint saved = gpsPointRepository.save(point);

        try {
            String pointJson = objectMapper.writeValueAsString(saved);
            redisTemplate.opsForValue().set(GPS_LATEST_PREFIX + trackingNo, pointJson, GPS_CACHE_TTL, TimeUnit.SECONDS);
            redisTemplate.opsForList().rightPush(GPS_TRACK_PREFIX + trackingNo, pointJson);
            redisTemplate.expire(GPS_TRACK_PREFIX + trackingNo, GPS_CACHE_TTL, TimeUnit.SECONDS);
        } catch (JsonProcessingException e) {
            log.error("GPS数据序列化失败", e);
        }

        log.debug("运单 {} GPS上报: {}, {}, 序号: {}", trackingNo, latitude, longitude, sequence);
        return saved;
    }

    public GpsPoint getLatestGps(String trackingNo) {
        String cached = redisTemplate.opsForValue().get(GPS_LATEST_PREFIX + trackingNo);
        if (cached != null) {
            try {
                return objectMapper.readValue(cached, GpsPoint.class);
            } catch (JsonProcessingException e) {
                log.warn("GPS缓存反序列化失败", e);
            }
        }

        GpsPoint point = gpsPointRepository.findTopByTrackingNoOrderBySequenceDesc(trackingNo);
        if (point != null) {
            try {
                redisTemplate.opsForValue().set(GPS_LATEST_PREFIX + trackingNo,
                        objectMapper.writeValueAsString(point), GPS_CACHE_TTL, TimeUnit.SECONDS);
            } catch (JsonProcessingException e) {
                log.error("GPS数据序列化失败", e);
            }
        }
        return point;
    }

    public List<GpsPoint> getGpsTrack(String trackingNo) {
        List<GpsPoint> track = gpsPointRepository.findByTrackingNoOrderBySequenceAsc(trackingNo);
        return track;
    }

    public void clearGpsTrack(String trackingNo) {
        gpsPointRepository.deleteAll(gpsPointRepository.findByTrackingNoOrderBySequenceAsc(trackingNo));
        redisTemplate.delete(GPS_LATEST_PREFIX + trackingNo);
        redisTemplate.delete(GPS_TRACK_PREFIX + trackingNo);
    }
}
