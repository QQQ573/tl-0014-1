-- 创建数据库
CREATE DATABASE IF NOT EXISTS flower_delivery DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE flower_delivery;

-- 运单表
CREATE TABLE IF NOT EXISTS delivery_order (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_no VARCHAR(32) NOT NULL UNIQUE COMMENT '订单号',
    tracking_no VARCHAR(32) NOT NULL UNIQUE COMMENT '运单号',
    customer_name VARCHAR(64) NOT NULL COMMENT '客户姓名',
    customer_phone VARCHAR(20) NOT NULL COMMENT '客户电话',
    recipient_name VARCHAR(64) NOT NULL COMMENT '收件人姓名',
    recipient_phone VARCHAR(20) NOT NULL COMMENT '收件人电话',
    delivery_address VARCHAR(512) NOT NULL COMMENT '配送地址',
    latitude DECIMAL(10, 7) COMMENT '纬度',
    longitude DECIMAL(10, 7) COMMENT '经度',
    flower_type VARCHAR(64) NOT NULL COMMENT '鲜花类型',
    quantity INT NOT NULL COMMENT '数量',
    amount DECIMAL(10, 2) COMMENT '金额',
    card_message VARCHAR(500) COMMENT '贺卡留言',
    rider_id VARCHAR(32) COMMENT '骑手ID',
    rider_name VARCHAR(64) COMMENT '骑手姓名',
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING' COMMENT '订单状态',
    is_exception TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否异常',
    exception_type VARCHAR(32) COMMENT '异常类型',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    outbound_time DATETIME COMMENT '出库时间',
    loaded_time DATETIME COMMENT '装车时间',
    delivering_time DATETIME COMMENT '派送时间',
    delivered_time DATETIME COMMENT '签收时间',
    INDEX idx_status (status),
    INDEX idx_rider_id (rider_id),
    INDEX idx_is_exception (is_exception),
    INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='运单表';

-- GPS点位表
CREATE TABLE IF NOT EXISTS gps_point (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tracking_no VARCHAR(32) NOT NULL COMMENT '运单号',
    rider_id VARCHAR(32) COMMENT '骑手ID',
    latitude DECIMAL(10, 7) NOT NULL COMMENT '纬度',
    longitude DECIMAL(10, 7) NOT NULL COMMENT '经度',
    speed DECIMAL(10, 2) COMMENT '速度 km/h',
    heading DECIMAL(5, 2) COMMENT '方向角度',
    report_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '上报时间',
    sequence INT NOT NULL COMMENT '序号',
    INDEX idx_tracking_no (tracking_no),
    INDEX idx_rider_id (rider_id),
    INDEX idx_report_time (report_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='GPS点位表';

-- 异常工单表
CREATE TABLE IF NOT EXISTS exception_order (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tracking_no VARCHAR(32) NOT NULL COMMENT '运单号',
    order_no VARCHAR(32) NOT NULL COMMENT '订单号',
    exception_type VARCHAR(32) NOT NULL COMMENT '异常类型',
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING_REVIEW' COMMENT '工单状态',
    description VARCHAR(1000) COMMENT '异常描述',
    damage_level VARCHAR(32) COMMENT '损伤程度',
    new_address VARCHAR(512) COMMENT '新地址',
    new_latitude DECIMAL(10, 7) COMMENT '新纬度',
    new_longitude DECIMAL(10, 7) COMMENT '新经度',
    sensitive_word_hit VARCHAR(256) COMMENT '命中敏感词',
    reviewer_id VARCHAR(32) COMMENT '审核人ID',
    reviewer_name VARCHAR(64) COMMENT '审核人姓名',
    review_comment VARCHAR(1000) COMMENT '审核意见',
    resolution_type VARCHAR(32) COMMENT '处理方式',
    refund_amount DECIMAL(10, 2) COMMENT '退款金额',
    reissue_tracking_no VARCHAR(32) COMMENT '补发运单号',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    review_time DATETIME COMMENT '审核时间',
    INDEX idx_tracking_no (tracking_no),
    INDEX idx_status (status),
    INDEX idx_exception_type (exception_type),
    INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='异常工单表';

-- 敏感词表
CREATE TABLE IF NOT EXISTS sensitive_word (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    word VARCHAR(128) NOT NULL UNIQUE COMMENT '敏感词',
    category VARCHAR(64) COMMENT '分类',
    enabled TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_enabled (enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='敏感词表';

-- 订单状态日志表
CREATE TABLE IF NOT EXISTS order_status_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tracking_no VARCHAR(32) NOT NULL COMMENT '运单号',
    from_status VARCHAR(32) COMMENT '原状态',
    to_status VARCHAR(32) NOT NULL COMMENT '目标状态',
    operator_type VARCHAR(32) COMMENT '操作人类型',
    operator_id VARCHAR(64) COMMENT '操作人ID',
    remark VARCHAR(500) COMMENT '备注',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tracking_no (tracking_no),
    INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单状态日志表';

-- 插入敏感词数据
INSERT INTO sensitive_word (word, category) VALUES
('违禁词1', '政治'),
('违禁词2', '政治'),
('赌博', '违法'),
('毒品', '违法'),
('诈骗', '违法'),
('fuck', '脏话'),
('shit', '脏话'),
('去死', '辱骂'),
('垃圾', '辱骂'),
('废物', '辱骂');

-- 插入测试订单数据
INSERT INTO delivery_order (
    order_no, tracking_no, customer_name, customer_phone,
    recipient_name, recipient_phone, delivery_address,
    latitude, longitude, flower_type, quantity, amount,
    card_message, rider_id, rider_name, status,
    is_exception, outbound_time, loaded_time, delivering_time
) VALUES
(
    'ORD20250214A1B2C3D4', 'FD0214ABCD12', '张小明', '13800138001',
    '李小红', '13900139001', '北京市朝阳区建国路88号',
    39.9350, 116.4430, '红玫瑰', 99, 2999.00,
    '情人节快乐，永远爱你！', 'RIDER001', '王师傅', 'DELIVERING',
    0, '2025-02-14 08:00:00', '2025-02-14 08:30:00', '2025-02-14 09:00:00'
),
(
    'ORD20250214B2C3D4E5', 'FD0214CDEF34', '赵大海', '13800138002',
    '孙小美', '13900139002', '北京市海淀区中关村大街1号',
    39.9800, 116.3200, '粉玫瑰', 33, 999.00,
    '爱你每一天', 'RIDER002', '李师傅', 'OUTBOUND',
    0, '2025-02-14 10:00:00', NULL, NULL
),
(
    'ORD20250214C3D4E5F6', 'FD0214EFGH56', '周星星', '13800138003',
    '吴老师', '13900139003', '北京市西城区金融街35号',
    39.9150, 116.3600, '百合花束', 11, 599.00,
    '贺卡里有违禁词1内容需要审核', 'RIDER003', '张师傅', 'EXCEPTION',
    1, '2025-02-14 07:00:00', '2025-02-14 07:30:00', '2025-02-14 08:00:00'
);

-- 插入测试GPS数据
INSERT INTO gps_point (tracking_no, rider_id, latitude, longitude, speed, heading, report_time, sequence) VALUES
('FD0214ABCD12', 'RIDER001', 39.9087, 116.3975, 25.5, 45.0, '2025-02-14 09:00:00', 1),
('FD0214ABCD12', 'RIDER001', 39.9120, 116.4020, 28.0, 50.0, '2025-02-14 09:02:00', 2),
('FD0214ABCD12', 'RIDER001', 39.9150, 116.4080, 22.3, 55.0, '2025-02-14 09:04:00', 3),
('FD0214ABCD12', 'RIDER001', 39.9180, 116.4120, 30.1, 60.0, '2025-02-14 09:06:00', 4),
('FD0214ABCD12', 'RIDER001', 39.9200, 116.4180, 26.8, 65.0, '2025-02-14 09:08:00', 5),
('FD0214ABCD12', 'RIDER001', 39.9230, 116.4230, 24.5, 70.0, '2025-02-14 09:10:00', 6);

-- 插入异常工单测试数据
INSERT INTO exception_order (
    tracking_no, order_no, exception_type, status,
    description, damage_level, sensitive_word_hit
) VALUES
(
    'FD0214EFGH56', 'ORD20250214C3D4E5F6', 'SENSITIVE_WORD', 'PENDING_REVIEW',
    '贺卡留言命中敏感词，需人工审核', NULL, '违禁词1'
);

-- 插入状态日志
INSERT INTO order_status_log (tracking_no, from_status, to_status, operator_type, operator_id, remark) VALUES
('FD0214ABCD12', NULL, 'PENDING', 'SYSTEM', 'system', '订单创建'),
('FD0214ABCD12', 'PENDING', 'OUTBOUND', 'SYSTEM', 'florist_01', '花店出库'),
('FD0214ABCD12', 'OUTBOUND', 'LOADED', 'SYSTEM', 'logistics_01', '冷链装车完成'),
('FD0214ABCD12', 'LOADED', 'DELIVERING', 'RIDER', 'RIDER001', '骑手开始派送'),
('FD0214CDEF34', NULL, 'PENDING', 'SYSTEM', 'system', '订单创建'),
('FD0214CDEF34', 'PENDING', 'OUTBOUND', 'SYSTEM', 'florist_02', '花店出库'),
('FD0214EFGH56', NULL, 'PENDING', 'SYSTEM', 'system', '订单创建'),
('FD0214EFGH56', 'PENDING', 'OUTBOUND', 'SYSTEM', 'florist_03', '花店出库'),
('FD0214EFGH56', 'OUTBOUND', 'LOADED', 'SYSTEM', 'logistics_03', '冷链装车完成'),
('FD0214EFGH56', 'LOADED', 'DELIVERING', 'RIDER', 'RIDER003', '骑手开始派送'),
('FD0214EFGH56', 'DELIVERING', 'EXCEPTION', 'SYSTEM', 'system', '敏感词异常');
