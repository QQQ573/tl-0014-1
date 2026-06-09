import React, { useState, useEffect } from 'react'
import { 
  Input, Button, Card, Timeline, Tag, Row, Col, 
  Statistic, Descriptions, Alert, Spin, message 
} from 'antd'
import { 
  SearchOutlined, 
  GiftOutlined, 
  TruckOutlined, 
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import dayjs from 'dayjs'
import { orderApi, gpsApi } from '../services/api'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

function MapController({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (center) {
      map.setView(center, zoom)
    }
  }, [center, zoom, map])
  return null
}

const statusConfig = {
  PENDING: { label: '待出库', color: 'default', icon: ClockCircleOutlined },
  OUTBOUND: { label: '花店出库', color: 'blue', icon: GiftOutlined },
  LOADED: { label: '冷链装车', color: 'cyan', icon: TruckOutlined },
  DELIVERING: { label: '派送中', color: 'orange', icon: TruckOutlined },
  DELIVERED: { label: '已签收', color: 'green', icon: CheckCircleOutlined },
  EXCEPTION: { label: '异常', color: 'red', icon: ClockCircleOutlined },
}

const timelineSteps = [
  { key: 'OUTBOUND', label: '花店出库', desc: '鲜花已从花店出库，等待冷链装车' },
  { key: 'LOADED', label: '冷链装车', desc: '已完成冷链装车，全程低温保鲜' },
  { key: 'DELIVERING', label: '派送中', desc: '骑手正在快马加鞭配送中' },
  { key: 'DELIVERED', label: '已签收', desc: '鲜花已送达，祝您节日快乐' },
]

const CustomerPage = () => {
  const [trackingNo, setTrackingNo] = useState('FD0214ABCD12')
  const [inputValue, setInputValue] = useState('FD0214ABCD12')
  const [order, setOrder] = useState(null)
  const [gpsTrack, setGpsTrack] = useState([])
  const [loading, setLoading] = useState(false)
  const [statusLogs, setStatusLogs] = useState([])

  const fetchOrder = async () => {
    if (!inputValue.trim()) {
      message.warning('请输入运单号')
      return
    }
    setLoading(true)
    try {
      setTrackingNo(inputValue.trim())
      
      const orderRes = await orderApi.getOrderByTrackingNo(inputValue.trim())
      if (orderRes.success) {
        setOrder(orderRes.data)
        
        const trackRes = await gpsApi.getGpsTrack(inputValue.trim())
        if (trackRes.success) {
          setGpsTrack(trackRes.data)
        }
        
        const logRes = await orderApi.getStatusLogs(inputValue.trim())
        if (logRes.success) {
          setStatusLogs(logRes.data)
        }
      } else {
        message.error(orderRes.message || '运单不存在')
        setOrder(null)
        setGpsTrack([])
        setStatusLogs([])
      }
    } catch (err) {
      message.error('查询失败，请稍后重试')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrder()
  }, [])

  useEffect(() => {
    if (!order) return
    
    const interval = setInterval(() => {
      gpsApi.getGpsTrack(trackingNo).then(res => {
        if (res.success) {
          setGpsTrack(res.data)
        }
      })
      orderApi.getOrderByTrackingNo(trackingNo).then(res => {
        if (res.success) {
          setOrder(res.data)
        }
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [trackingNo, order])

  const getTimelineItems = () => {
    const statusOrder = ['OUTBOUND', 'LOADED', 'DELIVERING', 'DELIVERED']
    const currentIndex = statusOrder.indexOf(order?.status)
    
    return timelineSteps.map((step, index) => {
      const isCompleted = order && currentIndex >= statusOrder.indexOf(step.key)
      const isCurrent = order && statusOrder.indexOf(order?.status) === index
      
      return {
        color: isCompleted ? 'green' : isCurrent ? 'blue' : 'gray',
        children: (
          <div>
            <h4 style={{ marginBottom: '4px', color: isCompleted ? '#52c41a' : isCurrent ? '#1890ff' : '#bfbfbf' }}>
              {step.label}
              {isCurrent && <Tag color="blue" style={{ marginLeft: '8px' }}>当前</Tag>}
            </h4>
            <p style={{ color: '#999', fontSize: '13px', margin: 0 }}>{step.desc}</p>
            {isCompleted && statusLogs.find(l => l.toStatus === step.key) && (
              <p style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>
                {dayjs(statusLogs.find(l => l.toStatus === step.key).createTime).format('YYYY-MM-DD HH:mm:ss')}
              </p>
            )}
          </div>
        ),
      }
    })
  }

  const getMapCenter = () => {
    if (gpsTrack.length > 0) {
      const last = gpsTrack[gpsTrack.length - 1]
      return [last.latitude, last.longitude]
    }
    return [39.9087, 116.3975]
  }

  const getPolylinePositions = () => {
    return gpsTrack.map(p => [p.latitude, p.longitude])
  }

  return (
    <div>
      <Card style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <Input
            placeholder="请输入运单号查询"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onPressEnter={fetchOrder}
            prefix={<SearchOutlined />}
            style={{ maxWidth: '300px' }}
          />
          <Button type="primary" onClick={fetchOrder} loading={loading}>
            查询
          </Button>
          <Button onClick={() => { setInputValue('FD0214ABCD12') }}>
            演示数据
          </Button>
        </div>

        {order?.isException && (
          <Alert
            type="warning"
            showIcon
            message="订单异常"
            description={`该订单存在${order.exceptionType === 'PETAL_DAMAGE' ? '花瓣损伤' : order.exceptionType === 'ADDRESS_CHANGE' ? '地址变更' : '敏感词'}异常，已提交审核，处理结果会第一时间通知您。`}
            style={{ marginBottom: '16px' }}
          />
        )}
      </Card>

      <Spin spinning={loading}>
        {order && (
          <Row gutter={16}>
            <Col span={10}>
              <Card title="配送状态" style={{ marginBottom: '16px' }}>
                <Row gutter={16} style={{ marginBottom: '16px' }}>
                  <Col span={12}>
                    <Statistic 
                      title="当前状态" 
                      value={statusConfig[order.status]?.label || order.status}
                      valueStyle={{ color: order.status === 'EXCEPTION' ? '#ff4d4f' : '#1890ff', fontSize: '18px' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic 
                      title="运单号" 
                      value={order.trackingNo}
                      valueStyle={{ fontSize: '14px' }}
                    />
                  </Col>
                </Row>

                <Timeline items={getTimelineItems()} />
              </Card>

              <Card title="订单信息">
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="商品">{order.flowerType} × {order.quantity}</Descriptions.Item>
                  <Descriptions.Item label="收件人">{order.recipientName}</Descriptions.Item>
                  <Descriptions.Item label="联系电话">{order.recipientPhone}</Descriptions.Item>
                  <Descriptions.Item label="配送地址">{order.deliveryAddress}</Descriptions.Item>
                  <Descriptions.Item label="骑手">
                    {order.riderName || '待分配'}
                    {order.riderName && ` (${order.riderId})`}
                  </Descriptions.Item>
                  {order.cardMessage && (
                    <Descriptions.Item label="贺卡留言">{order.cardMessage}</Descriptions.Item>
                  )}
                </Descriptions>
              </Card>
            </Col>

            <Col span={14}>
              <Card title="实时位置" style={{ marginBottom: '16px' }}>
                <div className="map-container">
                  <MapContainer
                    center={getMapCenter()}
                    zoom={14}
                    style={{ height: '400px', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; OpenStreetMap'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {getPolylinePositions().length > 1 && (
                      <Polyline
                        positions={getPolylinePositions()}
                        color="#ff6b9d"
                        weight={4}
                        opacity={0.8}
                      />
                    )}
                    {gpsTrack.length > 0 && (
                      <Marker position={getMapCenter()}>
                        <Popup>
                          <div>
                            <p><strong>骑手位置</strong></p>
                            <p>时间: {dayjs(gpsTrack[gpsTrack.length - 1].reportTime).format('HH:mm:ss')}</p>
                            <p>速度: {gpsTrack[gpsTrack.length - 1].speed?.toFixed(1) || 0} km/h</p>
                          </div>
                        </Popup>
                      </Marker>
                    )}
                    {order.latitude && order.longitude && (
                      <Marker position={[order.latitude, order.longitude]}>
                        <Popup>
                          <div>
                            <p><strong>收货地址</strong></p>
                            <p>{order.deliveryAddress}</p>
                          </div>
                        </Popup>
                      </Marker>
                    )}
                    <MapController center={getMapCenter()} zoom={13} />
                  </MapContainer>
                </div>
                <div style={{ marginTop: '12px', fontSize: '13px', color: '#666' }}>
                  已上报 {gpsTrack.length} 个GPS点 · 数据每5秒自动刷新
                </div>
              </Card>
            </Col>
          </Row>
        )}
      </Spin>
    </div>
  )
}

export default CustomerPage
