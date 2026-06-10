import React, { useState, useEffect } from 'react'
import {
  Card, Table, Tag, Button, Modal, Form, Select, Input,
  Tabs, message, Space, Descriptions, Row, Col, Statistic,
  Badge, Popconfirm
} from 'antd'
import {
  GiftOutlined,
  TruckOutlined,
  CheckCircleOutlined,
  UserOutlined,
  SearchOutlined,
  SyncOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { orderApi } from '../services/api'

const { TabPane } = Tabs
const { Option } = Select
const { Search } = Input

const statusConfig = {
  PENDING: { label: '待出库', color: 'default', icon: GiftOutlined },
  OUTBOUND: { label: '已出库', color: 'blue', icon: GiftOutlined },
  LOADED: { label: '已装车', color: 'cyan', icon: TruckOutlined },
  DELIVERING: { label: '派送中', color: 'orange', icon: TruckOutlined },
  DELIVERED: { label: '已签收', color: 'green', icon: CheckCircleOutlined },
  EXCEPTION: { label: '异常', color: 'red', icon: GiftOutlined },
}

const AdminPage = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [searchText, setSearchText] = useState('')
  const [detailModal, setDetailModal] = useState(false)
  const [currentOrder, setCurrentOrder] = useState(null)
  const [assignModal, setAssignModal] = useState(false)
  const [assignForm] = Form.useForm()
  const [statusLogs, setStatusLogs] = useState([])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      let res
      if (activeTab === 'all') {
        res = await orderApi.getAllOrders()
      } else {
        res = await orderApi.getOrdersByStatus(activeTab)
      }
      if (res.success) {
        let list = res.data || []
        if (searchText) {
          list = list.filter(o =>
            o.trackingNo.toLowerCase().includes(searchText.toLowerCase()) ||
            o.orderNo.toLowerCase().includes(searchText.toLowerCase()) ||
            o.recipientName.includes(searchText)
          )
        }
        list.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
        setOrders(list)
      }
    } catch (err) {
      message.error('获取订单列表失败')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [activeTab])

  const handleSearch = (value) => {
    setSearchText(value)
    fetchOrders()
  }

  const viewDetail = async (order) => {
    setCurrentOrder(order)
    try {
      const logRes = await orderApi.getStatusLogs(order.trackingNo)
      if (logRes.success) {
        setStatusLogs(logRes.data)
      }
    } catch (err) {
      console.error(err)
    }
    setDetailModal(true)
  }

  const handleOutbound = async (order) => {
    try {
      const res = await orderApi.updateStatus(
        order.trackingNo, 'OUTBOUND', 'ADMIN', 'ADMIN001', '花店确认出库'
      )
      if (res.success) {
        message.success('已确认出库')
        fetchOrders()
      }
    } catch (err) {
      message.error('操作失败')
      console.error(err)
    }
  }

  const handleLoad = async (order) => {
    try {
      const res = await orderApi.updateStatus(
        order.trackingNo, 'LOADED', 'ADMIN', 'ADMIN001', '冷链装车完成'
      )
      if (res.success) {
        message.success('已完成冷链装车')
        fetchOrders()
      }
    } catch (err) {
      message.error('操作失败')
      console.error(err)
    }
  }

  const openAssignModal = (order) => {
    setCurrentOrder(order)
    assignForm.resetFields()
    setAssignModal(true)
  }

  const handleAssign = async (values) => {
    try {
      const riderName = values.riderId === 'RIDER001' ? '王师傅'
        : values.riderId === 'RIDER002' ? '李师傅' : '张师傅'
      const res = await orderApi.assignRider(
        currentOrder.trackingNo, values.riderId, riderName
      )
      if (res.success) {
        message.success('骑手分配成功')
        setAssignModal(false)
        fetchOrders()
      }
    } catch (err) {
      message.error('分配失败')
      console.error(err)
    }
  }

  const handleStartDelivering = async (order) => {
    if (!order.riderId) {
      message.warning('请先分配骑手')
      return
    }
    try {
      const res = await orderApi.updateStatus(
        order.trackingNo, 'DELIVERING', 'ADMIN', 'ADMIN001', '骑手开始派送'
      )
      if (res.success) {
        message.success('已开始派送')
        fetchOrders()
      }
    } catch (err) {
      message.error('操作失败')
      console.error(err)
    }
  }

  const getStats = () => {
    const all = orders.length
    const pending = orders.filter(o => o.status === 'PENDING').length
    const delivering = orders.filter(o => o.status === 'DELIVERING').length
    const delivered = orders.filter(o => o.status === 'DELIVERED').length
    return { all, pending, delivering, delivered }
  }

  const stats = getStats()

  const columns = [
    {
      title: '运单号',
      dataIndex: 'trackingNo',
      key: 'trackingNo',
      width: 140,
      render: (text) => <Tag color="blue" style={{ fontFamily: 'monospace' }}>{text}</Tag>,
    },
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 180,
      ellipsis: true,
    },
    {
      title: '收件人',
      dataIndex: 'recipientName',
      key: 'recipientName',
      width: 100,
    },
    {
      title: '商品',
      key: 'flower',
      width: 120,
      render: (_, record) => (
        <span>{record.flowerType} × {record.quantity}</span>
      ),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (val) => <span>¥{val}</span>,
    },
    {
      title: '配送地址',
      dataIndex: 'deliveryAddress',
      key: 'deliveryAddress',
      ellipsis: true,
    },
    {
      title: '骑手',
      dataIndex: 'riderName',
      key: 'riderName',
      width: 100,
      render: (val) => val || <Tag color="default">待分配</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={statusConfig[status]?.color || 'default'}>
          {statusConfig[status]?.label || status}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 160,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button size="small" onClick={() => viewDetail(record)}>
            详情
          </Button>
          {record.status === 'PENDING' && (
            <Button
              size="small"
              type="primary"
              onClick={() => handleOutbound(record)}
            >
              确认出库
            </Button>
          )}
          {record.status === 'OUTBOUND' && (
            <Button
              size="small"
              type="primary"
              onClick={() => handleLoad(record)}
            >
              确认装车
            </Button>
          )}
          {record.status === 'LOADED' && !record.riderId && (
            <Button
              size="small"
              type="primary"
              onClick={() => openAssignModal(record)}
            >
              分配骑手
            </Button>
          )}
          {record.status === 'LOADED' && record.riderId && (
            <Button
              size="small"
              type="primary"
              onClick={() => handleStartDelivering(record)}
            >
              开始派送
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: '16px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="全部订单"
              value={stats.all}
              valueStyle={{ color: '#1890ff' }}
              prefix={<Badge color="#1890ff" />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待出库"
              value={stats.pending}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<Badge color="#fa8c16" />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="派送中"
              value={stats.delivering}
              valueStyle={{ color: '#1890ff' }}
              prefix={<Badge color="#1890ff" />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已签收"
              value={stats.delivered}
              valueStyle={{ color: '#52c41a' }}
              prefix={<Badge color="#52c41a" />}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
          <Search
            placeholder="搜索运单号/订单号/收件人"
            allowClear
            enterButton={<SearchOutlined />}
            size="middle"
            style={{ width: 320 }}
            onSearch={handleSearch}
            onChange={(e) => !e.target.value && handleSearch('')}
          />
          <Button icon={<SyncOutlined />} onClick={fetchOrders}>
            刷新
          </Button>
        </div>

        <Tabs defaultActiveKey="all" activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="全部" key="all" />
          <TabPane tab={`待出库 (${stats.pending})`} key="PENDING" />
          <TabPane tab="已出库" key="OUTBOUND" />
          <TabPane tab="已装车" key="LOADED" />
          <TabPane tab={`派送中 (${stats.delivering})`} key="DELIVERING" />
          <TabPane tab={`已签收 (${stats.delivered})`} key="DELIVERED" />
          <TabPane tab="异常" key="EXCEPTION" />
        </Tabs>

        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title="订单详情"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModal(false)}>
            关闭
          </Button>
        ]}
        width={700}
      >
        {currentOrder && (
          <div>
            <Descriptions column={2} size="small" style={{ marginBottom: '16px' }}>
              <Descriptions.Item label="运单号">
                <Tag color="blue">{currentOrder.trackingNo}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="订单号">{currentOrder.orderNo}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusConfig[currentOrder.status]?.color}>
                  {statusConfig[currentOrder.status]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(currentOrder.createTime).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="商品">
                {currentOrder.flowerType} × {currentOrder.quantity}
              </Descriptions.Item>
              <Descriptions.Item label="金额">¥{currentOrder.amount}</Descriptions.Item>
              <Descriptions.Item label="收件人">{currentOrder.recipientName}</Descriptions.Item>
              <Descriptions.Item label="电话">{currentOrder.recipientPhone}</Descriptions.Item>
              <Descriptions.Item label="配送地址" span={2}>
                {currentOrder.deliveryAddress}
              </Descriptions.Item>
              <Descriptions.Item label="骑手">
                {currentOrder.riderName || '待分配'}
                {currentOrder.riderId && ` (${currentOrder.riderId})`}
              </Descriptions.Item>
              <Descriptions.Item label="是否异常">
                {currentOrder.isException ? (
                  <Tag color="red">是 - {currentOrder.exceptionType}</Tag>
                ) : (
                  <Tag color="green">否</Tag>
                )}
              </Descriptions.Item>
              {currentOrder.cardMessage && (
                <Descriptions.Item label="贺卡留言" span={2}>
                  {currentOrder.cardMessage}
                </Descriptions.Item>
              )}
            </Descriptions>

            <h4 style={{ marginBottom: '12px' }}>状态流转日志</h4>
            <div style={{ maxHeight: 200, overflowY: 'auto', padding: '8px', background: '#fafafa', borderRadius: '4px' }}>
              {statusLogs.map((log, idx) => (
                <div key={idx} style={{ display: 'flex', marginBottom: '8px', fontSize: '13px' }}>
                  <span style={{ width: 150, color: '#999' }}>
                    {dayjs(log.createTime).format('MM-DD HH:mm:ss')}
                  </span>
                  <span style={{ width: 100 }}>
                    {log.operatorType === 'SYSTEM' ? '系统' : log.operatorType === 'RIDER' ? '骑手' : '管理员'}
                  </span>
                  <Tag color="blue" style={{ marginRight: '8px' }}>
                    {log.toStatus}
                  </Tag>
                  <span style={{ color: '#666' }}>{log.remark}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="分配骑手"
        open={assignModal}
        onCancel={() => setAssignModal(false)}
        onOk={() => assignForm.submit()}
        okText="确认分配"
      >
        {currentOrder && (
          <div>
            <p style={{ marginBottom: '16px' }}>
              <strong>运单号：</strong>
              <Tag color="blue">{currentOrder.trackingNo}</Tag>
            </p>
            <Form form={assignForm} layout="vertical" onFinish={handleAssign}>
              <Form.Item
                name="riderId"
                label="选择骑手"
                rules={[{ required: true, message: '请选择骑手' }]}
              >
                <Select placeholder="请选择骑手">
                  <Option value="RIDER001">RIDER001 - 王师傅</Option>
                  <Option value="RIDER002">RIDER002 - 李师傅</Option>
                  <Option value="RIDER003">RIDER003 - 张师傅</Option>
                </Select>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default AdminPage
