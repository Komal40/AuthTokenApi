import React, { useState } from 'react';
import axios from 'axios';
import axiosInstance from '../../axiosInstance';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  // Function to handle user login
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post('/login', {
        username,
        password,
      });

      // Store access token in localStorage (or sessionStorage, depending on your needs)
      localStorage.setItem('accessToken', response.data.accessToken);
      setMessage('Login successful!');

      // Optionally redirect the user to a protected route
      // window.location.href = '/protected';
    } catch (error) {
      setMessage(error.response?.data?.message || 'Login failed');
    }
  };


  const getProtectedData = async () => {
    try {
      const response = await axiosInstance.get('/protected'); // Access a protected route
      console.log(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };



  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Login</button>
      </form>

      <button onClick={getProtectedData}>Check </button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default Login;
