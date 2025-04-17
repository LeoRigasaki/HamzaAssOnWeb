

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const http = require('http');
const config = require('./src/config/config');
const { initializeSocket } = require('./src/utils/socket');
const dotenv = require('dotenv');

dotenv.config();

// Initialize express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io with the server
const io = initializeSocket(server);

// Body parser
app.use(express.json());



// Enable CORS
const corsOptions = {
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Set security headers
app.use(helmet());

// Sanitize data
app.use(mongoSanitize());

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);


// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 60 }); // 1 minute default TTL

// Caching middleware
const cacheMiddleware = (duration) => {
  return (req, res, next) => {
    // Skip cache for non-GET requests or authenticated routes that need fresh data
    if (req.method !== 'GET') {
      return next();
    }
    
    const key = `${req.originalUrl}-${req.user?.id || 'guest'}`;
    const cachedData = cache.get(key);
    
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }
    
    // Store original send method
    const originalSend = res.send;
    
    // Override send method to cache response
    res.send = function(body) {
      cache.set(key, body, duration);
      originalSend.call(this, body);
    };
    
    next();
  };
};

// Apply to specific routes
app.use('/api/v1/courses/tutor/mycourses', cacheMiddleware(60)); // 1 minute cache
app.use('/api/v1/sessions/upcoming', cacheMiddleware(60)); // 1 minute cache

// Mount routes
app.use('/api/v1/auth', require('./src/routes/auth.routes'));
app.use('/api/v1/users', require('./src/routes/users.routes'));
app.use('/api/v1/sessions', require('./src/routes/sessions.routes'));
app.use('/api/v1/messages', require('./src/routes/messages.routes'));
app.use('/api/v1/courses', require('./src/routes/courses.routes'));
app.use('/api/v1/admin', require('./src/routes/admin.routes'));

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Learn Bridge API' });
});

// Error handling middleware
const errorHandler = require('./src/middleware/error.middleware');
app.use(errorHandler);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log(`MongoDB Connected${ mongoose.connection.host}`);
    // Start server
    server.listen(process.env.PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${process.env.PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('Unhandled Rejection! Shutting down...');
  console.error(err);
  server.close(() => {
    process.exit(1);
  });
});
