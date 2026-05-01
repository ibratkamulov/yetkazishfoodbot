# 🍔 Fastfood Bot v2 — Production-Ready Food Delivery System

Telegram-based food delivery platform built with **NestJS + TypeScript + PostgreSQL + Redis + Telegraf**.
Designed for 24/7 production use, multi-instance scaling, and clean modular architecture.

## ✨ Features

- 📱 Telegram bot (Telegraf) with phone/location onboarding
- 🛒 Full cart system (Redis-backed, persistent across restarts)
- 📦 Order lifecycle: PENDING → ACCEPTED → PREPARING → ON_THE_WAY → DELIVERED
- 👨‍💼 Admin: Telegram commands (`/orders`, `/stats`, `/deliver`) + REST API
- 💳 Payment abstraction layer: Click, Payme, Stripe, Cash
- 🗄 PostgreSQL + Prisma ORM with full relational schema
- 🔴 Redis for sessions and cart (multi-instance safe)
- 📡 Event-driven notifications (admin gets new orders instantly)
- 📁 Storage abstraction (Local / S3-compatible)
- 🔒 Security: Helmet, ValidationPipe, ThrottlerGuard, ApiKey guards
- 📝 Winston logging + global exception filter
- 🐳 Docker + docker-compose + PM2 ready

## 🏗 Architecture

```
src/
├── common/              # Config, guards, filters, interceptors, logger
├── prisma/              # PrismaService (DB)
├── redis/               # RedisService (ioredis)
├── user/                # User module
├── category/            # Category module
├── product/             # Product module + REST CRUD
├── cart/                # Redis-backed cart
├── order/               # Order lifecycle, transactional checkout
├── payment/             # Strategy pattern: Click / Payme / Stripe
├── admin/               # Admin REST + Telegram commands
├── storage/             # File storage abstraction
├── notification/        # Event-driven Telegram notifications
└── bot/                 # Telegram bot logic
    ├── bot.update.ts
    ├── keyboards/
    ├── middlewares/
    └── i18n/
```

## 🚀 Quick Start

### Option 1 — Docker (recommended)

```bash
# 1. Copy env
cp .env.example .env
# Edit .env: BOT_TOKEN, BOT_ADMIN_IDS, ADMIN_API_KEY

# 2. Start everything (postgres + redis + app)
docker-compose up -d --build

# 3. Run migrations + seed
docker exec fastfood_app npx prisma migrate deploy
docker exec fastfood_app npx prisma db seed

# 4. Logs
docker-compose logs -f app
```

### Option 2 — Local development

```bash
npm install

# Start postgres + redis (using docker-compose)
docker-compose up -d postgres redis

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed initial data
npm run prisma:seed

# Start in dev mode
npm run start:dev
```

### Option 3 — Production with PM2

```bash
npm install
npm run build
npm run prisma:deploy
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 🧩 Key Modules Explained

| Module | Responsibility |
|--------|----------------|
| **PrismaModule** | Singleton DB connection, lifecycle hooks |
| **RedisModule** | ioredis client, session + cart storage |
| **UserModule** | Telegram-linked user persistence, registration check |
| **CategoryModule** | Categories CRUD (REST) + bot lookup |
| **ProductModule** | Products CRUD (REST), filtered by category |
| **CartModule** | Add/remove/update/clear, Redis with TTL=3 days |
| **OrderModule** | Transactional checkout (cart → DB), status updates, events |
| **PaymentModule** | `IPaymentProvider` interface — plug in Click/Payme/Stripe |
| **AdminModule** | `/orders`, `/stats`, `/deliver` Telegram + REST controllers |
| **NotificationModule** | Listens to `order.created`/`order.status_changed` events |
| **StorageModule** | Local FS or S3 — swap via env |
| **BotModule** | Single update class, delegates to services |

## 🔑 Environment Variables

See `.env.example`. Critical ones:

| Var | Description |
|-----|-------------|
| `BOT_TOKEN` | From @BotFather |
| `BOT_ADMIN_IDS` | Comma-separated Telegram user IDs of admins |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_HOST` / `REDIS_PORT` | Redis location |
| `ADMIN_API_KEY` | Required for `/api/admin/*` and product/category mutations |
| `STORAGE_PROVIDER` | `local` or `s3` |
| `CLICK_*` / `PAYME_*` / `STRIPE_*` | Payment credentials |

## 📡 REST API

All mutating endpoints require `x-api-key: <ADMIN_API_KEY>` header.

```
GET    /api/categories
POST   /api/categories                 (admin)
PATCH  /api/categories/:id             (admin)
DELETE /api/categories/:id             (admin)

GET    /api/products
GET    /api/products/:id
POST   /api/products                   (admin)
PATCH  /api/products/:id               (admin)
DELETE /api/products/:id               (admin)

GET    /api/admin/orders/pending       (admin)
GET    /api/admin/orders/:id           (admin)
GET    /api/admin/stats                (admin)
PATCH  /api/admin/orders/:id/status    (admin)
```

## 🤖 Bot Commands

**User**:
- `/start` — onboarding (phone + location)
- Tap category → see products
- Tap "Add to cart" → product added
- Tap "🛒 Savat" → view/edit cart
- Tap "Buyurtma berish" → choose payment → order placed

**Admin** (only users in `BOT_ADMIN_IDS`):
- `/orders` — list pending orders with accept/reject buttons
- `/deliver <orderNumber>` — mark as delivered
- `/stats` — total users, orders, revenue

## 💳 Adding a New Payment Provider

Implement `IPaymentProvider`:

```ts
@Injectable()
export class MyProvider implements IPaymentProvider {
  readonly name = PaymentProvider.MYNEW;
  async init(input) { /* ... */ }
  async verify(externalId) { /* ... */ }
}
```

Then register in `payment.module.ts` and add the enum value to `prisma/schema.prisma`.

## 📈 Scaling Notes

- **Sessions in Redis** → safe to run multiple Node instances behind a load balancer
- **Cart in Redis** → same; user can land on any pod
- **Order events** via `EventEmitter` → for cross-instance, swap to BullMQ/Redis Streams
- **PM2 cluster mode** uses all CPU cores (see `ecosystem.config.js`)
- **DB connection pooling** via Prisma — tune `DATABASE_URL?connection_limit=N`
- **Telegram webhook** (instead of polling) recommended for high volume — extend bot module

## 🛡 Security

- Helmet HTTP headers
- `class-validator` strict DTOs (whitelist + forbidNonWhitelisted)
- `ThrottlerGuard` global rate limit
- `ApiKeyGuard` for admin REST
- `TelegramAdminGuard` for admin bot commands
- Env validation at boot via `validateEnv`

## 📝 Logs

Winston writes to:
- Console (colorized)
- `logs/error.log`
- `logs/combined.log`

Rotation: 10 MB × 5 files.

## 🧪 Testing

```bash
npm test           # Unit
npm run test:e2e   # E2E
npm run test:cov   # Coverage
```

## 📜 License

MIT
