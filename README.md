# Stackron API

A comprehensive NestJS-based REST API for product and cart management with TypeScript, SQLite, and comprehensive testing.

## Features

- **Product Management**: Create, read, update products with pagination and filtering
- **Image Upload**: AWS S3 integration for secure image storage with automatic URL generation
- **File Validation**: Controller-level interceptor validation for image files (type, size, format)
- **Caching**: Redis-based caching for improved performance with automatic cache invalidation
- **Rate Limiting**: Redis-backed rate limiting to prevent API abuse
- **Discount System**: Apply time-based discounts to products with percentage-based pricing
- **Shopping Cart**: Add products to cart, view cart with totals including discount calculations
- **Smart Pricing**: Automatic calculation of effective prices and savings
- **Data Validation**: Input validation using class-validator decorators
- **API Documentation**: Interactive Swagger/OpenAPI documentation
- **Database**: SQLite with TypeORM for data persistence
- **Testing**: Comprehensive unit and integration tests with Jest
- **Error Handling**: Proper HTTP status codes and error responses

## Tech Stack

- **Framework**: NestJS with TypeScript
- **Database**: SQLite with TypeORM
- **Caching**: Redis for performance optimization
- **Rate Limiting**: Redis-backed throttling
- **File Storage**: AWS S3 for image uploads
- **Validation**: class-validator and class-transformer
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest with supertest for e2e testing

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd stackron
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure Redis (for caching and rate limiting)**
   - Install and start Redis server locally, or use a cloud Redis service
   - Copy `.env.example` to `.env`
   - Set your Redis connection URL:

   ```bash
   REDIS_URL=redis://localhost:6379
   ```

4. **Configure AWS S3 (for image uploads)**
   - Set your AWS credentials and S3 bucket name in `.env`:

   ```bash
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your_access_key_id
   AWS_SECRET_ACCESS_KEY=your_secret_access_key
   AWS_S3_BUCKET_NAME=your-bucket-name
   ```

5. **Start the application**

   ```bash
   # Development mode with hot reload
   npm run start:dev

   # Production mode
   npm run start:prod
   ```

6. **Access the application**
   - API: http://localhost:3000
   - Swagger Documentation: http://localhost:3000/api

## API Endpoints

### Products

#### Create Product

- **POST** `/products`
- **Content-Type**: `multipart/form-data`
- **Form Fields**:
  - `name` (required): Product name
  - `description` (required): Product description
  - `price` (required): Product price
  - `stock_quantity` (required): Available stock
  - `image` (optional): Image file (JPEG, PNG, WebP, GIF - max 5MB)
  - `discount_percentage` (optional): Discount percentage (0-100)
  - `discount_start_date` (optional): ISO date string
  - `discount_end_date` (optional): ISO date string

**Example curl command**:

```bash
curl -X POST http://localhost:3000/products \
  -F "name=iPhone 15" \
  -F "description=Latest iPhone with advanced features" \
  -F "price=999.99" \
  -F "stock_quantity=50" \
  -F "image=@/path/to/image.jpg" \
  -F "discount_percentage=15"
```

#### Get All Products

- **GET** `/products`
- **Query Parameters**:
  - `page` (optional): Page number for pagination (default: 1)
  - `limit` (optional): Items per page (default: 10)
  - `name` (optional): Filter by product name
  - `minPrice` (optional): Minimum price filter
  - `maxPrice` (optional): Maximum price filter

#### Get Product by ID

- **GET** `/products/:id`

#### Update Product

- **PUT** `/products/:id`
- **Body**: Same as create product (all fields optional)

#### Apply Discount to Product

- **PUT** `/products/:id/discount`
- **Body**:
  ```json
  {
    "discount_percentage": 20,
    "discount_start_date": "2024-06-01T00:00:00.000Z",
    "discount_end_date": "2024-08-31T23:59:59.000Z"
  }
  ```

#### Remove Discount from Product

- **DELETE** `/products/:id/discount`

#### Delete Product

- **DELETE** `/products/:id`
- **Response**: 204 No Content (product deleted successfully)

### Cart

#### Add to Cart

- **POST** `/cart/items`
- **Body**:
  ```json
  {
    "product_id": 1,
    "quantity": 2
  }
  ```

#### Get Cart

- **GET** `/cart`
- **Response**:
  ```json
  {
    "items": [
      {
        "id": 1,
        "product_id": 1,
        "quantity": 2,
        "created_at": "2024-01-01T00:00:00.000Z",
        "product": {
          "id": 1,
          "name": "iPhone 15",
          "originalPrice": 999.99,
          "effectivePrice": 849.99,
          "discountAmount": 150.0,
          "isDiscountActive": true,
          "image_url": "https://example.com/images/iphone15.jpg"
        },
        "lineTotal": 1699.98,
        "lineSavings": 300.0
      }
    ],
    "totalItems": 2,
    "totalPrice": 1699.98,
    "totalOriginalPrice": 1999.98,
    "totalSavings": 300.0,
    "uniqueProducts": 1
  }
  ```

#### Clear Cart

- **DELETE** `/cart`

#### Remove Item from Cart

- **DELETE** `/cart/items/:id`

## Database Schema

**Note**: All ID fields use UUIDs (Universally Unique Identifiers) instead of auto-incrementing integers for better scalability and security.

### Products Table

- `id`: Primary key (UUID)
- `name`: Product name (varchar, 255)
- `description`: Product description (text)
- `price`: Product price (decimal, 10,2)
- `stock_quantity`: Available stock (integer)
- `image_url`: Product image URL (varchar, 500, nullable)
- `discount_percentage`: Discount percentage 0-100 (decimal, 5,2, nullable)
- `discount_start_date`: Discount start date (datetime, nullable)
- `discount_end_date`: Discount end date (datetime, nullable)
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

### Cart Items Table

- `id`: Primary key (UUID)
- `product_id`: Foreign key to products table (UUID)
- `quantity`: Quantity in cart (integer)
- `created_at`: Creation timestamp

## Discount System

The API includes a comprehensive discount system with the following features:

### Discount Types

- **Percentage-based discounts**: Apply discounts as percentages (0-100%)
- **Time-based discounts**: Set start and end dates for discount validity
- **Automatic calculation**: Effective prices are calculated automatically

### Discount Logic

- Discounts are only active if the current date is within the specified range
- If no start date is set, the discount is active from creation
- If no end date is set, the discount remains active indefinitely
- Cart calculations automatically use discounted prices when applicable

### API Responses

All product responses include:

- `originalPrice`: The base product price
- `effectivePrice`: The current price after applying active discounts
- `discountAmount`: The monetary amount saved
- `isDiscountActive`: Boolean indicating if discount is currently active

### Cart Integration

Cart responses include detailed pricing information:

- Line-level totals and savings for each item
- Overall cart totals with original prices, effective prices, and total savings
- Automatic recalculation when discounts change

## Image Upload Architecture

The application uses a clean separation of concerns for image upload handling:

### Controller Layer (Validation)

- **ImageValidationInterceptor**: Validates file type, size, and format at the controller level
- **FileInterceptor**: Handles multipart/form-data parsing
- **Proper Error Handling**: Returns appropriate HTTP status codes for validation failures

### Service Layer (Business Logic)

- **S3Service**: Handles AWS S3 upload/delete operations without validation concerns
- **ProductsService**: Orchestrates image upload with product creation/updates
- **Clean Separation**: Services focus on business logic, not validation

### Validation Rules

- **File Types**: JPEG, PNG, WebP, GIF only
- **File Size**: Maximum 5MB per image
- **File Extensions**: Must match MIME type
- **Optional Upload**: Images are optional for all operations

## Caching and Performance

### Redis Caching

The application uses Redis for intelligent caching to improve performance:

- **Product Caching**: Individual products cached for 10 minutes
- **Product Lists**: Search results cached for 5 minutes with query-specific keys
- **Cart Data**: Shopping cart contents cached for 5 minutes
- **Automatic Invalidation**: Cache automatically cleared when data changes

### Rate Limiting

Redis-backed rate limiting protects against API abuse:

- **Short-term**: 100 requests per minute
- **Medium-term**: 500 requests per 10 minutes
- **Long-term**: 1000 requests per hour
- **Distributed**: Works across multiple server instances

### Cache Strategy

- **Cache-Aside Pattern**: Data fetched from database on cache miss
- **Write-Through**: Cache invalidated immediately on data updates
- **Graceful Degradation**: Application continues working if Redis is unavailable
- **Smart Key Generation**: Includes query parameters for accurate cache hits

## Testing

### Run Unit Tests

```bash
npm run test
```

### Run Integration Tests

```bash
npm run test:e2e
```

### Run Tests with Coverage

```bash
npm run test:cov
```

### Test Coverage

The application includes comprehensive test coverage for:

- **Unit Tests**:
  - Product service and controller with image upload scenarios
  - Cart service and controller with UUID support
  - S3Service with mocked AWS SDK operations
  - ImageValidationInterceptor with various file types and error cases
  - ParseUUIDPipe with valid and invalid UUID formats
  - CommonModule dependency injection and exports

- **Integration Tests**:
  - End-to-end tests for all API endpoints with multipart form data
  - Image upload validation at the controller level
  - UUID-based product and cart operations
  - Error scenario testing (invalid data, non-existent resources, invalid UUIDs)
  - Mocked S3 service for testing without AWS dependencies

- **Test Architecture**:
  - Proper separation of unit and integration tests
  - Mocked external dependencies (AWS S3)
  - Comprehensive error case coverage
  - UUID validation testing
  - File upload validation testing

## Development

### Project Structure

```
src/
├── cart/
│   ├── dto/
│   ├── entities/
│   ├── cart.controller.ts
│   ├── cart.service.ts
│   └── cart.module.ts
├── products/
│   ├── dto/
│   ├── entities/
│   ├── products.controller.ts
│   ├── products.service.ts
│   └── products.module.ts
├── database/
│   └── database.module.ts
├── app.module.ts
└── main.ts
```

### Available Scripts

- `npm run build`: Build the application
- `npm run start`: Start the application
- `npm run start:dev`: Start in development mode with hot reload
- `npm run start:debug`: Start in debug mode
- `npm run lint`: Run ESLint
- `npm run format`: Format code with Prettier

## Error Handling

The API implements proper error handling with appropriate HTTP status codes:

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors, insufficient stock)
- `404`: Not Found (product/cart item not found)
- `500`: Internal Server Error

## Validation

All endpoints implement input validation using class-validator:

- Required fields validation
- Data type validation
- Range validation (positive numbers, minimum values)
- String length validation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the UNLICENSED license.
