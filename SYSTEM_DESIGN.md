# WhatsApp Shop OS MAX - Complete System Design

**Everything needed to test if 20 shops in Kiambu can survive a month without manual intervention.**

---

## 🏗️ System Architecture

### Message Flow

```
User sends WhatsApp message
    ↓
WhatsApp Business API receives message
    ↓
Platform webhook receives message
    ↓
Message parser identifies intent
    ├─ Seller onboarding
    ├─ Product management
    ├─ Search/browse
    ├─ Cart operations
    ├─ Checkout
    ├─ Order confirmation
    ├─ Delivery tracking
    ├─ Dispute reporting
    └─ Analytics/dashboard
    ↓
Intent handler processes request
    ├─ Validates input
    ├─ Updates database
    ├─ Triggers external APIs (M-Pesa, Cloudinary)
    └─ Generates response
    ↓
Response sent back via WhatsApp API
```

### Database Schema

```sql
-- Sellers
CREATE TABLE sellers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255),
  shop_name VARCHAR(255),
  zone VARCHAR(100),
  rating DECIMAL(3,2) DEFAULT 0,
  total_orders INT DEFAULT 0,
  response_time_avg INT DEFAULT 0,
  payment_method ENUM('paybill','till','pochi','phone'),
  payment_account VARCHAR(255),
  payment_verified BOOLEAN DEFAULT FALSE,
  status ENUM('active','suspended','inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Products
CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  seller_id INT NOT NULL,
  name VARCHAR(255),
  price INT,
  stock INT DEFAULT 0,
  image_url VARCHAR(500),
  category VARCHAR(100),
  sku VARCHAR(100),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES sellers(id)
);

-- Buyers
CREATE TABLE buyers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255),
  zone VARCHAR(100),
  favorite_sellers JSON,
  favorite_products JSON,
  saved_addresses JSON,
  total_orders INT DEFAULT 0,
  last_order_date TIMESTAMP,
  status ENUM('active','inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders
CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id VARCHAR(50) UNIQUE NOT NULL,
  buyer_phone VARCHAR(20),
  seller_id INT NOT NULL,
  items JSON,
  total_amount INT,
  status ENUM('pending_payment','paid','confirmed','rider_assigned','on_delivery','delivered','cancelled') DEFAULT 'pending_payment',
  payment_reference VARCHAR(255),
  payment_method VARCHAR(50),
  rider_phone VARCHAR(20),
  delivery_location JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMP,
  confirmed_at TIMESTAMP,
  delivered_at TIMESTAMP,
  notes TEXT,
  FOREIGN KEY (seller_id) REFERENCES sellers(id)
);

-- Riders
CREATE TABLE riders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255),
  zone VARCHAR(100),
  current_order_id VARCHAR(50),
  status ENUM('available','on_delivery','offline') DEFAULT 'offline',
  rating DECIMAL(3,2) DEFAULT 0,
  total_deliveries INT DEFAULT 0,
  earnings_today INT DEFAULT 0,
  earnings_total INT DEFAULT 0,
  trusted_by_sellers JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Disputes
CREATE TABLE disputes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id VARCHAR(50),
  type ENUM('missing_item','wrong_item','rider_issue','quality_issue','refund'),
  reported_by ENUM('buyer','seller','rider'),
  description TEXT,
  status ENUM('open','resolved','closed') DEFAULT 'open',
  resolution VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP
);

-- Payments
CREATE TABLE payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  reference VARCHAR(255) UNIQUE,
  method VARCHAR(50),
  amount INT,
  seller_id INT,
  buyer_phone VARCHAR(20),
  order_id VARCHAR(50),
  status ENUM('pending','confirmed','failed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  confirmed_at TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES sellers(id)
);
```

---

## 🔄 Complete Flows

### FLOW 1: Seller Onboarding

**Input:** Seller sends "hi"
**Output:** Seller is verified and live in 3 minutes

```
Step 1: Initial greeting
  Seller: "hi"
  Bot: "Welcome to WhatsApp Shop OS!
        1 Register Shop
        2 Browse Marketplace
        3 Become Rider"
  Seller: "1"

Step 2: Shop name
  Bot: "Shop name?"
  Seller: "Mama Akinyi Store"
  [Store in temp session]

Step 3: Town selection
  Bot: "Town?"
  Seller: "Kiambu"
  [Store in temp session]

Step 4: Zone selection
  Bot: "Zone?
        1 Kiambu CBD
        2 Kangoya
        3 Ndumberi
        4 Tinganga"
  Seller: "1"
  [Store in temp session]

Step 5: Payment method selection
  Bot: "Payment method?
        1 Paybill
        2 Till
        3 Pochi
        4 Phone"
  Seller: "1"
  [Store in temp session]

Step 6: Paybill details
  Bot: "Paybill number?"
  Seller: "123456"
  [Validate format: 6 digits]
  
  Bot: "Account number?"
  Seller: "1234567890"
  [Store temporarily]
  
  Bot: "Confirm account: 1234567890"
  Seller: "yes"
  [Validate match]

Step 7: Verification
  [Send test M-Pesa transaction of KES 1]
  [Wait for IPN webhook confirmation]
  
  If confirmed:
    Bot: "✓ Payment verified!
          Your shop is live!
          
          Next: Send 'products' to add items"
    [Create seller record]
    [Set status = active]
    [Send welcome notification]
  
  If failed:
    Bot: "Payment verification failed.
          Try again? YES/NO"

Step 8: Seller is live
  [Seller can now receive orders]
  [Seller appears in search results]
  [Seller can add products]
```

**Database operations:**
```
INSERT INTO sellers (phone, name, shop_name, zone, payment_method, payment_account, payment_verified, status)
VALUES ('+254712345678', 'Mama Akinyi', 'Mama Akinyi Store', 'Kiambu CBD', 'paybill', '123456:1234567890', TRUE, 'active')
```

---

### FLOW 2: Add Product

**Input:** Seller sends "products" then "1" (add)
**Output:** Product is live and searchable

```
Step 1: Product menu
  Seller: "products"
  Bot: "1 Add Product
        2 Edit Product
        3 Remove Product
        4 Update Stock
        5 Bulk Upload"
  Seller: "1"

Step 2: Product name
  Bot: "Product name?"
  Seller: "Milk 500ml"
  [Store in temp session]

Step 3: Price
  Bot: "Price (KES)?"
  Seller: "65"
  [Validate: numeric, >0]
  [Store in temp session]

Step 4: Stock
  Bot: "Stock quantity?"
  Seller: "30"
  [Validate: numeric, >=0]
  [Store in temp session]

Step 5: Image (optional)
  Bot: "Upload image? (optional)"
  Seller: [sends image]
  
  If image received:
    [Upload to Cloudinary]
    [Get image URL]
    [Store URL in temp session]
  
  If no image:
    [Use default placeholder]

Step 6: Create product
  [INSERT INTO products]
  [Index for search]
  
  Bot: "✓ Product created!
        Milk 500ml
        Price: KES 65
        Stock: 30
        
        Send 'products' to add more"

Step 7: Product is live
  [Product appears in search results]
  [Buyers in same zone can find it]
```

**Database operations:**
```
INSERT INTO products (seller_id, name, price, stock, image_url, category, active)
VALUES (1, 'Milk 500ml', 65, 30, 'https://cloudinary.com/...', 'dairy', TRUE)
```

---

### FLOW 3: Buyer Search & Browse

**Input:** Buyer sends "milk"
**Output:** Buyer sees nearby shops with prices and ratings

```
Step 1: Search query
  Buyer: "milk"
  
  [Query products table]
  SELECT * FROM products WHERE name LIKE '%milk%' AND active = TRUE
  
  [Query sellers table]
  SELECT * FROM sellers WHERE zone = buyer_zone AND status = 'active'
  
  [Join and rank by]
  - Price (lowest first)
  - Delivery time (fastest first)
  - Rating (highest first)

Step 2: Display results
  Bot: "Available nearby:
        
        1 Mama Akinyi - KES 65 (8 min) ★★★★★
           Milk 500ml
        
        2 John Shop - KES 70 (12 min) ★★★★
           Milk 500ml
        
        3 Fresh Mart - KES 67 (15 min) ★★★★★
           Milk 500ml
        
        Reply with number (1, 2, or 3)"
  
  Buyer: "1"

Step 3: Shop profile
  [Fetch seller details]
  [Fetch all products from seller]
  
  Bot: "📍 Mama Akinyi Store
        ★★★★★ 4.8 (45 reviews)
        📦 28 orders today
        ⏱️ Avg response: 2 min
        
        Products:
        1 Milk 500ml - KES 65
        2 Eggs - KES 200
        3 Bread - KES 50
        
        Reply with product number
        Or send 'more' to see more"
  
  Buyer: "1"

Step 4: Product details
  Bot: "Milk 500ml
        Price: KES 65
        Stock: 30 available
        
        1 Add to cart
        2 More items
        3 Shop profile"
  
  Buyer: "1"

Step 5: Quantity
  Bot: "How many?
        1 x1 (KES 65)
        2 x2 (KES 130)
        3 x3 (KES 195)
        4 Other (type number)"
  
  Buyer: "2"

Step 6: Add to cart
  [Store in session]
  {
    seller_id: 1,
    items: [
      {product_id: 1, name: 'Milk 500ml', price: 65, qty: 2}
    ],
    total: 130,
    timestamp: now
  }
  
  Bot: "✓ Added to cart!
        
        Cart:
        1 Milk 500ml x2 - KES 130
        
        1 Add more
        2 Remove item
        3 Update qty
        4 Checkout"
```

**Database operations:**
```
SELECT p.*, s.rating, s.response_time_avg
FROM products p
JOIN sellers s ON p.seller_id = s.id
WHERE p.name LIKE '%milk%' AND p.active = TRUE AND s.zone = 'Kiambu CBD'
ORDER BY p.price ASC, s.rating DESC
```

---

### FLOW 4: Checkout & Payment

**Input:** Buyer sends "4" (checkout)
**Output:** M-Pesa STK push to seller's account

```
Step 1: Delivery location
  Bot: "Delivery location?
        1 Saved
        2 Share live location
        3 Pin location
        4 Type address"
  
  Buyer: "2"
  [Receives GPS coordinates]
  
  Bot: "✓ Location saved"

Step 2: Order summary
  [Calculate totals]
  total_items = 130
  delivery_fee = 50
  total = 180
  
  Bot: "Order summary:
        
        Mama Akinyi Store
        Milk 500ml x2 - KES 130
        
        Delivery - KES 50
        Total - KES 180
        
        Confirm? YES/NO"
  
  Buyer: "YES"

Step 3: Generate order
  [Create unique order ID]
  order_id = "ORD-" + timestamp + random
  
  [INSERT INTO orders]
  INSERT INTO orders (order_id, buyer_phone, seller_id, items, total_amount, status, delivery_location)
  VALUES ('ORD-1234567890-abc', '+254712345678', 1, '[...]', 180, 'pending_payment', '[...]')
  
  [Reserve stock for 5 minutes]
  UPDATE products SET stock = stock - 2 WHERE id = 1
  [Set timeout to release stock if payment fails]

Step 4: M-Pesa payment
  [Get seller's payment account]
  SELECT payment_method, payment_account FROM sellers WHERE id = 1
  Result: paybill, "123456:1234567890"
  
  [Initiate STK push]
  POST to M-Pesa Daraja:
  {
    "BusinessShortCode": "123456",
    "Password": "[encrypted]",
    "Timestamp": "[timestamp]",
    "TransactionType": "CustomerPayBillOnline",
    "Amount": 180,
    "PartyA": "+254712345678",
    "PartyB": "123456",
    "PhoneNumber": "+254712345678",
    "CallBackURL": "https://platform.com/mpesa/callback",
    "AccountReference": "ORD-1234567890-abc",
    "TransactionDesc": "Milk 500ml x2"
  }
  
  Bot: "💳 Paying KES 180 to Mama Akinyi
        [M-Pesa STK push appears on buyer's phone]"

Step 5: Buyer enters M-Pesa PIN
  [M-Pesa processes payment]
  [M-Pesa sends IPN webhook]

Step 6: Payment confirmation
  [Receive IPN webhook]
  {
    "TransactionType": "Pay Bill Online",
    "TransID": "RB123456789",
    "TransTime": "20230101120000",
    "TransAmount": 180,
    "BusinessShortCode": "123456",
    "BillRefNumber": "ORD-1234567890-abc",
    "InvoiceNumber": "",
    "OrgAccountBalance": "50000",
    "ThirdPartyTransID": "",
    "MSISDN": "254712345678",
    "FirstName": "John",
    "MiddleName": "",
    "LastName": "Doe"
  }
  
  [Verify webhook signature]
  [UPDATE order status to PAID]
  UPDATE orders SET status = 'paid', payment_reference = 'RB123456789', paid_at = NOW()
  WHERE order_id = 'ORD-1234567890-abc'
  
  [INSERT payment record]
  INSERT INTO payments (reference, method, amount, seller_id, buyer_phone, order_id, status)
  VALUES ('RB123456789', 'paybill', 180, 1, '+254712345678', 'ORD-1234567890-abc', 'confirmed')
  
  Bot: "✅ Payment confirmed!
        
        Order ID: ORD-1234567890-abc
        Status: Waiting for seller confirmation
        
        Seller will confirm in 2 minutes
        You'll get a notification when rider is assigned"
  
  [Notify seller]
  Bot (to seller): "🔔 NEW ORDER
                   Order #ORD-1234567890-abc
                   Milk x2
                   KES 180
                   Paid ✓
                   Accept? YES/NO"
```

**Database operations:**
```
INSERT INTO orders (...) VALUES (...)
UPDATE products SET stock = stock - 2 WHERE id = 1
UPDATE orders SET status = 'paid' WHERE order_id = 'ORD-1234567890-abc'
INSERT INTO payments (...) VALUES (...)
```

---

### FLOW 5: Seller Confirms Order

**Input:** Seller sends "YES"
**Output:** Rider is assigned

```
Step 1: Seller confirmation
  Seller: "YES"
  
  [UPDATE order status]
  UPDATE orders SET status = 'confirmed', confirmed_at = NOW()
  WHERE order_id = 'ORD-1234567890-abc'
  
  Bot: "✓ Order confirmed!
        
        Order ID: ORD-1234567890-abc
        Rider will be assigned in 30 seconds"

Step 2: Rider assignment algorithm
  [Get order details]
  SELECT * FROM orders WHERE order_id = 'ORD-1234567890-abc'
  
  [Get available riders in same zone]
  SELECT * FROM riders
  WHERE zone = 'Kiambu CBD'
  AND status = 'available'
  AND current_order_id IS NULL
  ORDER BY rating DESC
  
  [Rank riders by]
  - Distance to pickup (closest first)
  - Seller's trusted riders (priority)
  - Rating (highest first)
  - Current load (fewest orders first)
  
  [Assign to top rider]
  UPDATE riders SET current_order_id = 'ORD-1234567890-abc', status = 'on_delivery'
  WHERE id = [rider_id]
  
  UPDATE orders SET rider_phone = [rider_phone], status = 'rider_assigned'
  WHERE order_id = 'ORD-1234567890-abc'

Step 3: Notify rider
  Bot (to rider): "📦 NEW DELIVERY
                  
                  Pickup: Mama Akinyi Store, Kiambu CBD
                  Deliver: Makongeni Estate
                  
                  Milk x2 - KES 180
                  Delivery Fee: KES 50
                  
                  Accept? YES/NO"
  
  Rider: "YES"
  
  [UPDATE rider status]
  UPDATE riders SET status = 'on_delivery' WHERE id = [rider_id]
  
  Bot: "✓ Accepted!
        Go to [map link]
        Reply 'pickup' when ready"

Step 4: Pickup
  Rider: "pickup"
  
  [UPDATE order status]
  UPDATE orders SET status = 'on_delivery' WHERE order_id = 'ORD-1234567890-abc'
  
  Bot: "✓ Picked up!
        Go to [map link]
        Reply 'delivered' when done"

Step 5: Delivery
  Rider: "delivered"
  
  [UPDATE order status]
  UPDATE orders SET status = 'delivered', delivered_at = NOW()
  WHERE order_id = 'ORD-1234567890-abc'
  
  [UPDATE rider status]
  UPDATE riders SET status = 'available', current_order_id = NULL
  WHERE id = [rider_id]
  
  [Credit rider earnings]
  UPDATE riders SET earnings_today = earnings_today + 50, earnings_total = earnings_total + 50
  WHERE id = [rider_id]
  
  [Send M-Pesa to rider]
  POST to M-Pesa Daraja:
  {
    "BusinessShortCode": "[rider_paybill]",
    "Amount": 50,
    "PartyA": "254712345678",
    "PartyB": "[rider_paybill]",
    "PhoneNumber": "[rider_phone]",
    "AccountReference": "ORD-1234567890-abc-RIDER"
  }
  
  Bot (to rider): "✓ Complete!
                  Earned KES 50
                  Total today: KES 450
                  [Money credited to M-Pesa]"
  
  Bot (to buyer): "🎉 Your order arrived!
                  Milk x2 - KES 180
                  Confirm received? YES/NO"

Step 6: Buyer confirms
  Buyer: "YES"
  
  [UPDATE order status]
  UPDATE orders SET status = 'completed' WHERE order_id = 'ORD-1234567890-abc'
  
  Bot: "✓ Order complete!
        
        Rate your experience:
        1 ⭐
        2 ⭐⭐
        3 ⭐⭐⭐
        4 ⭐⭐⭐⭐
        5 ⭐⭐⭐⭐⭐"
  
  Buyer: "5"
  
  [UPDATE seller rating]
  SELECT AVG(rating) FROM orders WHERE seller_id = 1 AND status = 'completed'
  UPDATE sellers SET rating = [avg_rating] WHERE id = 1
  
  Bot: "✓ Thanks for the 5-star rating!
        Your feedback helps Mama Akinyi improve.
        
        Want to order again?
        Send 'milk' to search"
```

**Database operations:**
```
UPDATE orders SET status = 'confirmed' WHERE order_id = 'ORD-1234567890-abc'
UPDATE riders SET current_order_id = 'ORD-1234567890-abc', status = 'on_delivery'
UPDATE orders SET rider_phone = [phone], status = 'rider_assigned'
UPDATE orders SET status = 'on_delivery'
UPDATE orders SET status = 'delivered', delivered_at = NOW()
UPDATE riders SET status = 'available', current_order_id = NULL
UPDATE riders SET earnings_today = earnings_today + 50
UPDATE orders SET status = 'completed'
UPDATE sellers SET rating = [avg_rating]
```

---

### FLOW 6: Dispute Resolution

**Input:** Buyer sends "complaint"
**Output:** Admin investigates and resolves

```
Step 1: Complaint initiation
  Buyer: "complaint"
  
  Bot: "What's the issue?
        1 Missing item
        2 Wrong item
        3 Rider issue
        4 Quality issue
        5 Refund"
  
  Buyer: "1"
  
  Bot: "Describe the issue:"
  
  Buyer: "Ordered 2 milk but received 1"
  
  [INSERT INTO disputes]
  INSERT INTO disputes (order_id, type, reported_by, description, status)
  VALUES ('ORD-1234567890-abc', 'missing_item', 'buyer', 'Ordered 2 milk but received 1', 'open')
  
  Bot: "✓ Ticket opened
        Dispute ID: DSP-123456
        Admin will review within 4 hours"

Step 2: Admin notification
  [Admin gets alert]
  Admin Dashboard: "New Dispute
                   DSP-123456
                   Buyer: +254712345678
                   Seller: Mama Akinyi
                   Type: Missing item
                   Amount: KES 180"

Step 3: Admin investigation
  [Admin reviews order details]
  [Admin contacts seller]
  
  Bot (to seller): "⚠️ Dispute filed
                   Order: ORD-1234567890-abc
                   Issue: Missing item
                   
                   Your response?
                   1 Rider delivered correctly
                   2 Buyer cancelled
                   3 Other (explain)"
  
  Seller: "1"
  
  [Admin contacts buyer]
  
  Bot (to buyer): "Can you provide proof?
                  1 Photo of items
                  2 Photo of receipt
                  3 Other"

Step 4: Resolution
  [Admin reviews evidence]
  [Admin makes decision]
  
  Admin: "Resolve dispute DSP-123456 as refund"
  
  [UPDATE dispute status]
  UPDATE disputes SET status = 'resolved', resolution = 'refund', resolved_at = NOW()
  WHERE id = 123456
  
  [Send refund to buyer]
  POST to M-Pesa Daraja:
  {
    "BusinessShortCode": "600000",
    "Password": "[encrypted]",
    "Timestamp": "[timestamp]",
    "TransactionType": "CustomerPayBillOnline",
    "Amount": 180,
    "PartyA": "254712345678",
    "PartyB": "600000",
    "PhoneNumber": "+254712345678",
    "CallBackURL": "https://platform.com/mpesa/callback",
    "AccountReference": "REFUND-DSP-123456"
  }
  
  Bot (to buyer): "✓ Dispute resolved
                  Refund: KES 180
                  [Money sent to M-Pesa]"
  
  Bot (to seller): "Dispute DSP-123456 resolved
                   Resolution: Refund issued
                   Amount: KES 180"
  
  [UPDATE seller rating]
  [Deduct from seller's next payment or account balance]
```

**Database operations:**
```
INSERT INTO disputes (...) VALUES (...)
UPDATE disputes SET status = 'resolved', resolution = 'refund'
```

---

## 🔐 Security

### Payment Verification

```
1. Verify webhook signature
   - Check HMAC-SHA256 signature
   - Compare with M-Pesa public key

2. Verify order reference
   - Check order exists in database
   - Check order is in pending_payment status
   - Check amount matches

3. Verify idempotency
   - Check payment reference doesn't already exist
   - Prevent double-charging

4. Verify seller account
   - Check seller is verified
   - Check seller is active
   - Check seller hasn't been suspended
```

### Phone Verification

```
1. Extract phone from WhatsApp
   - Get from message metadata
   - Verify format (254XXXXXXXXX)

2. Check if registered
   - Query sellers/buyers/riders table
   - If not registered: create profile

3. Verify on critical operations
   - Confirm phone on first order
   - Confirm phone on payment
   - Confirm phone on withdrawal
```

---

## 📊 Monitoring & Alerts

### Critical Metrics

```
Payment Success Rate
- Target: >99.5%
- Alert if: <95%
- Action: Investigate M-Pesa integration

Seller Onboarding Time
- Target: <3 minutes
- Alert if: >5 minutes
- Action: Simplify flow

Dispute Rate
- Target: <1%
- Alert if: >5%
- Action: Quality issues

Seller Retention (30-day)
- Target: >80%
- Alert if: <50%
- Action: Sellers not making money

Buyer Retention (30-day)
- Target: >60%
- Alert if: <30%
- Action: Product not useful
```

### Admin Dashboard

```
Real-time metrics:
- Active sellers
- Active buyers
- Active riders
- Orders in progress
- Payment success rate
- Dispute rate
- Average delivery time
- Average seller response time

Manual actions:
- Resolve disputes
- Suspend sellers
- Suspend buyers
- Suspend riders
- View order history
- View payment history
```

---

## 🚀 Deployment

### Prerequisites

```
- Node.js 18+
- MySQL 8+
- WhatsApp Business API account
- M-Pesa Daraja credentials
- Cloudinary account
```

### Environment Variables

```
WHATSAPP_API_URL=https://graph.instagram.com/v18.0
WHATSAPP_PHONE_ID=123456789
WHATSAPP_ACCESS_TOKEN=xxx
WHATSAPP_WEBHOOK_TOKEN=xxx

MPESA_CONSUMER_KEY=xxx
MPESA_CONSUMER_SECRET=xxx
MPESA_SHORTCODE=123456
MPESA_PASSKEY=xxx

CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx

DATABASE_URL=mysql://user:password@localhost:3306/shop_os
REDIS_URL=redis://localhost:6379

NODE_ENV=production
PORT=3000
```

### Deployment Steps

```
1. Clone repository
2. Install dependencies: npm install
3. Create database: mysql < schema.sql
4. Configure environment variables
5. Start server: npm start
6. Verify webhook: Send test message to bot
7. Monitor logs: tail -f logs/app.log
```

---

**This is the complete technical specification. Everything else is implementation detail.**
