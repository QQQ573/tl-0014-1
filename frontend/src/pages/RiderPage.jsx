import React, { useState, useEffect } from 'react'
import { 
  Card, Button, Input, Select, Row, Col, Statistic, 
  List, Tag, message, Divider, Modal, Form, Radio
} from 'antd'
import { 
  PlayCircleOutlined, 
  PauseCircleOutlined, 
  ExclamationCircleOutlined,
  EnvironmentOutlined,
  CarOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { orderApi, gpsApi, mockApi, exceptionApi } from '../services/api'

const { Option } = Select
const { TextArea } = Input

const RiderPage = () => {
  const [riderId, setRiderId] = useState('RIDER001')
  const [riderName, setRiderName] = useState('王师傅')
  const [orders, setOrders] = useState([])
  const [currentOrder, setCurrentOrder] = useState(null)
  const [gpsSequence, setGpsSequence] = useState(0)
  const [isAutoReporting, setIsAutoReporting] = useState(false)
  const [reportInterval, setReportInterval] = useState(null)
  const [exceptionModalVisible, setExceptionModalVisible] = useState(false)
  const [exceptionForm] = Form.useForm()
  const [latestGps, setLatestGps] = useState(null)

  const fetchOrders = async () => {
    try {
      const res = await orderApi.getOrdersByRider(riderId)
      if (res.success) {
        setOrders(res.data)
        if (res.data.length > 0 && !currentOrder) {
          setCurrentOrder(res.data.find(o => o.status === 'DELIVERING') || res.data[0])
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [riderId])

  useEffect(() => {
    if (currentOrder) {
      gpsApi.getLatestGps(currentOrder.trackingNo).then(res => {
        if (res.success) {
          setLatestGps(res.data)
          setGpsSequence(res.data.sequence)
        }
      })
    }
  }, [currentOrder?.trackingNo])

  useEffect(() => {
    return () => {
      if (reportInterval) {
        clearInterval(reportInterval)
      }
    }
  }, [reportInterval])

  const startAutoReport = () => {
    if (!currentOrder) {
      message.warning('请先选择要配送的订单')
      return
    }
    setIsAutoReporting(true)
    message.success('开始自动上报GPS')

    const interval = setInterval(async () => {
      try {
        const nextSeq = gpsSequence + 1
        const res = await mockApi.reportMockGps({
          trackingNo: currentOrder.trackingNo,
          riderId: riderId,
          sequence: Math.min(nextSeq, 9)
        })
        if (res.success) {
          setLatestGps(res.data)
          setGpsSequence(res.data.sequence)
        }
      } catch (err) {
        console.error('GPS上报失败', err)
      }
    }, 3000)

    setReportInterval(interval)
  }

  const stopAutoReport = () => {
    if (reportInterval) {
      clearInterval(reportInterval)
      setReportInterval(null)
    }
    setIsAutoReporting(false)
    message.info('已停止GPS上报')
  }

  const initMockTrack = async () => {
    if (!currentOrder) return
    try {
      const res = await mockApi.initMockTrack({
        trackingNo: currentOrder.trackingNo,
        riderId: riderId,
        points: 5
      })
      if (res.success) {
        message.success(`已初始化 ${res.count} 个GPS点`)
        setGpsSequence(res.count - 1)
        fetchOrders()
      }
    } catch (err) {
      message.error('初始化失败')
    }
  }

  const handleStatusUpdate = async (status) => {
    if (!currentOrder) return
    try {
      const res = await orderApi.updateStatus(
        currentOrder.trackingNo, status, 'RIDER', riderId, '骑手操作'
      )
      if (res.success) {
        message.success(`状态已更新为: ${status}`)
        setCurrentOrder(res.data)
        fetchOrders()
      }
    } catch (err) {
      message.error('状态更新失败')
    }
  }

  const reportException = async (values) => {
    try {
      const data = {
        trackingNo: currentOrder.trackingNo,
        exceptionType: values.exceptionType,
        description: values.description,
        damageLevel: values.damageLevel,
        newAddress: values.newAddress
      }
      const res = await exceptionApi.createException(data)
      if (res.success) {
        message.success('异常已上报，等待审核')
        setExceptionModalVisible(false)
        exceptionForm.resetFields()
        fetchOrders()
        gpsApi.getLatestGps(currentOrder.trackingNo)
      }
    } catch (err) {
      message.error('上报失败')
    }
  }

  const statusColors = {
    PENDING: 'default',
    OUTBOUND: 'blue',
    LOADED: 'cyan',
    DELIVERING: 'orange',
    DELIVERED: 'green',
    EXCEPTION: 'red'
  }

  const statusLabels = {
    PENDING: '待处理',
    OUTBOUND: '待装车',
    LOADED: '待派送',
    DELIVERING: '派送中',
    DELIVERED: '已完成',
    EXCEPTION: '异常'
  }

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: '16px' }}>
        <Col span={6}>
          <Card>
            <Statistic 
              title="骑手" 
              value={riderName}
              prefix={<CarOutlined />}
            />
            <div style={{ marginTop: '8px' }}>
              <Select 
                value={riderId} 
                onChange={(val) => {
                  setRiderId(val)
                  setCurrentOrder(null)
                  setGpsSequence(0)
                }}
                style={{ width: '100%' }}
              >
                <Option value="RIDER001">RIDER001 - 王师傅</Option>
                <Option value="RIDER002">RIDER002 - 李师傅</Option>
                <Option value="RIDER003">RIDER003 - 张师傅</Option>
              </Select>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="今日订单" 
              value={orders.length}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="配送中" 
              value={orders.filter(o => o.status === 'DELIVERING').length}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="已完成" 
              value={orders.filter(o => o.status === 'DELIVERED').length}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Card title="我的订单" style={{ marginBottom: '16px' }}>
            <List
              dataSource={orders}
              renderItem={item => (
                <List.Item
                  key={item.id}
                  onClick={() => setCurrentOrder(item)}
                  style={{
                    cursor: 'pointer',
                    padding: '12px',
                    background: currentOrder?.id === item.id ? '#e6f7ff' : '#fff',
                    borderRadius: '4px',
                    marginBottom: '8px',
                    border: currentOrder?.id === item.id ? '1px solid #1890ff' : '1px solid #f0f0f0'
                  }}
                >
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 'bold' }}>{item.trackingNo}</span>
                      <Tag color={statusColors[item.status]}>{statusLabels[item.status]}</Tag>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
                      <EnvironmentOutlined /> {item.deliveryAddress}
                    </p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#999' }}>
                      {item.flowerType} × {item.quantity}
                    </p>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col span={16}>
          <Card 
            title={currentOrder ? `配送详情 - ${currentOrder.trackingNo}` : '请选择订单'}
            extra={
              currentOrder && currentOrder.status === 'DELIVERING' && (
                <Button 
                  type="danger" 
                  icon={<ExclamationCircleOutlined />}
                  onClick={() => setExceptionModalVisible(true)}
                >
                  上报异常
                </Button>
              )
            }
          >
            {currentOrder ? (
              <div>
                <Row gutter={16} style={{ marginBottom: '16px' }}>
                  <Col span={12}>
                    <p><strong>收件人：</strong>{currentOrder.recipientName}</p>
                    <p><strong>电话：</strong>{currentOrder.recipientPhone}</p>
                    <p><strong>地址：</strong>{currentOrder.deliveryAddress}</p>
                  </Col>
                  <Col span={12}>
                    <p><strong>商品：</strong>{currentOrder.flowerType} × {currentOrder.quantity}</p>
                    <p><strong>状态：</strong>
                      <Tag color={statusColors[currentOrder.status]}>
                        {statusLabels[currentOrder.status]}
                      </Tag>
                    </p>
                    {latestGps && (
                      <p><strong>GPS序号：</strong>{latestGps.sequence} / 10</p>
                    )}
                  </Col>
                </Row>

                <Divider />

                <div style={{ marginBottom: '16px' }}>
                  <h4>GPS 上报</h4>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <Button 
                      type="primary" 
                      icon={<PlayCircleOutlined />}
                      onClick={startAutoReport}
                      disabled={isAutoReporting || currentOrder.status !== 'DELIVERING'}
                    >
                      开始自动上报
                    </Button>
                    <Button 
                      icon={<PauseCircleOutlined />}
                      onClick={stopAutoReport}
                      disabled={!isAutoReporting}
                    >
                      停止上报
                    </Button>
                    <Button onClick={initMockTrack}>
                      初始化模拟轨迹
                    </Button>
                  </div>
                  {latestGps && (
                    <div style={{ marginTop: '12px', padding: '12px', background: '#f6ffed', borderRadius: '4px' }}>
                      <p style={{ margin: 0 }}>
                        <strong>最新位置：</strong>
                        纬度 {latestGps.latitude?.toFixed(6)}, 
                        经度 {latestGps.longitude?.toFixed(6)}
                      </p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>
                        速度: {latestGps.speed?.toFixed(1) || 0} km/h · 
                        上报时间: {dayjs(latestGps.reportTime).format('HH:mm:ss')}
                      </p>
                    </div>
                  )}
                </div>

                <Divider />

                <div>
                  <h4>状态操作</h4>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {currentOrder.status === 'OUTBOUND' && (
                      <Button type="primary" onClick={() => handleStatusUpdate('LOADED')}>
                        确认冷链装车
                      </Button>
                    )}
                    {currentOrder.status === 'LOADED' && (
                      <Button type="primary" onClick={() => handleStatusUpdate('DELIVERING')}>
                        开始派送
                      </Button>
                    )}
                    {currentOrder.status === 'DELIVERING' && (
                      <Button type="primary" onClick={() => handleStatusUpdate('DELIVERED')}>
                        确认签收
                      </Button>
                    )}
                    {currentOrder.status === 'DELIVERED' && (
                      <Tag color="green">订单已完成</Tag>
                    )}
                    {currentOrder.status === 'EXCEPTION' && (
                      <Tag color="red">订单异常，等待审核</Tag>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
                请从左侧选择一个订单查看详情
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title="上报异常"
        open={exceptionModalVisible}
        onCancel={() => setExceptionModalVisible(false)}
        onOk={() => exceptionForm.submit()}
        okText="提交"
        cancelText="取消"
      >
        <Form form={exceptionForm} layout="vertical" onFinish={reportException}>
          <Form.Item
            name="exceptionType"
            label="异常类型"
            rules={[{ required: true, message: '请选择异常类型' }]}
          >
            <Radio.Group>
              <Radio value="PETAL_DAMAGE">花瓣损伤</Radio>
              <Radio value="ADDRESS_CHANGE">收件人改址</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.exceptionType !== curr.exceptionType}>
            {({ getFieldValue }) => {
              const type = getFieldValue('exceptionType')
              if (type === 'PETAL_DAMAGE') {
                return (
                  <>
                    <Form.Item
                      name="damageLevel"
                      label="损伤程度"
                      rules={[{ required: true, message: '请选择损伤程度' }]}
                    >
                      <Select placeholder="请选择">
                        <Option value="轻微">轻微（1-2朵受损）</Option>
                        <Option value="中度">中度（3-5朵受损）</Option>
                        <Option value="严重">严重（整束受损）</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item
                      name="description"
                      label="异常描述"
                      rules={[{ required: true, message: '请描述异常情况' }]}
                    >
                      <TextArea rows={3} placeholder="请详细描述花瓣损伤情况" />
                    </Form.Item>
                  </>
                )
              }
              if (type === 'ADDRESS_CHANGE') {
                return (
                  <>
                    <Form.Item
                      name="newAddress"
                      label="新配送地址"
                      rules={[{ required: true, message: '请输入新地址' }]}
                    >
                      <TextArea rows={3} placeholder="请输入新的配送地址" />
                    </Form.Item>
                    <Form.Item
                      name="description"
                      label="备注说明"
                    >
                      <TextArea rows={2} placeholder="选填，补充说明" />
                    </Form.Item>
                  </>
                )
              }
              return null
            }}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default RiderPage
