# DocForge.online MVP Development Plan

## 🎯 Project Overview

**DocForge.online** is an automated documentation generation platform that leverages AI to analyze and document entire codebases. This plan provides a comprehensive roadmap to build the MVP from your current Astro foundation.

## 📊 Current State Analysis

### ✅ What's Already Built (Estimated 40% Complete)
- **Authentication System**: AWS Cognito integration with sign-in/sign-out flows
- **Frontend Framework**: Astro + Qwik SPA hybrid architecture
- **UI Foundation**: Responsive layout, dark mode, pricing page
- **Deployment Pipeline**: Cloudflare Pages deployment ready
- **Database Setup**: D1 database integration configured
- **Multi-framework Support**: Qwik, Svelte, and standard Astro components

### ❌ What Needs to Be Built (Core MVP Features)
- **GitHub OAuth Integration**: Repository access and webhook setup
- **AI Documentation Engine**: SST/OpenCode integration for codebase analysis
- **Backend API**: Repository processing, job queuing, and documentation generation
- **WebSocket System**: Real-time progress updates during generation
- **Documentation Viewer**: Interactive documentation display and search
- **Repository Management**: Repo selection, status tracking, regeneration

## 🗺️ MVP Development Roadmap

### Phase 1: Core Backend Infrastructure (Week 1-2)
#### 1.1 GitHub Integration Setup
- [ ] **GitHub OAuth Provider** (`src/lib/auth/github-oauth.ts`)
  - GitHub App creation and configuration
  - OAuth flow implementation with Astro actions
  - Repository access permissions and scoping
  - User GitHub profile integration

- [ ] **Repository Service** (`src/lib/services/repository.ts`)
  - Repository listing and selection
  - Clone/fetch repository contents
  - Webhook setup for auto-regeneration
  - Repository metadata storage in D1

#### 1.2 AI Documentation Engine
- [ ] **SST/OpenCode Integration** (`src/lib/ai/documentation-engine.ts`)
  - SST API client setup and authentication
  - Codebase analysis job submission
  - Cost-efficient selective scanning logic
  - Documentation formatting and structuring

- [ ] **Job Processing System** (`src/lib/jobs/`)
  - Job queue implementation with Redis/D1
  - Background job processing
  - Progress tracking and status updates
  - Error handling and retry logic

### Phase 2: Real-time Communication (Week 2-3)
#### 2.1 WebSocket Infrastructure
- [ ] **WebSocket Server** (`src/lib/websocket/`)
  - uWebSockets.js integration with Astro
  - Room-based connections for repository sessions
  - Real-time progress broadcasting
  - Connection management and cleanup

- [ ] **Progress Tracking** (`src/lib/progress/`)
  - Documentation generation progress events
  - Real-time status updates to frontend
  - Error reporting and user notifications
  - Completion callbacks and redirects

### Phase 3: Frontend Documentation Experience (Week 3-4)
#### 3.1 Repository Management Interface
- [ ] **Repository Dashboard** (`src/applications-qwik/dashboard/`)
  - Connected repositories listing
  - Repository status and last updated info
  - Add new repository flow
  - Repository settings and configuration

- [ ] **Repository Selection** (`src/components-qwik/RepositoryPicker.tsx`)
  - GitHub repository browser
  - Repository search and filtering
  - Permission verification
  - Repository connection wizard

#### 3.2 Documentation Generation Interface
- [ ] **Generation Dashboard** (`src/applications-qwik/generate/`)
  - Real-time progress indicators
  - Live log streaming
  - Cancellation and retry options
  - Generation history and analytics

- [ ] **Documentation Viewer** (`src/applications-qwik/docs/`)
  - Searchable documentation interface
  - Code syntax highlighting
  - Navigation tree and breadcrumbs
  - Export options (PDF, markdown, etc.)

### Phase 4: Polish and MVP Launch (Week 4-5)
#### 4.1 User Experience Enhancements
- [ ] **Onboarding Flow** (`src/pages/onboarding/`)
  - Welcome tutorial and feature tour
  - GitHub connection guidance
  - First repository setup wizard
  - Success metrics and feedback

- [ ] **Error Handling** (`src/lib/errors/`)
  - Comprehensive error boundaries
  - User-friendly error messages
  - Automatic retry mechanisms
  - Support contact integration

#### 4.2 Performance and Monitoring
- [ ] **Analytics Integration** (`src/lib/analytics/`)
  - User behavior tracking
  - Generation success/failure rates
  - Performance monitoring
  - Cost tracking and optimization

- [ ] **Caching Strategy** (`src/lib/cache/`)
  - Documentation result caching
  - Repository metadata caching
  - Static asset optimization
  - CDN integration

## 🛠️ Technical Implementation Details

### Backend Architecture
```
src/lib/
├── auth/
│   ├── github-oauth.ts      # GitHub OAuth integration
│   └── session-manager.ts   # User session handling
├── services/
│   ├── repository.ts        # Repository CRUD operations
│   ├── documentation.ts     # Doc generation orchestration
│   └── webhook.ts          # GitHub webhook handling
├── ai/
│   ├── documentation-engine.ts  # SST/OpenCode integration
│   └── content-processor.ts    # Post-processing of AI output
├── jobs/
│   ├── queue.ts            # Job queue management
│   └── workers.ts          # Background job processing
└── websocket/
    ├── server.ts           # WebSocket server setup
    └── handlers.ts         # WebSocket event handlers
```

### Frontend Architecture
```
src/applications-qwik/
├── dashboard/              # Main user dashboard
├── repositories/           # Repository management
├── generate/              # Documentation generation
├── docs/                  # Documentation viewer
└── settings/              # User settings

src/components-qwik/
├── RepositoryPicker.tsx    # Repository selection
├── ProgressIndicator.tsx   # Real-time progress
├── DocumentationViewer.tsx # Doc display component
└── GenerationControls.tsx  # Generation management
```

### Database Schema (D1)
```sql
-- Users table (extend existing)
ALTER TABLE users ADD COLUMN github_id TEXT;
ALTER TABLE users ADD COLUMN github_token TEXT;

-- Repositories table
CREATE TABLE repositories (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  github_id INTEGER,
  name TEXT,
  full_name TEXT,
  clone_url TEXT,
  webhook_id INTEGER,
  status TEXT DEFAULT 'pending',
  last_documented_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Documentation jobs table
CREATE TABLE documentation_jobs (
  id TEXT PRIMARY KEY,
  repository_id TEXT REFERENCES repositories(id),
  status TEXT DEFAULT 'queued',
  progress INTEGER DEFAULT 0,
  started_at DATETIME,
  completed_at DATETIME,
  error_message TEXT,
  result_url TEXT
);

-- Generated documentation table
CREATE TABLE documentation (
  id TEXT PRIMARY KEY,
  repository_id TEXT REFERENCES repositories(id),
  content BLOB,
  format TEXT DEFAULT 'markdown',
  file_path TEXT,
  generated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🚀 Quick Start Development Steps

### Step 1: Environment Setup
1. **Install Dependencies**
   ```bash
   npm install @octokit/rest @anthropic-ai/sdk ws redis ioredis
   npm install -D @types/ws
   ```

2. **Environment Variables** (`.env`)
   ```
   # GitHub OAuth
   GITHUB_CLIENT_ID=your_github_app_client_id
   GITHUB_CLIENT_SECRET=your_github_app_client_secret
   GITHUB_WEBHOOK_SECRET=your_webhook_secret
   
   # AI Service (SST/OpenCode or fallback)
   SST_API_KEY=your_sst_api_key
   ANTHROPIC_API_KEY=your_anthropic_key_fallback
   
   # Redis (for job queue)
   REDIS_URL=redis://localhost:6379
   
   # WebSocket
   WEBSOCKET_PORT=8080
   ```

### Step 2: GitHub App Configuration
1. Create GitHub App at `https://github.com/settings/apps/new`
2. Configure permissions:
   - Repository permissions: Contents (read), Metadata (read), Pull requests (read)
   - User permissions: Email addresses (read)
3. Set webhook URL: `https://your-domain.pages.dev/api/webhooks/github`
4. Generate and download private key

### Step 3: Development Priority Order
1. **Start with GitHub OAuth** - Build on existing auth system
2. **Add Repository Management** - Connect and list repositories
3. **Implement Basic AI Integration** - Start with simple documentation generation
4. **Add WebSocket Communication** - Real-time progress updates
5. **Build Documentation Viewer** - Display generated docs
6. **Polish and Deploy** - Final UX improvements

## 📈 Success Metrics for MVP
- [ ] **User Onboarding**: < 3 minutes from signup to first documentation
- [ ] **Generation Speed**: < 5 minutes for typical repository (1000 files)
- [ ] **Success Rate**: > 90% successful documentation generations
- [ ] **User Engagement**: > 70% users generate docs for 2+ repositories
- [ ] **Performance**: < 2 seconds page load times

## 🎯 Post-MVP Roadmap
- **Advanced AI Features**: Custom documentation templates, style guides
- **Collaboration**: Team workspaces, shared documentation
- **Integrations**: Slack, Discord, documentation platforms
- **Enterprise**: On-premise deployment, advanced security
- **Analytics**: Detailed usage analytics and insights

## 📞 Implementation Support
This plan provides the complete roadmap for building DocForge.online MVP. Each phase builds incrementally on your existing foundation, ensuring rapid development while maintaining code quality.

**Estimated Timeline**: 4-5 weeks for full MVP
**Estimated Effort**: 120-150 development hours
**Key Dependencies**: GitHub App setup, SST/OpenCode API access, Redis deployment

Ready to start implementing? Begin with Phase 1.1 (GitHub Integration Setup) to build momentum quickly!