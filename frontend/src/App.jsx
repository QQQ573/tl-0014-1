import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import { Layout, Menu, ConfigProvider, theme } from 'antd'
import { 
  TruckOutlined, 
  UserOutlined, 
  AuditOutlined,
  ShoppingOutlined,
  SettingOutlined
} from '@ant-design/icons'
import CustomerPage from './pages/CustomerPage'
import RiderPage from './pages/RiderPage'
import ReviewPage from './pages/ReviewPage'
import OrderCreatePage from './pages/OrderCreatePage'
import AdminPage from './pages/AdminPage'
import 'antd/dist/reset.css'
import './index.css'

const { Header, Content, Sider } = Layout

function App() {
  const menuItems = [
    {
      key: '/customer',
      icon: <UserOutlined />,
      label: <Link to="/customer">顾客端 - 配送追踪</Link>,
    },
    {
      key: '/rider',
      icon: <TruckOutlined />,
      label: <Link to="/rider">骑手端 - GPS上报</Link>,
    },
    {
      key: '/admin',
      icon: <SettingOutlined />,
      label: <Link to="/admin">管理后台 - 订单管理</Link>,
    },
    {
      key: '/review',
      icon: <AuditOutlined />,
      label: <Link to="/review">审核后台 - 异常工单</Link>,
    },
    {
      key: '/order-create',
      icon: <ShoppingOutlined />,
      label: <Link to="/order-create">下单页面</Link>,
    },
  ]

  return (
    <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm }}>
      <BrowserRouter>
        <Layout style={{ minHeight: '100vh' }}>
          <Header style={{ 
            background: 'linear-gradient(90deg, #ff6b9d 0%, #c44569 100%)',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center'
          }}>
            <div style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', marginRight: '40px' }}>
              🌹 情人节鲜花配送可视化后台
            </div>
          </Header>
          <Layout>
            <Sider width={200} style={{ background: '#fff' }}>
              <Menu
                mode="inline"
                defaultSelectedKeys={['/customer']}
                items={menuItems}
                style={{ height: '100%', borderRight: 0 }}
              />
            </Sider>
            <Layout style={{ padding: '24px' }}>
              <Content
                style={{
                  padding: 24,
                  margin: 0,
                  minHeight: 280,
                  background: '#fff',
                  borderRadius: '8px'
                }}
              >
                <Routes>
                  <Route path="/" element={<Navigate to="/customer" replace />} />
                  <Route path="/customer" element={<CustomerPage />} />
                  <Route path="/rider" element={<RiderPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/review" element={<ReviewPage />} />
                  <Route path="/order-create" element={<OrderCreatePage />} />
                </Routes>
              </Content>
            </Layout>
          </Layout>
        </Layout>
      </BrowserRouter>
    </ConfigProvider>
  )
}

export default App
