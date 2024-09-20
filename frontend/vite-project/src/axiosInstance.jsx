import axios from 'axios';

// Create an Axios instance
const axiosInstance = axios.create({
  baseURL: 'http://localhost:4000',  // Your backend API URL
  withCredentials: true,  // This is required to send cookies (refresh token)
});

// Intercept requests to add access token to Authorization header
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    console.log("interceptor called")
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercept responses to handle token expiration
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshTokenResponse = await axiosInstance.post('/token/refresh', {}, { withCredentials: true });
        console.log("refresh token called")
        const newAccessToken = refreshTokenResponse.data.accessToken;

        // Update the access token in localStorage
        localStorage.setItem('accessToken', newAccessToken);

        // Retry the original request with the new access token
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error('Refresh token failed:', refreshError);
        // Optionally log out the user or redirect to login
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
