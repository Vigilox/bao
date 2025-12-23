# BAO - AI Creative Studio

![BAO Logo](nextjs_space/public/og-image.png)

BAO is an AI-native creative studio platform that empowers individual creators to produce cinema-grade stories and campaigns through a calm, intuitive chat interface. The platform orchestrates multiple AI models for video, image, and audio generation, making professional content creation accessible to everyone.

## 🌟 Features

### Core Capabilities
- **Natural Language Interface**: Claude-style borderless chat experience for intuitive interaction
- **AI-Powered Generation**:
  - Image generation using Nano Banana (Google)
  - Video generation using Veo 3.1 Fast
  - Text-to-image and image-to-video workflows
- **Project Management**: Hierarchical structure (Projects → Scenes → Shots)
- **RAG-Powered Context**: Upload scripts, brand guidelines, and reference materials for AI-aware generation
- **Asset Management**: Organized library of all generated and uploaded content
- **Real-time Collaboration**: Streaming chat responses with contextual suggestions

### User Experience
- **Borderless Design**: Inspired by Claude AI's clean, minimal aesthetic
- **Artifact Panels**: Gemini-style context-aware panels for previewing generated content
- **Responsive Layout**: Seamless experience across mobile, tablet, and desktop
- **Dark Mode**: Built-in dark theme optimized for creative work
- **Smooth Animations**: Framer Motion-powered transitions and interactions

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **Animations**: Framer Motion
- **State**: React Hooks + Context

### Backend
- **API Routes**: Next.js API routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v4
- **File Storage**: AWS S3 (via @aws-sdk/client-s3)
- **AI APIs**:
  - Kie.AI (Nano Banana, Veo 3.1)
  - Abacus.AI (Chat completions, embeddings)

### Key Libraries
- `@prisma/client` - Type-safe database access
- `@aws-sdk/client-s3` - Cloud file storage
- `bcryptjs` - Password hashing
- `mammoth` - DOCX text extraction
- `framer-motion` - Smooth animations
- `lucide-react` - Modern icon library

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and Yarn
- PostgreSQL database
- AWS S3 bucket (or compatible storage)
- Kie.AI API key
- Abacus.AI API key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Vigilox/bao.git
cd bao/nextjs_space
```

2. **Install dependencies**
```bash
yarn install
```

3. **Set up environment variables**

Create a `.env` file in `nextjs_space/`:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/bao"

# Authentication
NEXTAUTH_SECRET="your-random-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# AWS S3 Storage
AWS_BUCKET_NAME="your-bucket-name"
AWS_FOLDER_PREFIX="bao/"
AWS_REGION="us-west-2"
AWS_PROFILE="default" # or your AWS profile name

# AI APIs
ABACUSAI_API_KEY="your-abacusai-api-key"
KIE_AI_API_KEY="your-kie-ai-api-key"
KIE_AI_API_URL="https://api.kie.ai/api/v1"
```

4. **Set up the database**
```bash
# Generate Prisma client
yarn prisma generate

# Push schema to database
yarn prisma db push

# Seed with test data
yarn prisma db seed
```

5. **Run the development server**
```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Default Test Account
After seeding, you can log in with:
- **Email**: john@doe.com
- **Password**: johndoe123

## 📚 Project Structure

```
bao/
├── nextjs_space/
│   ├── app/
│   │   ├── api/              # API routes
│   │   │   ├── auth/          # NextAuth handlers
│   │   │   ├── projects/      # Project CRUD
│   │   │   ├── scenes/        # Scene management
│   │   │   ├── shots/         # Shot management
│   │   │   ├── assets/        # Asset management
│   │   │   ├── generate/      # AI generation endpoints
│   │   │   ├── chat/          # Streaming chat
│   │   │   └── upload/        # File uploads
│   │   ├── auth/             # Auth pages
│   │   ├── dashboard/        # Project dashboard
│   │   ├── project/          # Project detail view
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Home page
│   │   └── globals.css       # Global styles
│   ├── components/
│   │   ├── ui/               # shadcn/ui components
│   │   ├── providers.tsx     # App providers
│   │   └── theme-provider.tsx
│   ├── lib/
│   │   ├── auth.ts           # NextAuth config
│   │   ├── db.ts             # Prisma client
│   │   ├── kie-ai-client.ts  # Kie.AI API wrapper
│   │   ├── rag.ts            # RAG utilities
│   │   ├── s3.ts             # S3 file operations
│   │   ├── aws-config.ts     # AWS configuration
│   │   └── utils.ts          # Helper functions
│   ├── prisma/
│   │   └── schema.prisma     # Database schema
│   ├── scripts/
│   │   └── seed.ts           # Database seeding
│   ├── public/
│   │   ├── favicon.svg
│   │   └── og-image.png
│   └── package.json
└── README.md
```

## 📊 Database Schema

### Core Models
- **User**: Authentication and user management
- **Project**: Top-level creative projects
- **Scene**: Organized sequences within projects
- **Shot**: Individual shots with prompts and generated assets
- **Asset**: Media files (images, videos) with metadata
- **Document**: Uploaded reference materials (scripts, PDFs)
- **DocumentChunk**: Text chunks with embeddings for RAG
- **ChatMessage**: Conversation history per project
- **GenerationTask**: Async AI generation job tracking

## 🎨 Usage Guide

### Creating a Project
1. Sign in to your account
2. Click "New Project" on the dashboard
3. Enter a project name and description
4. Start chatting to plan your creative vision

### Generating Content

**Via Chat**:
```
"Create a storyboard for an opening scene in a futuristic city"
"Generate a character concept for the protagonist"
"Make a video from the first storyboard frame"
```

**Via API** (for direct integration):
```typescript
// Image generation
const task = await fetch('/api/generate/image', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    projectId: 'your-project-id',
    prompt: 'A futuristic cityscape at sunset',
    aspectRatio: '16:9',
  }),
});

// Check status
const status = await fetch(`/api/generate/status/${task.id}`);
```

### Uploading References
1. Navigate to your project
2. Click the upload button in the artifacts panel
3. Upload images, videos, or documents
4. The AI will use these as context in future generations

## 🔧 API Reference

### Authentication
- `POST /api/signup` - Create new account
- `POST /api/auth/[...nextauth]` - NextAuth handlers

### Projects
- `GET /api/projects` - List user's projects
- `POST /api/projects` - Create new project
- `GET /api/projects/[id]` - Get project details
- `PATCH /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project

### Scenes
- `GET /api/scenes?projectId=...` - List project scenes
- `POST /api/scenes` - Create new scene
- `GET /api/scenes/[id]` - Get scene details
- `PATCH /api/scenes/[id]` - Update scene
- `DELETE /api/scenes/[id]` - Delete scene

### Generation
- `POST /api/generate/image` - Generate image
- `POST /api/generate/video` - Generate video
- `GET /api/generate/status/[taskId]` - Check generation status

### Chat
- `POST /api/chat` - Streaming chat with AI assistant (SSE)

### Assets
- `GET /api/assets?projectId=...` - List project assets
- `POST /api/assets` - Create asset record

### File Upload
- `POST /api/upload/presigned` - Get presigned S3 URL
- `POST /api/upload/document` - Upload document for RAG

## 👥 Authentication

BAO uses NextAuth.js with credentials-based authentication:
- Passwords are hashed using bcryptjs
- Sessions use JWT strategy
- Protected routes use server-side session checks

## 💾 RAG Implementation

The platform includes basic RAG (Retrieval-Augmented Generation):
1. Documents are uploaded and text is extracted
2. Text is chunked into manageable pieces
3. Embeddings are generated using Abacus.AI
4. Relevant chunks are retrieved based on similarity
5. Context is injected into AI prompts

## 🎯 Roadmap

### Phase 1 (Current - MVP)
- [x] Project and scene management
- [x] AI image generation (Nano Banana)
- [x] AI video generation (Veo 3.1)
- [x] Chat interface with streaming
- [x] Basic RAG for context
- [x] File upload and storage

### Phase 2 (Future)
- [ ] Advanced storyboard editing
- [ ] Video timeline editor
- [ ] Audio generation and sync
- [ ] Multi-user collaboration
- [ ] Version history and branching
- [ ] Export to professional formats

### Phase 3 (Vision)
- [ ] Real-time multiplayer editing
- [ ] Voice input/output
- [ ] Advanced approval workflows
- [ ] Team management
- [ ] API for third-party integrations

## 📝 Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_SECRET` | Random secret for session encryption | Yes |
| `NEXTAUTH_URL` | Base URL of the application | Yes |
| `AWS_BUCKET_NAME` | S3 bucket name | Yes |
| `AWS_FOLDER_PREFIX` | S3 folder prefix | Yes |
| `AWS_REGION` | AWS region | Yes |
| `AWS_PROFILE` | AWS CLI profile name | Yes |
| `ABACUSAI_API_KEY` | Abacus.AI API key | Yes |
| `KIE_AI_API_KEY` | Kie.AI API key | Yes |
| `KIE_AI_API_URL` | Kie.AI API base URL | Yes |

## 🐛 Known Issues & Limitations

1. **Vector Search**: Currently using JSON-based similarity search instead of pgvector due to database limitations. Performance may degrade with large document sets.
2. **File Size**: Maximum file upload size is limited by S3 presigned URL expiry (1 hour).
3. **Generation Time**: Video generation can take 30-60 seconds. UI updates via polling.
4. **Concurrent Generations**: No queue management for multiple simultaneous generation requests.

## 💬 Support

For issues, questions, or contributions:
- GitHub Issues: [github.com/Vigilox/bao/issues](https://github.com/Vigilox/bao/issues)
- Repository: [github.com/Vigilox/bao](https://github.com/Vigilox/bao)

## 📝 License

This project is private and proprietary. All rights reserved.

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd nextjs_space
vercel
```

### Environment Setup
Add all environment variables in your deployment platform's settings.

### Database Migration
Run `yarn prisma db push` after deployment to sync the schema.

---

**Built with ❤️ by the BAO team**
