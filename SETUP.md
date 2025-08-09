# Quick Setup Guide

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Redis server (for caching and rate limiting)
- AWS S3 bucket (for image uploads)

## Quick Start

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   Copy `.env.example` to `.env` and configure:

   ```bash
   cp .env.example .env
   ```

   Update the following in `.env`:

   ```bash
   # Redis Configuration
   REDIS_URL=redis://localhost:6379

   # AWS S3 Configuration
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your_access_key_id
   AWS_SECRET_ACCESS_KEY=your_secret_access_key
   AWS_S3_BUCKET_NAME=your-bucket-name

   # Application Configuration
   PORT=4008
   NODE_ENV=development
   ```

3. **Start Redis server**

   ```bash
   # On macOS with Homebrew
   brew services start redis

   # On Ubuntu/Debian
   sudo systemctl start redis-server

   # Using Docker
   docker run -d -p 6379:6379 redis:alpine
   ```

4. **Start the development server**

   ```bash
   npm run start:dev
   ```

5. **Access the application**
   - API: http://localhost:4008
   - Swagger Documentation: http://localhost:4008/docs

## Testing

```bash
# Run all tests
npm test

# Run e2e tests
npm run test:e2e

# Run tests with coverage
npm run test:cov
```

## Project Structure Overview

```
stackron/
├── src/
│   ├── products/          # Product management module
│   │   ├── dto/           # Data Transfer Objects
│   │   ├── entities/      # TypeORM entities
│   │   ├── products.controller.ts
│   │   ├── products.service.ts
│   │   └── products.module.ts
│   ├── cart/              # Cart management module
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── cart.controller.ts
│   │   ├── cart.service.ts
│   │   └── cart.module.ts
│   ├── common/            # Shared services and utilities
│   │   ├── services/      # Redis, S3, and other services
│   │   ├── interceptors/  # Caching and validation interceptors
│   │   ├── decorators/    # Custom decorators
│   │   ├── pipes/         # Custom pipes (UUID validation)
│   │   ├── config/        # Configuration management
│   │   └── common.module.ts
│   ├── database/          # Database configuration
│   ├── app.module.ts      # Root module with rate limiting
│   └── main.ts           # Application entry point
├── test/                  # E2E tests
├── examples/              # API usage examples
├── .env.example          # Environment configuration template
└── README.md             # Comprehensive documentation
```

## Key Features Implemented

✅ **Product Management**

- Create, read, update, delete products
- Image upload to AWS S3 with validation
- Pagination and filtering
- Discount system with time-based pricing
- Input validation and error handling

✅ **Cart Management**

- Add products to cart with quantity
- View cart with pricing calculations
- Remove items and clear cart
- Stock validation and availability checks
- Smart pricing with discount calculations

✅ **Performance & Security**

- Redis-based caching for improved performance
- Rate limiting to prevent API abuse
- Automatic cache invalidation on data changes
- Graceful degradation when Redis unavailable

✅ **Technical Requirements**

- NestJS with TypeScript
- SQLite database with TypeORM
- Redis for caching and rate limiting
- AWS S3 for secure image storage
- UUID-based primary keys for scalability
- Swagger/OpenAPI documentation
- Comprehensive testing (unit + e2e)
- Proper error handling and validation

✅ **Testing**

- Unit tests for services and controllers
- Integration tests for all endpoints
- Error scenario testing
- Test coverage reporting

## Next Steps

1. Install dependencies: `npm install`
2. Configure environment variables in `.env`
3. Start Redis server (see step 3 above)
4. Start the server: `npm run start:dev`
5. Visit http://localhost:4008/docs for interactive API documentation
6. Use the examples in `examples/api-usage.http` to test the API
7. Run tests to verify everything works: `npm test`

## Troubleshooting

**Redis Connection Issues:**

- Ensure Redis server is running: `redis-cli ping` should return `PONG`
- Check Redis URL in `.env` file
- Application will start without Redis but caching will be disabled

**AWS S3 Issues:**

- Verify AWS credentials and bucket permissions
- Image uploads will fail without proper S3 configuration
- Check AWS region and bucket name in `.env`

**Port Already in Use:**

- Change PORT in `.env` file to use a different port
- Kill existing processes: `lsof -ti:4008 | xargs kill -9`
