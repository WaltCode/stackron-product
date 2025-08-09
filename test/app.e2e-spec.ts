import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from '../src/products/entities/product.entity';
import { CartItem } from '../src/cart/entities/cart-item.entity';
import { Repository } from 'typeorm';
import { S3Service } from '../src/common/services/s3.service';
import { RedisService } from '../src/common/services/redis.service';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let productRepository: Repository<Product>;
  let cartRepository: Repository<CartItem>;
  let s3Service: S3Service;
  let redisService: RedisService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(S3Service)
      .useValue({
        uploadFile: jest.fn().mockResolvedValue('https://mock-s3-url.com/test-image.jpg'),
        deleteFile: jest.fn().mockResolvedValue(undefined),
      })
      .overrideProvider(RedisService)
      .useValue({
        getJson: jest.fn().mockResolvedValue(null),
        setJson: jest.fn().mockResolvedValue(true),
        del: jest.fn().mockResolvedValue(true),
        flushPattern: jest.fn().mockResolvedValue(true),
        isConnected: jest.fn().mockReturnValue(false), // Disable caching in tests
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    productRepository = moduleFixture.get<Repository<Product>>(getRepositoryToken(Product));
    cartRepository = moduleFixture.get<Repository<CartItem>>(getRepositoryToken(CartItem));
    s3Service = moduleFixture.get<S3Service>(S3Service);
    redisService = moduleFixture.get<RedisService>(RedisService);

    await app.init();

    // Clean up database before each test
    await cartRepository.clear();
    await productRepository.clear();
  });

  afterEach(async () => {
    await cartRepository.clear();
    await productRepository.clear();
    await app.close();
  });

  describe('/products (POST)', () => {
    it('should create a new product without image', () => {
      return request(app.getHttpServer())
        .post('/products')
        .field('name', 'Test Product')
        .field('description', 'Test Description')
        .field('price', '99.99')
        .field('stock_quantity', '10')
        .expect(201)
        .expect((res) => {
          expect(res.body.name).toBe('Test Product');
          expect(res.body.description).toBe('Test Description');
          expect(res.body.originalPrice).toBe(99.99);
          expect(res.body.effectivePrice).toBe(99.99);
          expect(res.body.isDiscountActive).toBe(false);
          expect(res.body.id).toBeDefined();
          expect(res.body.created_at).toBeDefined();
          expect(res.body.updated_at).toBeDefined();
        });
    });

    it('should return 400 for invalid product data', () => {
      return request(app.getHttpServer())
        .post('/products')
        .field('name', '')
        .field('description', 'Test Description')
        .field('price', '-10')
        .field('stock_quantity', '-5')
        .expect(400);
    });

    it('should return 400 for invalid image file type', () => {
      const buffer = Buffer.from('fake file content');

      return request(app.getHttpServer())
        .post('/products')
        .field('name', 'Test Product')
        .field('description', 'Test Description')
        .field('price', '99.99')
        .field('stock_quantity', '10')
        .attach('image', buffer, { filename: 'test.txt', contentType: 'text/plain' })
        .expect(400);
    });

    it('should accept valid image file', () => {
      const buffer = Buffer.from('fake image content');

      return request(app.getHttpServer())
        .post('/products')
        .field('name', 'Test Product')
        .field('description', 'Test Description')
        .field('price', '99.99')
        .field('stock_quantity', '10')
        .attach('image', buffer, { filename: 'test.jpg', contentType: 'image/jpeg' })
        .expect(201)
        .expect((res) => {
          expect(res.body.name).toBe('Test Product');
          expect(res.body.image_url).toBe('https://mock-s3-url.com/test-image.jpg');
          expect(s3Service.uploadFile).toHaveBeenCalled();
        });
    });

    it('should accept PNG image files', () => {
      const buffer = Buffer.from('fake png content');

      return request(app.getHttpServer())
        .post('/products')
        .field('name', 'PNG Product')
        .field('description', 'Product with PNG image')
        .field('price', '149.99')
        .field('stock_quantity', '5')
        .attach('image', buffer, { filename: 'test.png', contentType: 'image/png' })
        .expect(201);
    });

    it('should accept WebP image files', () => {
      const buffer = Buffer.from('fake webp content');

      return request(app.getHttpServer())
        .post('/products')
        .field('name', 'WebP Product')
        .field('description', 'Product with WebP image')
        .field('price', '199.99')
        .field('stock_quantity', '3')
        .attach('image', buffer, { filename: 'test.webp', contentType: 'image/webp' })
        .expect(201);
    });
  });

  describe('/products (GET)', () => {
    beforeEach(async () => {
      // Create test products
      await productRepository.save([
        {
          name: 'iPhone 15',
          description: 'Latest iPhone',
          price: 999.99,
          stock_quantity: 50,
        },
        {
          name: 'Samsung Galaxy',
          description: 'Android phone',
          price: 799.99,
          stock_quantity: 30,
        },
      ]);
    });

    it('should return all products with pagination', () => {
      return request(app.getHttpServer())
        .get('/products')
        .expect(200)
        .expect((res) => {
          expect(res.body.products).toHaveLength(2);
          expect(res.body.total).toBe(2);
          expect(res.body.page).toBe(1);
          expect(res.body.limit).toBe(10);
        });
    });

    it('should filter products by name', () => {
      return request(app.getHttpServer())
        .get('/products?name=iPhone')
        .expect(200)
        .expect((res) => {
          expect(res.body.products).toHaveLength(1);
          expect(res.body.products[0].name).toContain('iPhone');
        });
    });

    it('should filter products by price range', () => {
      return request(app.getHttpServer())
        .get('/products?minPrice=800&maxPrice=1000')
        .expect(200)
        .expect((res) => {
          expect(res.body.products).toHaveLength(1);
          expect(res.body.products[0].name).toBe('iPhone 15');
        });
    });
  });

  describe('/products/:id (GET)', () => {
    let productId: string;

    beforeEach(async () => {
      const product = await productRepository.save({
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        stock_quantity: 10,
      });
      productId = product.id;
    });

    it('should return a product by id', () => {
      return request(app.getHttpServer())
        .get(`/products/${productId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(productId);
          expect(res.body.name).toBe('Test Product');
        });
    });

    it('should return 404 for non-existent product', () => {
      return request(app.getHttpServer())
        .get('/products/999e4567-e89b-12d3-a456-426614174999')
        .expect(404);
    });

    it('should return 400 for invalid UUID format', () => {
      return request(app.getHttpServer()).get('/products/invalid-uuid').expect(400);
    });
  });

  describe('/products/:id (PUT)', () => {
    let productId: string;

    beforeEach(async () => {
      const product = await productRepository.save({
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        stock_quantity: 10,
      });
      productId = product.id;
    });

    it('should update a product without image', () => {
      return request(app.getHttpServer())
        .put(`/products/${productId}`)
        .field('name', 'Updated Product')
        .field('price', '149.99')
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('Updated Product');
          expect(res.body.originalPrice).toBe(149.99);
          expect(res.body.description).toBe('Test Description'); // Should remain unchanged
        });
    });

    it('should update a product with new image', () => {
      const buffer = Buffer.from('updated image content');

      return request(app.getHttpServer())
        .put(`/products/${productId}`)
        .field('name', 'Updated Product with Image')
        .field('price', '179.99')
        .attach('image', buffer, { filename: 'updated.jpg', contentType: 'image/jpeg' })
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('Updated Product with Image');
          expect(res.body.originalPrice).toBe(179.99);
          expect(res.body.image_url).toBe('https://mock-s3-url.com/test-image.jpg');
          expect(s3Service.uploadFile).toHaveBeenCalled();
        });
    });

    it('should return 404 when updating non-existent product', () => {
      return request(app.getHttpServer())
        .put('/products/999')
        .send({ name: 'Updated' })
        .expect(404);
    });
  });

  describe('/products/:id (DELETE)', () => {
    let productId: string;

    beforeEach(async () => {
      const product = await productRepository.save({
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        stock_quantity: 10,
      });
      productId = product.id;
    });

    it('should delete a product', () => {
      return request(app.getHttpServer()).delete(`/products/${productId}`).expect(204);
    });

    it('should return 404 when deleting non-existent product', () => {
      return request(app.getHttpServer())
        .delete('/products/999e4567-e89b-12d3-a456-426614174999')
        .expect(404);
    });

    it('should return 400 for invalid UUID format', () => {
      return request(app.getHttpServer()).delete('/products/invalid-uuid').expect(400);
    });

    it('should delete product image from S3 when product is deleted', async () => {
      // Create a product with an image
      const productWithImage = await productRepository.save({
        name: 'Product with Image',
        description: 'Test Description',
        price: 99.99,
        stock_quantity: 10,
        image_url: 'https://mock-s3-url.com/test-image.jpg',
      });

      await request(app.getHttpServer()).delete(`/products/${productWithImage.id}`).expect(204);

      expect(s3Service.deleteFile).toHaveBeenCalledWith('https://mock-s3-url.com/test-image.jpg');
    });
  });

  describe('/cart/items (POST)', () => {
    let productId: string;

    beforeEach(async () => {
      const product = await productRepository.save({
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        stock_quantity: 10,
      });
      productId = product.id;
    });

    it('should add item to cart', () => {
      const addToCartDto = {
        product_id: productId,
        quantity: 2,
      };

      return request(app.getHttpServer())
        .post('/cart/items')
        .send(addToCartDto)
        .expect(201)
        .expect((res) => {
          expect(res.body.product_id).toBe(productId);
          expect(res.body.quantity).toBe(2);
          expect(res.body.id).toBeDefined();
        });
    });

    it('should return 400 for insufficient stock', () => {
      const addToCartDto = {
        product_id: productId,
        quantity: 15, // More than available stock
      };

      return request(app.getHttpServer()).post('/cart/items').send(addToCartDto).expect(400);
    });

    it('should return 404 for non-existent product', () => {
      const addToCartDto = {
        product_id: '999e4567-e89b-12d3-a456-426614174999',
        quantity: 1,
      };

      return request(app.getHttpServer()).post('/cart/items').send(addToCartDto).expect(404);
    });
  });

  describe('/cart (GET)', () => {
    let productId: string;

    beforeEach(async () => {
      const product = await productRepository.save({
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        stock_quantity: 10,
      });
      productId = product.id;

      // Add item to cart
      await cartRepository.save({
        product_id: productId,
        quantity: 2,
      });
    });

    it('should return cart with totals', () => {
      return request(app.getHttpServer())
        .get('/cart')
        .expect(200)
        .expect((res) => {
          expect(res.body.items).toHaveLength(1);
          expect(res.body.totalItems).toBe(2);
          expect(res.body.totalPrice).toBe(199.98);
          expect(res.body.uniqueProducts).toBe(1);
        });
    });

    it('should return empty cart when no items', async () => {
      await cartRepository.clear();

      return request(app.getHttpServer())
        .get('/cart')
        .expect(200)
        .expect((res) => {
          expect(res.body.items).toHaveLength(0);
          expect(res.body.totalItems).toBe(0);
          expect(res.body.totalPrice).toBe(0);
          expect(res.body.uniqueProducts).toBe(0);
        });
    });
  });

  describe('/products/:id/discount (PUT)', () => {
    let productId: string;

    beforeEach(async () => {
      const product = await productRepository.save({
        name: 'Test Product',
        description: 'Test Description',
        price: 100.0,
        stock_quantity: 10,
      });
      productId = product.id;
    });

    it('should apply discount to a product', () => {
      const discountDto = {
        discount_percentage: 20,
        discount_start_date: '2024-01-01T00:00:00.000Z',
        discount_end_date: '2024-12-31T23:59:59.000Z',
      };

      return request(app.getHttpServer())
        .put(`/products/${productId}/discount`)
        .send(discountDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.discount_percentage).toBe(20);
          expect(res.body.isDiscountActive).toBe(true);
          expect(res.body.originalPrice).toBe(100);
          expect(res.body.effectivePrice).toBe(80);
          expect(res.body.discountAmount).toBe(20);
        });
    });

    it('should return 400 for invalid discount data', () => {
      const invalidDiscountDto = {
        discount_percentage: 150, // Invalid percentage > 100
      };

      return request(app.getHttpServer())
        .put(`/products/${productId}/discount`)
        .send(invalidDiscountDto)
        .expect(400);
    });
  });

  describe('/products/:id/discount (DELETE)', () => {
    let productId: string;

    beforeEach(async () => {
      const product = await productRepository.save({
        name: 'Test Product',
        description: 'Test Description',
        price: 100.0,
        stock_quantity: 10,
        discount_percentage: 20,
        discount_start_date: new Date('2024-01-01'),
        discount_end_date: new Date('2024-12-31'),
      });
      productId = product.id;
    });

    it('should remove discount from a product', () => {
      return request(app.getHttpServer())
        .delete(`/products/${productId}/discount`)
        .expect(200)
        .expect((res) => {
          expect(res.body.discount_percentage).toBeUndefined();
          expect(res.body.isDiscountActive).toBe(false);
          expect(res.body.originalPrice).toBe(100);
          expect(res.body.effectivePrice).toBe(100);
          expect(res.body.discountAmount).toBe(0);
        });
    });
  });

  describe('Cart with discounted products', () => {
    let productId: string;

    beforeEach(async () => {
      const product = await productRepository.save({
        name: 'Discounted Product',
        description: 'Product with discount',
        price: 100.0,
        stock_quantity: 10,
        discount_percentage: 25,
        discount_start_date: new Date('2020-01-01'),
        discount_end_date: new Date('2030-12-31'),
      });
      productId = product.id;

      // Add discounted item to cart
      await cartRepository.save({
        product_id: productId,
        quantity: 2,
      });
    });

    it('should calculate cart totals with discounts', () => {
      return request(app.getHttpServer())
        .get('/cart')
        .expect(200)
        .expect((res) => {
          expect(res.body.items).toHaveLength(1);
          expect(res.body.totalItems).toBe(2);
          expect(res.body.totalPrice).toBe(150); // 2 * 75 (25% off 100)
          expect(res.body.totalOriginalPrice).toBe(200); // 2 * 100
          expect(res.body.totalSavings).toBe(50); // 200 - 150
          expect(res.body.items[0].product.isDiscountActive).toBe(true);
          expect(res.body.items[0].lineTotal).toBe(150);
          expect(res.body.items[0].lineSavings).toBe(50);
        });
    });
  });
});
