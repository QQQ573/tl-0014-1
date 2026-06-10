import axios from 'axios'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

request.interceptors.response.use(
  response => response.data,
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

export const orderApi = {
  createOrder: (data) => request.post('/orders', data),
  getAllOrders: () => request.get('/orders'),
  getOrdersByStatus: (status) => request.get(`/orders/status/${status}`),
  getOrderByTrackingNo: (trackingNo) => request.get(`/orders/tracking/${trackingNo}`),
  getOrderByOrderNo: (orderNo) => request.get(`/orders/orderNo/${orderNo}`),
  updateStatus: (trackingNo, status, operatorType, operatorId, remark) => 
    request.put(`/orders/${trackingNo}/status`, null, {
      params: { status, operatorType, operatorId, remark }
    }),
  getStatusLogs: (trackingNo) => request.get(`/orders/${trackingNo}/logs`),
  assignRider: (trackingNo, riderId, riderName) =>
    request.put(`/orders/${trackingNo}/assign-rider`, null, {
      params: { riderId, riderName }
    }),
  getOrdersByRider: (riderId) => request.get(`/orders/rider/${riderId}`),
  getSignStatus: (trackingNo) => request.get(`/orders/${trackingNo}/sign-status`),
  signOrder: (trackingNo, data) => request.post(`/orders/${trackingNo}/sign`, data),
}

export const gpsApi = {
  reportGps: (data) => request.post('/gps/report', data),
  getLatestGps: (trackingNo) => request.get(`/gps/latest/${trackingNo}`),
  getGpsTrack: (trackingNo) => request.get(`/gps/track/${trackingNo}`),
}

export const mockApi = {
  initMockTrack: (data) => request.post('/mock/gps/init', data),
  reportMockGps: (data) => request.post('/mock/gps/report', data),
  getDefaultRoute: () => request.get('/mock/route'),
}

export const exceptionApi = {
  createException: (data) => request.post('/exceptions', data),
  getPendingExceptions: () => request.get('/exceptions/pending'),
  getExceptionsByStatus: (status) => request.get(`/exceptions/status/${status}`),
  getExceptionById: (id) => request.get(`/exceptions/${id}`),
  reviewException: (id, data) => request.post(`/exceptions/${id}/review`, data),
  getExceptionsByTrackingNo: (trackingNo) => request.get(`/exceptions/tracking/${trackingNo}`),
}

export const sensitiveWordApi = {
  getAll: () => request.get('/sensitive-words'),
  check: (text) => request.get('/sensitive-words/check', { params: { text } }),
  add: (data) => request.post('/sensitive-words', data),
  reload: () => request.post('/sensitive-words/reload'),
}

export default request
