const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL,
      'https://你的網域.vercel.app',
      // 如果有其他域名也要加入
    ],
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
