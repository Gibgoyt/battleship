# CloudFlare Tech Stack Integration Guide

## Overview

This guide covers how to optimally use CloudFlare's tech stack with your Astro multi-framework application, focusing on cost efficiency, performance, and when to stay within vs. go outside the CloudFlare ecosystem.

## CloudFlare Services Decision Matrix

### 1. KV (Key-Value Store) - The Cache Layer

#### Perfect for:
- **Server Islands Caching**: Cache your Qwik server island outputs
- **API Response Caching**: Cache external API calls
- **User Preferences**: Store theme, language, settings
- **Session Data**: Lightweight session storage
- **Configuration**: Feature flags, A/B test configs
- **Content Fragments**: Cached HTML snippets, markdown content

#### Implementation Examples:

```typescript
// Cache Qwik server island output
export async function cacheServerIsland(key: string, html: string, ttl = 3600) {
  await KV.put(`island:${key}`, html, { expirationTtl: ttl });
}

// Cache API responses
export async function getCachedData(endpoint: string) {
  const cached = await KV.get(`api:${endpoint}`);
  if (cached) return JSON.parse(cached);
  
  const fresh = await fetch(endpoint);
  const data = await fresh.json();
  await KV.put(`api:${endpoint}`, JSON.stringify(data), { expirationTtl: 300 });
  return data;
}

// User preferences
export async function getUserPrefs(userId: string) {
  return await KV.get(`prefs:${userId}`, "json");
}
```

#### Cost Optimization:
- **Free tier**: 100,000 reads/day, 1,000 writes/day
- Use for high-read, low-write scenarios
- Perfect for caching expensive computations

#### Don't use KV for:
- Large files (>25MB limit)
- Complex queries or relationships
- High-frequency writes
- Transactional data

### 2. D1 (SQL Database) - The Structured Data Layer

#### Perfect for:
- **User Management**: Accounts, profiles, permissions
- **Content Management**: Blog posts, products, inventory
- **Analytics**: Page views, user behavior, metrics
- **Relational Data**: Orders, customers, relationships
- **Application State**: Todo lists, project data, CRM

#### Implementation Examples:

```typescript
// User management
export async function createUser(email: string, name: string) {
  return await D1.prepare("INSERT INTO users (email, name, created_at) VALUES (?, ?, ?)")
    .bind(email, name, new Date().toISOString())
    .run();
}

// Blog/CMS
export async function getBlogPosts(limit = 10) {
  return await D1.prepare("SELECT * FROM posts WHERE published = true ORDER BY created_at DESC LIMIT ?")
    .bind(limit)
    .all();
}

// Analytics
export async function trackPageView(path: string, userId?: string) {
  return await D1.prepare("INSERT INTO page_views (path, user_id, timestamp) VALUES (?, ?, ?)")
    .bind(path, userId, Date.now())
    .run();
}
```

#### Best Practices:
- Use with your SSR pages for dynamic data
- Perfect for server islands that need fresh database data
- Great for your SPA backends (API routes)
- Use prepared statements for performance

#### Architecture Pattern:
```
SSG Pages → No D1 needed
SSR Pages → D1 for dynamic content  
Server Islands → D1 + KV caching layer
SPA API Routes → D1 for data operations
```

### 3. R2 (Object Storage) - The Asset Layer

#### Perfect for:
- **User Uploads**: Profile pictures, documents, media
- **Static Assets**: Images, videos, PDFs, backups
- **Generated Content**: Reports, exports, processed files
- **CDN Replacement**: Serve static assets globally
- **Backup Storage**: Database backups, logs

#### Implementation Examples:

```typescript
// File uploads in your SPA
export async function uploadUserFile(file: File, userId: string) {
  const key = `users/${userId}/${Date.now()}-${file.name}`;
  
  await R2.put(key, file.stream(), {
    httpMetadata: {
      contentType: file.type,
    },
    customMetadata: {
      uploadedBy: userId,
      originalName: file.name,
    },
  });
  
  return `https://your-domain.com/files/${key}`;
}

// Serve optimized images
export async function getOptimizedImage(key: string, width?: number) {
  const object = await R2.get(key);
  if (!object) return null;
  
  // Use CloudFlare Images or similar for on-the-fly optimization
  return object.body;
}
```

#### Integration with Your Architecture:
- **Astro**: Serve optimized images in SSG pages
- **SPA**: Handle file uploads in user dashboards
- **Server Islands**: Dynamic image galleries

#### Cost Benefits:
- Cheaper than S3 for egress
- No egress fees within CloudFlare network
- Perfect replacement for traditional CDN

### 4. Durable Objects - The Stateful Service Layer

#### Perfect for:
- **Real-time Features**: Chat, collaboration, live updates
- **User Sessions**: Shopping carts, temporary state
- **Rate Limiting**: Per-user, per-IP rate limiting
- **Coordinated State**: Multi-user workflows
- **WebSocket Connections**: Real-time SPA features

#### Implementation Examples:

```typescript
// Real-time collaboration (perfect for SPAs)
export class CollaborationRoom {
  constructor(controller: DurableObjectController, env: Env) {
    this.sessions = new Map();
  }

  async fetch(request: Request) {
    if (request.headers.get("Upgrade") === "websocket") {
      const pair = new WebSocketPair();
      this.handleSession(pair[1], request);
      return new Response(null, { status: 101, webSocket: pair[0] });
    }
  }

  handleSession(webSocket: WebSocket, request: Request) {
    // Handle real-time updates for your SPA
  }
}

// Shopping cart state
export class ShoppingCart {
  async addItem(itemId: string, quantity: number) {
    // Persist cart state across sessions
    this.cart.set(itemId, quantity);
    await this.storage.put("cart", Object.fromEntries(this.cart));
  }
}
```

#### Use Cases in Your Architecture:
- **SPA Real-time Features**: Live collaboration in dashboards
- **Stateful Widgets**: Shopping carts, form wizards
- **User Coordination**: Multi-user editing, live comments

#### Cost Consideration:
- More expensive than other CloudFlare services
- Use only when you need guaranteed state consistency
- Perfect for premium features in SPAs

### 5. Hyperdrive - The Database Accelerator

#### Perfect for:
- **External Database Connections**: PostgreSQL, MySQL on AWS/GCP
- **Legacy System Integration**: Existing databases you can't migrate
- **High-Performance Queries**: When D1 isn't enough
- **Hybrid Architectures**: CloudFlare frontend + external DB

#### Implementation Examples:

```typescript
// Connect to external PostgreSQL
export async function getAdvancedAnalytics() {
  // Hyperdrive accelerates this connection
  const db = new Database(env.HYPERDRIVE_URL);
  
  return await db.query(`
    SELECT 
      date_trunc('day', created_at) as date,
      count(*) as users,
      avg(session_duration) as avg_session
    FROM user_sessions 
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY date_trunc('day', created_at)
    ORDER BY date
  `);
}
```

#### When to Use vs D1:
- **Use Hyperdrive + External DB for**:
    - Complex analytics queries
    - Large datasets (>1GB)
    - Existing database migrations
    - Advanced SQL features

- **Use D1 for**:
    - New applications
    - Simple to moderate complexity
    - Cost optimization
    - CloudFlare-native experience

### 6. External Backends - When to Break Out

#### Use External Services (AWS, GCP, Your VMs) for:

##### Complex Processing
- **Machine Learning**: Models, training, inference
- **Video Processing**: Encoding, transcoding
- **Large Computations**: Data analysis, reporting
- **Background Jobs**: Email sending, batch processing

##### Specialized Databases
- **Search**: Elasticsearch, Algolia
- **Time Series**: InfluxDB, TimescaleDB
- **Graph Databases**: Neo4j for complex relationships
- **Vector Databases**: Pinecone for AI/ML features

##### Enterprise Integration
- **Legacy Systems**: Mainframes, old APIs
- **Third-party Services**: CRMs, ERPs
- **Compliance Requirements**: HIPAA, SOC2 specific hosting

#### Architecture Patterns:

```typescript
// Hybrid pattern: CloudFlare + External
export async function processUserData(userData: any) {
  // Step 1: Store basics in D1
  await D1.prepare("INSERT INTO users (...) VALUES (...)").run();
  
  // Step 2: Send complex processing to external service
  await fetch("https://your-ml-service.com/process", {
    method: "POST",
    body: JSON.stringify(userData)
  });
  
  // Step 3: Cache results in KV
  await KV.put(`processed:${userId}`, results);
}
```

## Recommended Architecture Patterns

### Pattern 1: Content-Heavy Site
```
Astro SSG → R2 (images) → KV (content cache)
Blog/CMS → D1 (posts) → KV (rendered HTML)
Comments → External (if complex) or D1 (if simple)
```

### Pattern 2: SaaS Application
```
Marketing → SSG + KV cache
App Dashboard → SPA + D1 + Durable Objects (real-time)
File Storage → R2
Analytics → D1 + External (complex queries)
```

### Pattern 3: E-commerce
```
Product Pages → SSG + D1 (inventory) + KV (cache)
Shopping Cart → Durable Objects (state)
User Uploads → R2
Order Processing → D1 + External payment APIs
```

### Pattern 4: Hybrid Architecture
```
Frontend → CloudFlare (Astro + Frameworks)
Simple Data → D1 + KV
Complex Processing → External APIs (AWS Lambda, etc.)
File Storage → R2 (new) + S3 (legacy)
Search → External (Algolia/Elasticsearch)
```

## Cost Optimization Strategy

### Free Tier Maximization
1. **KV**: 100k reads/day, 1k writes/day
2. **D1**: 5M rows read/day, 100k rows written/day
3. **R2**: 10GB storage, 1M Class A operations/month
4. **Functions**: 100k requests/day

### Efficient Patterns
- **Cache Aggressively**: Use KV to cache expensive D1 queries
- **Batch Operations**: Group D1 writes to stay under limits
- **Smart Caching**: Cache server islands output in KV
- **R2 for Assets**: Replace expensive CDN costs

### Monitoring and Alerts
```typescript
// Track usage to avoid overages
export async function trackUsage(service: string, operation: string) {
  const today = new Date().toISOString().split('T')[0];
  const key = `usage:${service}:${operation}:${today}`;
  
  const current = await KV.get(key) || 0;
  await KV.put(key, (parseInt(current) + 1).toString(), { expirationTtl: 86400 });
}
```

## Integration with Your Astro Architecture

### Server Islands + CloudFlare Services
```astro
---
// Cache expensive server islands
const cacheKey = `island:user-dashboard:${userId}`;
let html = await KV.get(cacheKey);

if (!html) {
  const userData = await D1.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first();
  html = await renderQwikComponent(UserDashboard, { userData });
  await KV.put(cacheKey, html, { expirationTtl: 300 });
}
---
<div set:html={html} />
```

### SPA + CloudFlare Services
```typescript
// In your SolidJS SPA
export async function createProject(projectData: any) {
  // Store in D1
  const result = await fetch('/api/projects', {
    method: 'POST',
    body: JSON.stringify(projectData)
  });
  
  // Real-time updates via Durable Objects
  const ws = new WebSocket('/ws/projects');
  ws.send(JSON.stringify({ type: 'project_created', data: projectData }));
  
  return result;
}
```

## Decision Flowchart

```
New Feature Needed
│
├─ Does it need persistent storage?
│  ├─ Simple key-value? → KV
│  ├─ Relational data? → D1
│  ├─ Files/media? → R2
│  └─ Complex queries? → External DB + Hyperdrive
│
├─ Does it need real-time state?
│  ├─ Yes → Durable Objects
│  └─ No → Continue...
│
├─ Does it need heavy processing?
│  ├─ Yes → External Service
│  └─ No → CloudFlare Functions
│
└─ Does it need caching?
   ├─ Yes → KV
   └─ No → Direct implementation
```

## Conclusion

Your CloudFlare stack strategy:
- **Start Simple**: KV + D1 covers 80% of use cases
- **Add Complexity**: Durable Objects for real-time features
- **Scale Smartly**: External services for specialized needs
- **Cache Everything**: KV as your performance multiplier
- **Monitor Costs**: Stay within free tiers as long as possible

The key is leveraging CloudFlare's edge network for your Astro + multi-framework setup while knowing when to reach outside for specialized capabilities.