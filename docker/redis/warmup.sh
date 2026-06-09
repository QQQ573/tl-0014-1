#!/bin/sh

echo "开始预热 Redis 缓存..."

REDIS_HOST=${REDIS_HOST:-redis}
REDIS_PORT=${REDIS_PORT:-6379}
REDIS_PASSWORD=${REDIS_PASSWORD:-}

if [ -n "$REDIS_PASSWORD" ]; then
    REDIS_AUTH="-a $REDIS_PASSWORD"
else
    REDIS_AUTH=""
fi

redis-cli -h $REDIS_HOST -p $REDIS_PORT $REDIS_AUTH SET "flower:system:status" "running"
redis-cli -h $REDIS_HOST -p $REDIS_PORT $REDIS_AUTH SET "flower:system:version" "1.0.0"
redis-cli -h $REDIS_HOST -p $REDIS_PORT $REDIS_AUTH SET "flower:config:gps_report_interval" "30"
redis-cli -h $REDIS_HOST -p $REDIS_PORT $REDIS_AUTH SET "flower:config:exception_timeout" "1800"

redis-cli -h $REDIS_HOST -p $REDIS_PORT $REDIS_AUTH SADD "flower:sensitive:words" \
    "违禁词1" "违禁词2" "赌博" "毒品" "诈骗" "fuck" "shit" "去死" "垃圾" "废物"

redis-cli -h $REDIS_HOST -p $REDIS_PORT $REDIS_AUTH SET "flower:stats:today_orders" "0"
redis-cli -h $REDIS_HOST -p $REDIS_PORT $REDIS_AUTH SET "flower:stats:delivering_orders" "0"
redis-cli -h $REDIS_HOST -p $REDIS_PORT $REDIS_AUTH SET "flower:stats:exception_orders" "0"
redis-cli -h $REDIS_HOST -p $REDIS_PORT $REDIS_AUTH SET "flower:stats:delivered_orders" "0"

redis-cli -h $REDIS_HOST -p $REDIS_PORT $REDIS_AUTH SET "flower:rider:R001:name" "王师傅"
redis-cli -h $REDIS_HOST -p $REDIS_PORT $REDIS_AUTH SET "flower:rider:R001:phone" "13800000001"
redis-cli -h $REDIS_HOST -p $REDIS_PORT $REDIS_AUTH SET "flower:rider:R002:name" "李师傅"
redis-cli -h $REDIS_HOST -p $REDIS_PORT $REDIS_AUTH SET "flower:rider:R002:phone" "13800000002"

echo "Redis 缓存预热完成！"
echo "预热的键："
redis-cli -h $REDIS_HOST -p $REDIS_PORT $REDIS_AUTH KEYS "flower:*"
