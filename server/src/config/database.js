const mysql = require('mysql2/promise');
const redis = require('redis');

let pool;
let redisClient;

async function connectDB() {
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
  return pool;
}

async function connectRedis() {
  redisClient = redis.createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
  });
  await redisClient.connect();
  return redisClient;
}

function getDB() {
  return pool;
}

function getRedis() {
  return redisClient;
}

module.exports = { connectDB, connectRedis, getDB, getRedis };
