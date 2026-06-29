-- WhatsApp Shop OS MAX - Database Schema
-- Complete schema with all tables, indexes, and relationships

-- Create database
CREATE DATABASE IF NOT EXISTS shop_os_max;
USE shop_os_max;

-- 1. Sellers Table
CREATE TABLE sellers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255),
  shop_name VARCHAR(255) NOT NULL,
  shop_description TEXT,
  shop_category ENUM('grocery','clothes','shoes','electronics','restaurant','pharmacy','salon','hotel','other') DEFAULT 'other',
  zone VARCHAR(100) NOT NULL,
  
  -- Ratings & Stats
  rating DECIMAL(3,2) DEFAULT 0,
  total_orders INT DEFAULT 0,
  response_time_avg INT DEFAULT 0,
  
  -- Payment
  payment_method ENUM('paybill','till','pochi','phone') NOT NULL,
  payment_account VARCHAR(255) NOT NULL,
  payment_verified BOOLEAN DEFAULT FALSE,
  payment_verified_at TIMESTAMP NULL,
  
  -- Riders
  trusted_riders JSON,
  max_riders INT DEFAULT 5,
  
  -- Referrals
  referral_code VARCHAR(50) UNIQUE,
  referral_bonus INT DEFAULT 5,
  total_referral_earnings INT DEFAULT 0,
  
  -- Status
  status ENUM('active','suspended','inactive','vacation') DEFAULT 'active',
  suspension_reason VARCHAR(255),
  suspension_until TIMESTAMP NULL,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_phone (phone),
  INDEX idx_zone (zone),
  INDEX idx_status (status),
  INDEX idx_referral_code (referral_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Products Table
CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  seller_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price INT NOT NULL,
  stock INT DEFAULT 0,
  
  -- Images & Media
  image_url VARCHAR(500),
  gallery_urls JSON,
  video_url VARCHAR(500),
  
  -- Variants
  has_variants BOOLEAN DEFAULT FALSE,
  variants JSON,
  variant_prices JSON,
  
  -- Attributes
  sku VARCHAR(100),
  barcode VARCHAR(100),
  category VARCHAR(100),
  weight INT,
  dimensions JSON,
  
  -- Status
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE,
  INDEX idx_seller_id (seller_id),
  INDEX idx_name (name),
  INDEX idx_category (category),
  INDEX idx_active (active),
  FULLTEXT INDEX ft_name_description (name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Buyers Table
CREATE TABLE buyers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255),
  zone VARCHAR(100),
  
  -- Favorites
  favorite_sellers JSON,
  favorite_products JSON,
  saved_addresses JSON,
  
  -- Stats
  total_orders INT DEFAULT 0,
  last_order_date TIMESTAMP NULL,
  total_spent INT DEFAULT 0,
  
  -- Referrals
  referral_code VARCHAR(50) UNIQUE,
  referral_balance INT DEFAULT 0,
  referral_bonus INT DEFAULT 50,
  total_referral_earnings INT DEFAULT 0,
  
  -- Status
  status ENUM('active','inactive','suspended') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_phone (phone),
  INDEX idx_zone (zone),
  INDEX idx_referral_code (referral_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Orders Table
CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id VARCHAR(50) UNIQUE NOT NULL,
  buyer_phone VARCHAR(20) NOT NULL,
  seller_id INT NOT NULL,
  
  -- Items
  items JSON NOT NULL,
  total_amount INT NOT NULL,
  
  -- Status
  status ENUM('pending_payment','paid','confirmed','rider_assigned','on_delivery','delivered','cancelled','disputed') DEFAULT 'pending_payment',
  
  -- Payment
  payment_reference VARCHAR(255),
  payment_method VARCHAR(50),
  payment_verified BOOLEAN DEFAULT FALSE,
  
  -- Delivery
  rider_phone VARCHAR(20),
  delivery_location JSON,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMP NULL,
  confirmed_at TIMESTAMP NULL,
  rider_assigned_at TIMESTAMP NULL,
  delivered_at TIMESTAMP NULL,
  
  -- Notes
  notes TEXT,
  
  FOREIGN KEY (seller_id) REFERENCES sellers(id),
  INDEX idx_order_id (order_id),
  INDEX idx_buyer_phone (buyer_phone),
  INDEX idx_seller_id (seller_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  INDEX idx_payment_reference (payment_reference)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Riders Table
CREATE TABLE riders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255),
  zone VARCHAR(100),
  
  -- Current Status
  current_order_id VARCHAR(50),
  status ENUM('available','on_delivery','offline') DEFAULT 'offline',
  
  -- Ratings & Stats
  rating DECIMAL(3,2) DEFAULT 0,
  total_deliveries INT DEFAULT 0,
  earnings_today INT DEFAULT 0,
  earnings_total INT DEFAULT 0,
  
  -- Seller Relationships
  trusted_by_sellers JSON,
  preferred_zones JSON,
  
  -- Referrals
  referral_code VARCHAR(50) UNIQUE,
  referral_bonus INT DEFAULT 200,
  total_referral_earnings INT DEFAULT 0,
  
  -- Location
  last_location JSON,
  last_location_update TIMESTAMP NULL,
  
  -- Status
  suspension_reason VARCHAR(255),
  suspension_until TIMESTAMP NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_phone (phone),
  INDEX idx_zone (zone),
  INDEX idx_status (status),
  INDEX idx_referral_code (referral_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Disputes Table
CREATE TABLE disputes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id VARCHAR(50) NOT NULL,
  type ENUM('missing_item','wrong_item','rider_issue','quality_issue','refund','other') NOT NULL,
  reported_by ENUM('buyer','seller','rider') NOT NULL,
  description TEXT,
  
  -- Evidence
  evidence JSON,
  
  -- Status
  status ENUM('open','investigating','resolved','closed','appealed') DEFAULT 'open',
  resolution VARCHAR(255),
  resolution_amount INT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  acknowledged_at TIMESTAMP NULL,
  investigated_at TIMESTAMP NULL,
  resolved_at TIMESTAMP NULL,
  
  -- Admin
  assigned_to_admin VARCHAR(255),
  admin_notes TEXT,
  
  INDEX idx_order_id (order_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Payments Table
CREATE TABLE payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  reference VARCHAR(255) UNIQUE NOT NULL,
  method VARCHAR(50) NOT NULL,
  amount INT NOT NULL,
  seller_id INT,
  buyer_phone VARCHAR(20),
  order_id VARCHAR(50),
  
  -- Status
  status ENUM('pending','confirmed','failed','refunded') DEFAULT 'pending',
  
  -- Metadata
  mpesa_transaction_id VARCHAR(255),
  mpesa_receipt_number VARCHAR(255),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  confirmed_at TIMESTAMP NULL,
  
  FOREIGN KEY (seller_id) REFERENCES sellers(id),
  INDEX idx_reference (reference),
  INDEX idx_order_id (order_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Referrals Table
CREATE TABLE referrals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  referrer_type ENUM('seller','buyer','rider') NOT NULL,
  referrer_id INT,
  referrer_phone VARCHAR(20),
  
  referred_type ENUM('buyer','rider') NOT NULL,
  referred_id INT,
  referred_phone VARCHAR(20),
  
  bonus_amount INT NOT NULL,
  bonus_status ENUM('pending','credited','failed') DEFAULT 'pending',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  credited_at TIMESTAMP NULL,
  
  INDEX idx_referrer_phone (referrer_phone),
  INDEX idx_referred_phone (referred_phone),
  INDEX idx_bonus_status (bonus_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Sessions Table
CREATE TABLE sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_phone VARCHAR(20) NOT NULL,
  user_type ENUM('seller','buyer','rider','admin') NOT NULL,
  
  -- Session Data
  cart_items JSON,
  current_flow VARCHAR(100),
  flow_data JSON,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  
  INDEX idx_user_phone (user_phone),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Metrics Table
CREATE TABLE metrics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  metric_type VARCHAR(100) NOT NULL,
  metric_name VARCHAR(255) NOT NULL,
  metric_value DECIMAL(10,2),
  
  -- Context
  seller_id INT,
  buyer_phone VARCHAR(20),
  rider_phone VARCHAR(20),
  
  -- Timestamp
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_metric_type (metric_type),
  INDEX idx_recorded_at (recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Audit Log Table
CREATE TABLE audit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100),
  entity_id INT,
  
  -- User
  user_phone VARCHAR(20),
  user_type ENUM('seller','buyer','rider','admin'),
  
  -- Changes
  old_values JSON,
  new_values JSON,
  
  -- Timestamp
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_entity_type (entity_type),
  INDEX idx_user_phone (user_phone),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create indexes for performance
CREATE INDEX idx_orders_seller_created ON orders(seller_id, created_at);
CREATE INDEX idx_orders_buyer_created ON orders(buyer_phone, created_at);
CREATE INDEX idx_products_seller_active ON products(seller_id, active);
CREATE INDEX idx_disputes_status_created ON disputes(status, created_at);
CREATE INDEX idx_payments_status_created ON payments(status, created_at);

-- Set default charset for all tables
ALTER DATABASE shop_os_max CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
