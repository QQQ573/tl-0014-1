import React, { useState, useEffect } from 'react'
import {
  Card, Table, Tag, Button, Modal, Form, Input, Select,
  InputNumber, Tabs, message, Space, Descriptions, Row, Col,
  Statistic, Badge
} from 'antd'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  AlertOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { exceptionApi, orderApi } from '../services/api'

const { TextArea } = Input
const { TabPane } = Tabs
const { Option } = Select

const ReviewPage = () => {
  const [pendingList, setPendingList] = useState([])
  const [approvedList, setApprovedList] = useState([])
  const [resolvedList, setResolvedList] = useState([])
  const [loading, setLoading] = useState(false)
  const [detailModal, setDetailModal] = useState(false)
  const [reviewModal, setReviewModal] = useState(false)
  const [currentException, setCurrentException] = useState(null)
  const [currentOrder, setCurrentOrder] = useState(null)
  const [reviewForm] = Form.useForm()
  const [reviewerId, setReviewerId] = useState('FLORIST001')
  const [reviewerName, setReviewerName] = useState('李花艺师')

  const fetchPending = async () => {
    try {
      const res = await exceptionApi.getPendingExceptions()
      if (res.success) {
        setPendingList(res.data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchApproved = async () => {
    try {
      const res = await exceptionApi.getExceptionsByStatus('APPROVED')
      if (res.success) {
        setApprovedList(res.data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchResolved = async () => {
    try {
      const res = await exceptionApi.getExceptionsByStatus('RESOLVED')
      if (res.success) {
        setResolvedList(res.data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchAll = () => {
    setLoading(true)
    Promise.all([fetchPending(), fetchApproved(), fetchResolved()])
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const viewDetail = async (exception) => {
    setCurrentException(exception)
    try {
      const orderRes = await orderApi.getOrderByTrackingNo(exception.trackingNo)
      if (orderRes.success) {
        setCurrentOrder(orderRes.data)
      }
    } catch (err) {
      console.error(err)
    }
    setDetailModal(true)
  }

  const openReview = (exception) => {
    setCurrentException(exception)
    reviewForm.resetFields()
    setReviewModal(true)
  }

  const handleReview = async (values) => {
    try {
      const data = {
        reviewerId,
        reviewerName,
        approved: values.approved,
        reviewComment: values.reviewComment,
        resolutionType: values.resolutionType,
        refundAmount: values.refundAmount
      }
      const res = await exceptionApi.reviewException(currentException.id, data)
      if (res.success) {
        message.success('审核完成')
        setReviewModal(false)
        fetchAll()
      }
    } catch (err) {
      message.error('审核失败')
      console.error(err)
    }
  }

  const exceptionTypeConfig = {
    PETAL_DAMAGE: { label: '花瓣损伤', color: 'orange' },
    ADDRESS_CHANGE: { label: '地址变更', color: 'blue' },
    SENSITIVE_WORD: { label: '敏感词', color: 'red' }
  }

  const statusConfig = {
    PENDING_REVIEW: { label: '待审核', color: 'orange' },
    UNDER_REVIEW: { label: '审核中', color: 'blue' },
    APPROVED: { label: '已通过', color: 'green' },
    REJECTED: { label: '已驳回', color: 'red' },
    RESOLVED: { label: '已处理', color: 'purple' }
  }

  const columns = [
    {
      title: '工单ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '运单号',
      dataIndex: 'trackingNo',
      key: 'trackingNo',
      width: 140
    },
    {
      title: '异常类型',
      dataIndex: 'exceptionType',
      key: 'exceptionType',
      width: 100,
      render: (type) => (
        <Tag color={exceptionTypeConfig[type]?.color || 'default'}>
          {exceptionTypeConfig[type]?.label || type}
        </Tag>
      )
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
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 160,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => viewDetail(record)}>
            详情
          </Button>
          {record.status === 'PENDING_REVIEW' && (
            <Button 
              size="small" 
              type="primary" 
              icon={<AlertOutlined />}
              onClick={() => openReview(record)}
            >
              审核
            </Button>
          )}
        </Space>
      )
    }
  ]

  const stats = [
    { title: '待审核', value: pendingList.length, color: '#fa8c16' },
    { title: '已通过', value: approvedList.length, color: '#52c41a' },
    { title: '已处理', value: resolvedList.length, color: '#722ed1' }
  ]

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: '16px' }}>
        {stats.map((stat, idx) => (
          <Col span={8} key={idx}>
            <Card>
              <Statistic
                title={stat.title}
                value={stat.value}
                valueStyle={{ color: stat.color }}
                prefix={<Badge color={stat.color} />}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Card>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <span style={{ marginRight: '12px' }}>审核人:</span>
            <Select
              value={reviewerId}
              onChange={(val, opt) => {
                setReviewerId(val)
                setReviewerName(opt.children)
              }}
              style={{ width: 200 }}
            >
              <Option value="FLORIST001">李花艺师</Option>
              <Option value="FLORIST002">王花艺师</Option>
              <Option value="FLORIST003">张花艺师</Option>
            </Select>
          </div>
          <Button onClick={fetchAll}>刷新</Button>
        </div>

        <Tabs defaultActiveKey="pending">
          <TabPane tab={`待审核 (${pendingList.length})`} key="pending">
            <Table
              columns={columns}
              dataSource={pendingList}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
          <TabPane tab={`已通过 (${approvedList.length})`} key="approved">
            <Table
              columns={columns}
              dataSource={approvedList}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
          <TabPane tab={`已处理 (${resolvedList.length})`} key="resolved">
            <Table
              columns={columns}
              dataSource={resolvedList}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title="异常工单详情"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModal(false)}>
            关闭
          </Button>
        ]}
        width={700}
      >
        {currentException && (
          <div>
            <Descriptions column={2} size="small" style={{ marginBottom: '16px' }}>
              <Descriptions.Item label="工单ID">{currentException.id}</Descriptions.Item>
              <Descriptions.Item label="运单号">{currentException.trackingNo}</Descriptions.Item>
              <Descriptions.Item label="异常类型">
                <Tag color={exceptionTypeConfig[currentException.exceptionType]?.color}>
                  {exceptionTypeConfig[currentException.exceptionType]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusConfig[currentException.status]?.color}>
                  {statusConfig[currentException.status]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间" span={2}>
                {dayjs(currentException.createTime).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>

            {currentException.description && (
              <div style={{ marginBottom: '12px' }}>
                <p><strong>异常描述：</strong></p>
                <p style={{ padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
                  {currentException.description}
                </p>
              </div>
            )}

            {currentException.damageLevel && (
              <p><strong>损伤程度：</strong>{currentException.damageLevel}</p>
            )}

            {currentException.newAddress && (
              <p><strong>新地址：</strong>{currentException.newAddress}</p>
            )}

            {currentException.sensitiveWordHit && (
              <p>
                <strong>命中敏感词：</strong>
                <Tag color="red">{currentException.sensitiveWordHit}</Tag>
              </p>
            )}

            {currentException.reviewerName && (
              <>
                <hr style={{ margin: '12px 0' }} />
                <p><strong>审核人：</strong>{currentException.reviewerName}</p>
                <p><strong>审核意见：</strong>{currentException.reviewComment}</p>
                {currentException.resolutionType && (
                  <p><strong>处理方式：</strong>{currentException.resolutionType}</p>
                )}
                {currentException.refundAmount && (
                  <p><strong>退款金额：</strong>¥{currentException.refundAmount}</p>
                )}
                {currentException.reissueTrackingNo && (
                  <p><strong>补发运单号：</strong>{currentException.reissueTrackingNo}</p>
                )}
              </>
            )}

            {currentOrder && (
              <>
                <hr style={{ margin: '16px 0' }} />
                <h4>关联订单信息</h4>
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="商品">{currentOrder.flowerType} × {currentOrder.quantity}</Descriptions.Item>
                  <Descriptions.Item label="金额">¥{currentOrder.amount}</Descriptions.Item>
                  <Descriptions.Item label="收件人">{currentOrder.recipientName}</Descriptions.Item>
                  <Descriptions.Item label="电话">{currentOrder.recipientPhone}</Descriptions.Item>
                  <Descriptions.Item label="地址" span={2}>{currentOrder.deliveryAddress}</Descriptions.Item>
                  {currentOrder.cardMessage && (
                    <Descriptions.Item label="贺卡留言" span={2}>
                      <span style={{ color: 'red' }}>{currentOrder.cardMessage}</span>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="审核异常工单"
        open={reviewModal}
        onCancel={() => setReviewModal(false)}
        onOk={() => reviewForm.submit()}
        okText="提交审核"
        width={600}
      >
        {currentException && (
          <div>
            <p style={{ marginBottom: '16px' }}>
              <strong>运单号：</strong>{currentException.trackingNo}
              <Tag 
                color={exceptionTypeConfig[currentException.exceptionType]?.color}
                style={{ marginLeft: '12px' }}
              >
                {exceptionTypeConfig[currentException.exceptionType]?.label}
              </Tag>
            </p>

            <Form form={reviewForm} layout="vertical" onFinish={handleReview}>
              <Form.Item
                name="approved"
                label="审核结果"
                rules={[{ required: true, message: '请选择审核结果' }]}
              >
                <Select placeholder="请选择">
                  <Option value={true}>
                    <CheckCircleOutlined style={{ color: '#52c41a' }} /> 审核通过
                  </Option>
                  <Option value={false}>
                    <CloseCircleOutlined style={{ color: '#ff4d4f' }} /> 驳回
                  </Option>
                </Select>
              </Form.Item>

              <Form.Item noStyle shouldUpdate>
                {({ getFieldValue }) => {
                  const approved = getFieldValue('approved')
                  if (approved === true) {
                    return (
                      <Form.Item
                        name="resolutionType"
                        label="处理方式"
                        rules={[{ required: true, message: '请选择处理方式' }]}
                      >
                        <Select placeholder="请选择处理方式">
                          <Option value="REISSUE">补发新束</Option>
                          <Option value="PARTIAL_REFUND">部分退款</Option>
                          <Option value="FULL_REFUND">全额退款</Option>
                          <Option value="NONE">无需处理</Option>
                        </Select>
                      </Form.Item>
                    )
                  }
                  return null
                }}
              </Form.Item>

              <Form.Item noStyle shouldUpdate>
                {({ getFieldValue }) => {
                  const resolution = getFieldValue('resolutionType')
                  if (resolution === 'PARTIAL_REFUND') {
                    return (
                      <Form.Item
                        name="refundAmount"
                        label="退款金额 (元)"
                        rules={[{ required: true, message: '请输入退款金额' }]}
                      >
                        <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="请输入退款金额" />
                      </Form.Item>
                    )
                  }
                  return null
                }}
              </Form.Item>

              <Form.Item
                name="reviewComment"
                label="审核意见"
                rules={[{ required: true, message: '请输入审核意见' }]}
              >
                <TextArea rows={3} placeholder="请输入审核意见..." />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default ReviewPage
