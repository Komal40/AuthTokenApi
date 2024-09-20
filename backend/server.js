const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const PORT = 4000;
const cors=require('cors')

app.use(cors({
    origin: 'http://localhost:5173', // Your frontend URL
    credentials: true,                // Allow cookies to be sent
  }));
app.use(express.json());
app.use(cookieParser());

let refreshTokens = [];

// Simulated user data (replace with real database in production)
const users = [{ id: 1, username: 'test', password: 'password' }];

// Generate Access Token
const generateAccessToken = (user) => {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION });
};

// Generate Refresh Token
const generateRefreshToken = (user) => {
  const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION });
  refreshTokens.push(refreshToken);
  return refreshToken;
};

// Login Route
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find((u) => u.username === username && u.password === password);

  if (!user) return res.status(400).json({ message: 'Invalid Credentials' });

  const userPayload = { id: user.id, username: user.username };

  const accessToken = generateAccessToken(userPayload);
  const refreshToken = generateRefreshToken(userPayload);

  // Store refresh token in HttpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // true in production
    sameSite: 'Strict',
  });

  res.json({ accessToken });
});

// Refresh Token Route
app.post('/token/refresh', (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ message: 'No refresh token provided' });
  if (!refreshTokens.includes(refreshToken)) return res.status(403).json({ message: 'Invalid refresh token' });

  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid refresh token' });

    const userPayload = { id: user.id, username: user.username };
    const newAccessToken = generateAccessToken(userPayload);

    res.json({ accessToken: newAccessToken });
  });
});

// Logout Route to Invalidate Refresh Token
app.post('/logout', (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out successfully' });
});

// Protected Route (example)
app.get('/protected', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    res.json({ message: 'You have accessed a protected route', user });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
