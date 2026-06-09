import React, { useState } from 'react'
import {
  Card, Form, Input, InputNumber, Select, Button, Row, Col,
  message, Result, Descriptions, Tag
} from 'antd'
import { ShoppingOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { orderApi, sensitiveWordApi } from '../services/api'

const { Option } = Select
const { TextArea } = Input

const OrderCreatePage = () => {
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const [createdOrder, setCreatedOrder] = useState(null)
  const [hasSensitive, setHasSensitive] = useState(false)
  const [hitWords, setHitWords] = useState([])

  const flowerTypes = [
    { name: '红玫瑰', price: 299 },
    { name: '粉玫瑰', price: 259 },
    { name: '白玫瑰', price: 279 },
    { name: '百合花束', price: 399 },
    { name: '向日葵花束', price: 199 },
    { name: '郁金香', price: 359 },
    { name: '康乃馨', price: 189 },
    { name: '混合花束', price: 499 }
  ]

  const checkSensitive = async (text) => {
    if (!text || text.length < 2) {
      setHasSensitive(false)
      setHitWords([])
      return
    }
    try {
      const res = await sensitiveWordApi.check(text)
      if (res.success) {
        setHasSensitive(res.hasSensitive)
        setHitWords(res.data || [])
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleSubmit = async (values) => {
    setSubmitting(true)
    try {
      const selectedFlower = flowerTypes.find(f => f.name === values.flowerType)
      const amount = selectedFlower ? selectedFlower.price * values.quantity : 0

      const orderData = {
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        recipientName: values.recipientName,
        recipientPhone: values.recipientPhone,
        deliveryAddress: values.deliveryAddress,
        latitude: 39.9350 + Math.random() * 0.02,
        longitude: 116.4430 + Math.random() * 0.02,
        flowerType: values.flowerType,
        quantity: values.quantity,
        amount: amount,
        cardMessage: values.cardMessage,
        riderId: values.riderId,
        riderName: values.riderId === 'RIDER001' ? '王师傅' : values.riderId === 'RIDER002' ? '李师傅' : '张师傅'
      }

      const res = await orderApi.createOrder(orderData)
      if (res.success) {
        setCreatedOrder(res.data)
        message.success('订单创建成功！')
      }
    } catch (err) {
      message.error('订单创建失败')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    form.resetFields()
    setCreatedOrder(null)
    setHasSensitive(false)
    setHitWords([])
  }

  if (createdOrder) {
    return (
      <Card>
        <Result
          status="success"
          title="订单创建成功！"
          subTitle="运单已生成，请将运单号告知顾客以便查询配送进度"
          icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
          extra={[
            <Button type="primary" key="create" onClick={resetForm}>
              继续下单
            </Button>
          ]}
        />
        <Card title="订单信息" size="small" style={{ maxWidth: 600, margin: '0 auto' }}>
          <Descriptions column={2} size="small">
            <Descriptions.Item label="订单号">{createdOrder.orderNo}</Descriptions.Item>
            <Descriptions.Item label="运单号">
              <Tag color="blue">{createdOrder.trackingNo}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="商品">{createdOrder.flowerType} × {createdOrder.quantity}</Descriptions.Item>
            <Descriptions.Item label="金额">¥{createdOrder.amount}</Descriptions.Item>
            <Descriptions.Item label="收件人">{createdOrder.recipientName}</Descriptions.Item>
            <Descriptions.Item label="电话">{createdOrder.recipientPhone}</Descriptions.Item>
            <Descriptions.Item label="地址" span={2}>{createdOrder.deliveryAddress}</Descriptions.Item>
            <Descriptions.Item label="骑手">{createdOrder.riderName}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color="default">待出库</Tag>
              {createdOrder.isException && (
                <Tag color="red" style={{ marginLeft: '8px' }}>异常</Tag>
              )}
            </Descriptions.Item>
            {createdOrder.isException && (
              <Descriptions.Item label="异常原因" span={2}>
                <Tag color="red">{createdOrder.exceptionType}</Tag>
                {createdOrder.exceptionType === 'SENSITIVE_WORD' && (
                  <span style={{ color: '#ff4d4f', marginLeft: '8px' }}>
                    贺卡留言命中敏感词，已进入人工审核队列
                  </span>
                )}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      </Card>
    )
  }

  return (
    <div>
      <Card 
        title={
          <span>
            <ShoppingOutlined style={{ marginRight: '8px' }}>
            </ShoppingOutlined>
            创建鲜花订单
          </span>
        }
        style={{ maxWidth: 800, margin: '0 auto' }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            flowerType: '红玫瑰',
            quantity: 11,
            riderId: 'RIDER001'
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="customerName"
                label="客户姓名"
                rules={[{ required: true, message: '请输入客户姓名' }]}
              >
                <Input placeholder="请输入客户姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="customerPhone"
                label="客户电话"
                rules={[{ required: true, message: '请输入客户电话' }]}
              >
                <Input placeholder="请输入客户电话" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="recipientName"
                label="收件人姓名"
                rules={[{ required: true, message: '请输入收件人姓名' }]}
              >
                <Input placeholder="请输入收件人姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="recipientPhone"
                label="收件人电话"
                rules={[{ required: true, message: '请输入收件人电话' }]}
              >
                <Input placeholder="请输入收件人电话" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="deliveryAddress"
            label="配送地址"
            rules={[{ required: true, message: '请输入配送地址' }]}
          >
            <TextArea rows={2} placeholder="请输入详细配送地址" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="flowerType"
                label="鲜花类型"
                rules={[{ required: true, message: '请选择鲜花类型' }]}
              >
                <Select placeholder="请选择">
                  {flowerTypes.map(flower => (
                    <Option key={flower.name} value={flower.name}>
                      {flower.name} - ¥{flower.price}/束
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="quantity"
                label="数量（束）"
                rules={[{ required: true, message: '请输入数量' }]}
              >
                <InputNumber min={1} max={99} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="cardMessage"
            label="贺卡留言"
            help={hasSensitive ? (
              <span style={{ color: '#ff4d4f' }}>
                ⚠️ 检测到敏感词：{hitWords.join('、')}，订单将进入人工审核
              </span>
            ) : '温馨提示：留言内容将经过敏感词检测'}
          >
            <TextArea 
              rows={3} 
              placeholder="请输入贺卡留言（可选）"
              onChange={(e) => checkSensitive(e.target.value)}
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item
            name="riderId"
            label="分配骑手"
            rules={[{ required: true, message: '请选择骑手' }]}
          >
            <Select placeholder="请选择骑手">
              <Option value="RIDER001">RIDER001 - 王师傅</Option>
              <Option value="RIDER002">RIDER002 - 李师傅</Option>
              <Option value="RIDER003">RIDER003 - 张师傅</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting} block size="large">
              创建订单
            </Button>
          </Form.Item>
        </Form>

        <Card title="📋 测试用运单号（可直接查询）" size="small" style={{ marginTop: '16px' }}>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li><code>FD0214ABCD12</code> - 正常配送中订单（有GPS轨迹）</li>
            <li><code>FD0214CDEF34</code> - 刚出库订单</li>
            <li><code>FD0214EFGH56</code> - 敏感词异常订单</li>
          </ul>
        </Card>
      </Card>
    </div>
  )
}

export default OrderCreatePage
