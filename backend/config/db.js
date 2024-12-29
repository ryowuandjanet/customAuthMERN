const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB 連線成功: ${conn.connection.host}`);
  } catch (error) {
    console.error(`連線錯誤: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
