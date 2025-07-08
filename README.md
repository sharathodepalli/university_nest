# UniNest - Student Housing Platform

A modern, secure student housing platform built with React, TypeScript, and Supabase.

## 🚀 Features

- **Student Email Verification**: Secure .edu email verification system using SendGrid
- **Real-time Messaging**: Instant communication between students and hosts
- **Advanced Search**: Smart filtering with location-based search
- **Privacy Protection**: GDPR-compliant privacy settings and data protection
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **PWA Support**: Progressive Web App capabilities

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- SendGrid account (for email verification)

## 🛠️ Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd project
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Supabase Edge Function Setup

Deploy the email verification function:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy the edge function
supabase functions deploy send-verification-email
```

### 4. Configure SendGrid Environment Variables

In your Supabase Dashboard → Edge Functions → Environment Variables, add:

```bash
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=your-verified-sender-email
APP_URL=https://your-app-domain.com
```

## 🏃‍♂️ Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Type checking
npm run type-check
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React context providers
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
├── pages/              # Page components
├── types/              # TypeScript type definitions
└── utils/              # Helper utilities

supabase/
├── functions/          # Edge Functions
│   └── send-verification-email/
└── migrations/         # Database migrations
```

## 🔧 Key Components

### Email Verification System

- **VerificationPage**: Main verification interface
- **VerifyEmailPage**: Email link landing page
- **Edge Function**: SendGrid email delivery service

### Core Features

- **AuthContext**: Authentication state management
- **ListingsContext**: Property listings management
- **MessagingContext**: Real-time messaging system

## 🚀 Deployment

### Frontend Deployment

Deploy to platforms like Vercel, Netlify, or your preferred hosting service.

### Edge Function Deployment

Functions are automatically deployed to Supabase when using the CLI.

## 📖 Documentation

- **EDGE_FUNCTION_DEPLOYMENT.md**: Edge function deployment guide
- **EMAIL_VERIFICATION_TESTING.md**: Testing procedures for email verification
- **SYSTEM_READY_GUIDE.md**: Production readiness checklist

## 🔒 Security

- Environment variables for sensitive data
- CSRF protection
- Input validation and sanitization
- Secure authentication with Supabase

## 🧪 Testing

```bash
# Run tests
npm run test

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:

1. Check the documentation in the `/docs` folder
2. Review existing GitHub issues
3. Create a new issue with detailed information

---

Built with ❤️ for students, by students.
