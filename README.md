# Stotra - Cloud Elections Platform

A full-stack cloud-based election platform **migrated from Express to React + Vite** with AWS Amplify backend.

## 🔄 Migration Complete!

This project has been successfully migrated from Express + EJS to modern React + Vite architecture while preserving all existing Cognito authentication.

## 🏗️ Architecture

- **Frontend**: React + Vite with Tailwind CSS
- **Authentication**: Custom AWS Cognito integration (preserves existing setup)
- **Backend**: AWS Lambda + API Gateway + DynamoDB
- **Hosting**: AWS Amplify Hosting ready

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Existing AWS Cognito setup (already configured)

### Development Setup

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Visit**: `http://localhost:3000`

### AWS Configuration

Your existing Cognito setup is preserved:
- **User Pool**: `us-east-1_zfMUmmI7i`
- **Client ID**: `o82kd78l2ie1chb3h0223e74k`
- **OAuth Domain**: `us-east-1zfmummi7i.auth.us-east-1.amazoncognito.com`

**Action Required**: Add these URLs to your Cognito app client:
- **Callback URL**: `http://localhost:3000/callback`
- **Sign-out URL**: `http://localhost:3000`

## 📁 Project Structure

```
├── frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── App.jsx         # Main app component
│   │   └── main.jsx        # Entry point
│   ├── package.json
│   └── vite.config.js
├── amplify/                 # AWS Amplify backend
│   └── backend/
│       ├── function/       # Lambda functions
│       ├── api/           # API Gateway config
│       └── auth/          # Cognito config
└── README.md
```

## 🔧 Features

- **Authentication**: Secure login/logout with AWS Cognito
- **Voting**: One vote per authenticated user
- **Real-time Results**: Live election results display
- **Responsive Design**: Mobile-friendly interface
- **Security**: JWT-based authentication, vote integrity

## 🛠️ Development

### Frontend Development
```bash
cd frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Backend Development
```bash
amplify mock api     # Mock API locally
amplify push         # Deploy changes
amplify status       # Check deployment status
```

## 🚀 Deployment

### Frontend
```bash
cd frontend
npm run build
amplify add hosting
amplify publish
```

### Backend
Backend is automatically deployed with `amplify push`.

## 🔐 Environment Variables

Update `frontend/src/amplifyconfiguration.json` with your AWS resources:

- `aws_user_pools_id`: Your Cognito User Pool ID
- `aws_user_pools_web_client_id`: Your Cognito App Client ID
- API Gateway endpoint URL

## 📊 API Endpoints

- `GET /candidates` - Get list of candidates
- `POST /vote` - Cast a vote (authenticated)
- `GET /vote-status` - Check if user has voted (authenticated)
- `GET /results` - Get election results

## 🔒 Security Features

- JWT token validation
- One vote per user enforcement
- CORS protection
- Input validation
- Secure session management

## 🎨 UI Components

Built with Tailwind CSS for responsive, modern design:
- Authentication forms
- Candidate cards
- Results dashboard
- Navigation bar
- Loading states

## 📱 Mobile Support

Fully responsive design optimized for:
- Desktop browsers
- Tablets
- Mobile devices

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.