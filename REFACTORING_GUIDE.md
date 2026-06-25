# Alawusa Heritage Fish & Farms - Refactoring Guide

## 🎯 Overview
This guide outlines the complete refactoring of the Alawusa Heritage codebase from a flat HTML/CSS/JS structure to a modern, scalable full-stack application.

## 📊 Current Issues
- ❌ 100+ duplicate HTML files (admin-dashboard1-20, productdetails1-40, etc.)
- ❌ Hardcoded Firebase credentials in frontend
- ❌ No backend API - cart/orders only in localStorage
- ❌ Flat file structure with 300+ files at root
- ❌ No environment configuration
- ❌ No build system or minification
- ❌ Frontend-only authentication

## ✅ Refactoring Goals

### Phase 1: Architecture Setup
- [x] Create monorepo structure (backend + frontend)
- [x] Set up environment configuration
- [x] Add package.json files
- [ ] Configure build tools

### Phase 2: Backend Development
- [ ] Set up Node.js/Express server
- [ ] Create MongoDB/PostgreSQL database
- [ ] Build REST API (products, users, orders, cart)
- [ ] Implement JWT authentication
- [ ] Add payment processing integration
- [ ] Write API tests

### Phase 3: Frontend Modernization
- [ ] Reorganize CSS into modular structure
- [ ] Convert duplicate HTML pages to reusable components
- [ ] Replace localStorage with API calls
- [ ] Implement proper state management
- [ ] Add build pipeline (webpack/vite)
- [ ] Optimize assets and implement lazy loading

### Phase 4: Security & DevOps
- [ ] Move secrets to .env files
- [ ] Add input validation & sanitization
- [ ] Implement rate limiting
- [ ] Set up Docker & docker-compose
- [ ] Create CI/CD pipeline (GitHub Actions)
- [ ] Add logging and monitoring

### Phase 5: Testing & Documentation
- [ ] Write unit tests (Jest)
- [ ] Write integration tests
- [ ] Add API documentation (Swagger)
- [ ] Create deployment guide

## 📁 New Project Structure

```
alawusa-heritage/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── config/         # DB, Firebase, environment
│   │   ├── models/         # Mongoose/Sequelize schemas
│   │   ├── routes/         # API endpoints
│   │   ├── controllers/    # Business logic
│   │   ├── middleware/     # Auth, validation, error handling
│   │   ├── services/       # External services (Paystack, etc.)
│   │   ├── utils/          # Helper functions
│   │   └── app.js          # Express setup
│   ├── tests/
│   ├── .env.example
│   ├── package.json
│   └── README.md
│
├── frontend/                # React/Vue or Vanilla JS (organized)
│   ├── public/
│   │   ├── index.html
│   │   └── assets/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── styles/         # CSS modules
│   │   ├── utils/          # API calls, helpers
│   │   ├── config/         # Frontend config
│   │   └── app.js          # Main entry
│   ├── .env.example
│   ├── package.json
│   └── README.md
│
├── docker-compose.yml      # Local development stack
├── .gitignore
├── .env.example
└── DEPLOYMENT.md
```

## 🚀 Quick Start (After Setup)

### Development
```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Run with Docker Compose
docker-compose up

# Or manually
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

### Environment Variables
Create `.env` files in `backend/` and `frontend/`:

**backend/.env**
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/alawusa
JWT_SECRET=your_jwt_secret_key
FIREBASE_PROJECT_ID=alawusa-heritage-website
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...
PAYSTACK_SECRET_KEY=...
NODE_ENV=development
```

**frontend/.env**
```
VITE_API_URL=http://localhost:5000/api
VITE_FIREBASE_CONFIG={...}
```

## 📝 Migration Steps

### 1. Database Setup
```bash
# Create collections:
- users (email, password hash, profile, address)
- products (name, description, price, category, images, stock)
- orders (user_id, items, total, status, shipping_address)
- cart (user_id, items, expires_at)
- admin_users (email, password_hash, permissions)
```

### 2. API Endpoints
```
AUTH:
  POST /api/auth/register
  POST /api/auth/login
  POST /api/auth/refresh-token
  POST /api/auth/logout

PRODUCTS:
  GET /api/products
  GET /api/products/:id
  GET /api/products?category=&search=
  POST /api/products (admin only)
  PUT /api/products/:id (admin only)

CARTS:
  GET /api/cart
  POST /api/cart/items
  DELETE /api/cart/items/:id
  PUT /api/cart/items/:id

ORDERS:
  GET /api/orders
  POST /api/orders
  GET /api/orders/:id
  PUT /api/orders/:id (admin)

USERS:
  GET /api/users/profile
  PUT /api/users/profile
  POST /api/users/upload-avatar
```

### 3. Frontend Component Conversion
Instead of 40 `productdetails*.html` files:
```
src/pages/ProductDetail.jsx  (uses URL param: /product/:id)
```

Instead of 20 `admin-dashboard*.html` files:
```
src/pages/AdminDashboard.jsx (tabs for different sections)
```

## 🔒 Security Improvements

1. **Environment Variables**: Move Firebase keys to backend
2. **JWT Authentication**: Replace frontend-only auth
3. **Input Validation**: Server-side validation for all inputs
4. **Rate Limiting**: Prevent brute force attacks
5. **CORS**: Properly configure cross-origin requests
6. **Password Hashing**: bcrypt for password storage
7. **SQL Injection Prevention**: Use parameterized queries
8. **XSS Protection**: Sanitize user inputs

## 📊 Performance Improvements

1. **Asset Optimization**: Compress images, minify CSS/JS
2. **Code Splitting**: Load only needed components
3. **Lazy Loading**: Load images and components on demand
4. **Caching**: Implement Redis for sessions/cart
5. **CDN**: Serve static assets from CDN
6. **Database Indexing**: Index frequently queried fields

## 🧪 Testing Strategy

```
unit/
  ├── auth.test.js
  ├── products.test.js
  └── orders.test.js

integration/
  ├── auth-flow.test.js
  ├── checkout-flow.test.js
  └── order-management.test.js

e2e/
  ├── user-journey.test.js
  └── admin-flow.test.js
```

## 📋 Implementation Order

1. ✅ Create monorepo structure
2. ⏳ Backend setup (Node.js + DB)
3. ⏳ Core API endpoints
4. ⏳ Authentication system
5. ⏳ Frontend reorganization
6. ⏳ Connect frontend to API
7. ⏳ Payment integration
8. ⏳ Admin panel
9. ⏳ Testing suite
10. ⏳ Deployment setup

## 🎓 Learning Resources

- [Express.js Best Practices](https://expressjs.com/)
- [MongoDB Schema Design](https://www.mongodb.com/docs/)
- [JWT Authentication](https://jwt.io/)
- [React Component Patterns](https://react.dev/)
- [Docker for Developers](https://docs.docker.com/)

## ❓ Questions?

Refer to individual README files in `backend/` and `frontend/` directories.
