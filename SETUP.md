# Quick Setup Guide

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Quick Start

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start the development server**

   ```bash
   npm run start:dev
   ```

3. **Access the application**
   - API: http://localhost:3000
   - Swagger Documentation: http://localhost:3000/api

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
│   ├── database/          # Database configuration
│   ├── app.module.ts      # Root module
│   └── main.ts           # Application entry point
├── test/                  # E2E tests
├── examples/              # API usage examples
└── README.md             # Comprehensive documentation
```

## Key Features Implemented

✅ **Product Management**

- Create, read, update products
- Pagination and filtering
- Input validation
- Error handling

✅ **Cart Management**

- Add products to cart
- View cart with totals
- Stock validation
- Cart management operations

✅ **Technical Requirements**

- NestJS with TypeScript
- SQLite database with TypeORM
- UUID-based primary keys for better scalability
- Swagger/OpenAPI documentation
- Comprehensive testing (unit + e2e)
- Proper error handling
- Input validation

✅ **Testing**

- Unit tests for services and controllers
- Integration tests for all endpoints
- Error scenario testing
- Test coverage reporting

## Next Steps

1. Install dependencies: `npm install`
2. Start the server: `npm run start:dev`
3. Visit http://localhost:3000/api for interactive API documentation
4. Use the examples in `examples/api-usage.http` to test the API
5. Run tests to verify everything works: `npm test`
