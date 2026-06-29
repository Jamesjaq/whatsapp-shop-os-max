# WhatsApp Shop OS MAX

**The Operating System for Neighborhood Commerce in Kenya**

> If 20 shops in Kiambu used this tomorrow, would it survive a month without manual intervention?

This is the test. Everything else is distraction.

---

## 🎯 What This Is

WhatsApp Shop OS MAX is **not** a marketplace. It's an invisible layer that turns WhatsApp into a complete commerce operating system for informal sellers, buyers, and riders.

**No apps. No websites. No training. Just WhatsApp.**

```
Buyer: "milk"
↓
Bot: "Mama Akinyi KES 65 (8 min) ★★★★★"
↓
Buyer: "1"
↓
Bot: "Quantity?"
↓
Buyer: "2"
↓
Bot: "Total KES 130. Confirm?"
↓
Buyer: "yes"
↓
[M-Pesa STK to seller's Paybill]
↓
Seller receives: "Order #8139. Accept?"
↓
Rider assigned
↓
Delivered
```

**That's the entire flow.** No friction. No downloads. No accounts.

---

## 🏗️ Architecture

### Five Actors

1. **Buyer** - Sends messages, searches, orders, pays
2. **Seller** - Registers shop, adds products, confirms orders, gets paid
3. **Rider** - Picks up, delivers, gets paid
4. **Admin** - Handles disputes, monitors health, detects fraud
5. **WhatsApp Bot** - The invisible orchestrator

### Core Flows

#### 1. Seller Onboarding (3 minutes)

```
Seller: "hi"
Bot: "Welcome! 1 Register Shop 2 Browse 3 Become Rider"
Seller: "1"
Bot: "Shop name?"
Seller: "Mama Akinyi Store"
Bot: "Town?"
Seller: "Kiambu"
Bot: "Zone? 1 CBD 2 Kangoya 3 Ndumberi 4 Tinganga"
Seller: "1"
Bot: "Payment method? 1 Paybill 2 Till 3 Pochi 4 Phone"
Seller: "1"
Bot: "Paybill number?"
Seller: "123456"
Bot: "Account number?"
Seller: "1234567890"
Bot: "Confirm: 1234567890"
Seller: "yes"
Bot: "Verifying... ✓ Payment verified! You're live!"
```

**What happens:**
- Seller phone verified (unique)
- Payment account stored (encrypted)
- Test transaction sent to verify account
- Seller is immediately live
- Can start receiving orders

#### 2. Seller Adds Products

```
Seller: "products"
Bot: "1 Add 2 Edit 3 Remove 4 Update Stock 5 Bulk Upload"
Seller: "1"
Bot: "Product name?"
Seller: "Milk 500ml"
Bot: "Price (KES)?"
Seller: "65"
Bot: "Stock quantity?"
Seller: "30"
Bot: "Upload image?"
Seller: [sends image]
Bot: "✓ Product created! Milk 500ml - KES 65 (Stock: 30)"
```

**What happens:**
- Product created instantly
- Image uploaded to Cloudinary
- Product is searchable immediately
- Stock is tracked automatically

#### 3. Buyer Searches & Orders

```
Buyer: "milk"
Bot: "Available nearby:
1 Mama Akinyi - KES 65 (8 min) ★★★★★
2 John Shop - KES 70 (12 min) ★★★★
3 Fresh Mart - KES 67 (15 min) ★★★★★"
Buyer: "1"
Bot: "Milk 500ml - KES 65 - Stock available
1 Add 2 More items 3 Shop profile"
Buyer: "1"
Bot: "Quantity?"
Buyer: "2"
Bot: "Cart: Milk x2 - KES 130
1 Add item 2 Remove 3 Update qty 4 Checkout"
Buyer: "4"
Bot: "Delivery location?
1 Saved 2 Live location 3 Pin 4 Type address"
Buyer: "2"
Bot: "[receives location]
Order summary:
Milk x2 - KES 130
Delivery - KES 50
Total - KES 180
Confirm? YES/NO"
Buyer: "YES"
Bot: "[M-Pesa STK push to seller's Paybill]"
```

**What happens:**
- Search is zone-based (only nearby sellers)
- Results show price, delivery time, rating
- Cart is session-based (survives app restart)
- Location is GPS + text description
- M-Pesa payment goes directly to seller

#### 4. Seller Receives Order

```
Bot: "🔔 NEW ORDER
Order #8139
Milk x2
KES 180
Paid ✓
Accept? YES/NO"
Seller: "YES"
Bot: "✓ Confirmed! Rider assigned in 30 seconds"
```

**What happens:**
- Seller has 5 minutes to respond
- If no response: auto-cancel, buyer refunded
- If rejected: buyer notified, can order from another shop
- Once confirmed: rider assignment begins

#### 5. Rider Gets Order

```
Bot: "📦 NEW DELIVERY
Pickup: Mama Akinyi, Kiambu CBD
Deliver: Makongeni Estate
Milk x2 - KES 180
Fee: KES 50
Accept? YES/NO"
Rider: "YES"
Bot: "✓ Accepted! Go to [map link]
Reply 'pickup' when ready"
Rider: "pickup"
Bot: "✓ Picked up! Go to [map link]
Reply 'delivered' when done"
Rider: "delivered"
Bot: "✓ Complete! Earned KES 50
[Money credited to rider's M-Pesa]"
```

**What happens:**
- Rider assignment is zone-based + availability
- Rider can accept/decline (no penalty)
- GPS coordinates provided for pickup & delivery
- Payment to rider is instant

#### 6. Buyer Confirms Delivery

```
Bot: "🎉 Your order arrived!
Milk x2 - KES 180
Confirm received? YES/NO"
Buyer: "YES"
Bot: "Rate experience: 1⭐ 2⭐⭐ 3⭐⭐⭐ 4⭐⭐⭐⭐ 5⭐⭐⭐⭐⭐"
Buyer: "5"
Bot: "✓ Thanks! Order complete."
```

**What happens:**
- Buyer confirms receipt
- Rating updates seller's profile
- Order is closed
- Seller can see order history

#### 7. Buyer Saves Favorites

```
Buyer: "save"
Bot: "✓ Mama Akinyi saved to favorites"

Buyer: "favorites"
Bot: "❤️ Your favorites:
1 Mama Akinyi ★★★★★
2 John Shop ★★★★
3 Fresh Mart ★★★★★"
Buyer: "1"
Bot: "[Shows Mama Akinyi's products]"

Buyer: "reorder"
Bot: "Reorder last order?
Milk x2 - KES 130
YES/NO"
Buyer: "YES"
Bot: "[Checkout flow]"
```

**What happens:**
- Favorite shops are saved
- One-tap reorder
- Quick access to previous orders

#### 8. Seller Dashboard

```
Seller: "menu"
Bot: "1 Products 2 Orders 3 Stock 4 Payments 5 Riders 6 Analytics 7 Settings"

Seller: "analytics"
Bot: "TODAY
Revenue: KES 9,500
Orders: 28
Best seller: Milk
Low stock: Bread
Rating: 4.8"
```

**What happens:**
- Real-time sales tracking
- Stock alerts
- Rating visibility
- Payment history

#### 9. Dispute Resolution

```
Buyer: "complaint"
Bot: "Issue?
1 Missing item
2 Wrong item
3 Rider issue
4 Quality issue
5 Refund"
Buyer: "1"
Bot: "✓ Ticket opened
Admin will review within 4 hours"
```

**What happens:**
- Complaint is logged
- Admin gets alert
- Admin investigates
- Resolution: refund, replacement, or credit

---

## 💰 Payment Flow

**This is critical: The platform never owns money.**

```
Buyer pays → Seller's Paybill/Till/Pochi/Phone
           ↓
           Money goes directly to seller
           ↓
           M-Pesa IPN webhook confirms
           ↓
           Order status = PAID
           ↓
           Seller is notified
```

**Why this works:**
- ✅ Seller owns the money (no trust issues)
- ✅ Money is instant (no waiting for payouts)
- ✅ Platform is not a money transmitter (no regulatory risk)
- ✅ KRA sees individual seller transactions (not one mega-account)
- ✅ Works for informal economy (Pochi, personal accounts)

---

## 📊 Database Schema

```
sellers
├── id, phone (unique), name, shop_name
├── zone, rating, total_orders, response_time_avg
├── payment_method (paybill|till|pochi|phone)
├── payment_account, payment_verified
└── status (active|suspended|inactive)

products
├── id, seller_id, name, price, stock
├── image_url (Cloudinary), category, sku
└── created_at, updated_at

buyers
├── id, phone (unique), name, zone
├── favorite_sellers[], favorite_products[]
├── total_orders, last_order_date
└── status (active|inactive)

orders
├── id, order_id (ORD-12345), buyer_phone, seller_id
├── items[], total_amount, status
├── payment_reference, payment_method
├── rider_phone, delivery_location
├── created_at, paid_at, confirmed_at, delivered_at
└── notes

riders
├── id, phone (unique), name, zone
├── current_order_id, status (available|on_delivery|offline)
├── rating, total_deliveries, earnings
└── trusted_by_sellers[]

disputes
├── id, order_id, type, reported_by
├── description, status, resolution
└── created_at, resolved_at
```

---

## 🚀 What's Built (MVP)

✅ **Seller onboarding** (3 minutes)
✅ **Product management** (add/edit/remove/stock)
✅ **Buyer search** (zone-based, by product name)
✅ **Shopping cart** (add/remove/update quantity)
✅ **Checkout** (location, order summary, confirmation)
✅ **M-Pesa integration** (seller-owned accounts, STK push)
✅ **Order management** (seller receives, confirms, tracks)
✅ **Rider assignment** (zone-based, availability)
✅ **Delivery tracking** (pickup, on-way, delivered)
✅ **Ratings** (buyer rates seller/rider)
✅ **Favorites** (save shops, quick reorder)
✅ **Analytics** (seller dashboard, daily revenue)
✅ **Dispute resolution** (complaint, admin review)
✅ **Admin dashboard** (minimal, disputes only)

---

## 🔄 What's NOT Built Yet (V2)

❌ **Inventory reservation** (reserve stock for 5 min)
❌ **Seller offline mode** (open/busy/closed/vacation)
❌ **Delivery radius** (seller sets 1km/3km/5km/10km)
❌ **Minimum order** (seller sets minimum)
❌ **Delivery fees** (flat/distance/zone/custom)
❌ **Scheduled orders** (deliver tomorrow 8AM)
❌ **Broadcasts** (seller sends to followers)
❌ **Bulk upload** (CSV import for products)
❌ **AI layer** (stock predictions, pricing suggestions)
❌ **Advanced analytics** (demand patterns, customer segmentation)

---

## 📈 Success Criteria

**Week 1:**
- 20 sellers onboarded
- 200 buyers using platform
- 100 orders processed
- 0 critical bugs

**Month 1:**
- 50 sellers
- 500 buyers
- 500 orders
- Payment success rate >99%
- Dispute rate <2%
- Seller retention >80%

**Month 3:**
- 200 sellers
- 2,000 buyers
- 5,000 orders
- Seller NPS >40
- Buyer NPS >50

---

## 🛑 Red Flags (Kill Signals)

If any of these happen, the system is broken:

1. **Payment success rate drops below 95%** → Investigate M-Pesa integration
2. **Seller onboarding takes >5 minutes** → Simplify flow
3. **Dispute rate exceeds 5%** → Quality issues
4. **Seller retention drops below 50% after 30 days** → Sellers not making money
5. **Buyer retention drops below 30% after 30 days** → Product not useful
6. **WhatsApp API access revoked** → Regulatory issue

---

## 🛠️ Tech Stack

- **WhatsApp API** - Message handling (Baileys or official API)
- **Node.js** - Backend runtime
- **Express** - HTTP server
- **MySQL** - Database
- **Cloudinary** - Image hosting
- **M-Pesa Daraja** - Payment processing
- **Redis** - Session/cache (optional)

---

## 📋 How to Run

### Prerequisites

```bash
# Install Node.js 18+
# Install MySQL 8+
# Get WhatsApp Business API credentials
# Get Cloudinary credentials
# Get M-Pesa Daraja credentials
```

### Setup

```bash
git clone https://github.com/Jamesjaq/whatsapp-shop-os-max.git
cd whatsapp-shop-os-max

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Fill in your credentials

# Create database
mysql -u root -p < schema.sql

# Start bot
npm start
```

### Test

```bash
# Send message to bot WhatsApp number
# "hi" to start

# Follow seller onboarding flow
# Add a product
# Search from another number
# Place an order
```

---

## 📞 What's Next (Roadmap)

### Phase 1: Stabilization (Week 1-2)
- [ ] Test with 20 sellers in Kiambu
- [ ] Monitor payment failures
- [ ] Track seller onboarding time
- [ ] Measure dispute rate
- [ ] Fix critical bugs

### Phase 2: Expansion (Week 3-4)
- [ ] Add inventory reservation (5-min hold)
- [ ] Add seller offline mode (open/busy/closed)
- [ ] Add delivery radius settings
- [ ] Add minimum order settings
- [ ] Add custom delivery fees

### Phase 3: Growth (Month 2)
- [ ] Expand to 5 zones in Kiambu
- [ ] Add bulk product upload (CSV)
- [ ] Add seller broadcasts
- [ ] Add scheduled orders
- [ ] Add advanced analytics

### Phase 4: Replication (Month 3)
- [ ] Duplicate system for Westlands
- [ ] Duplicate for Nairobi CBD
- [ ] Duplicate for other towns
- [ ] Share rider pool between adjacent zones

### Phase 5: Intelligence (Month 4+)
- [ ] Add AI predictions (stock, demand, pricing)
- [ ] Add customer segmentation
- [ ] Add recommendation engine
- [ ] Add fraud detection
- [ ] Add inventory financing

---

## 🎯 The Test

**If 20 shops in Kiambu used this tomorrow, would it survive a month without you manually intervening?**

- Can sellers onboard in 3 minutes? ✓
- Can they add products in 30 seconds? ✓
- Can buyers find products instantly? ✓
- Does payment work reliably? ✓
- Do orders flow automatically? ✓
- Do riders get assigned correctly? ✓
- Are disputes resolved fairly? ✓
- Do sellers make more money? ✓
- Do buyers get faster delivery? ✓
- Do riders earn consistently? ✓

**If the answer is YES to all, you have something.**

**If NO to any, keep simplifying.**

---

## 📝 License

MIT

---

## 🤝 Contributing

This is a test. If you're a seller in Kiambu, use it. If it works, tell others. If it breaks, tell us.

---

**Built with the belief that the future of commerce in Africa is not marketplaces. It's invisible infrastructure.**

**Everything happens inside WhatsApp. That's the moat.**
