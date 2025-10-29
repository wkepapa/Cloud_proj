# Stotra Elections Backend

AWS Lambda backend for the Stotra Elections Platform with API Gateway, DynamoDB, and Cognito authentication.

## 🏗️ Architecture

- **API Gateway**: REST API endpoints
- **AWS Lambda**: Serverless functions
- **DynamoDB**: Vote and candidate storage
- **Cognito**: JWT token authentication
- **Serverless Framework**: Infrastructure as Code

## 🚀 Quick Deployment

### Prerequisites
- AWS CLI configured with appropriate permissions
- Node.js 18+ installed
- Serverless Framework (auto-installed)

### Deploy

**Windows:**
```cmd
deploy.bat
```

**Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh
```

**Manual:**
```bash
npm install
npm run deploy:dev
```

## 📡 API Endpoints

### Public Endpoints
- `GET /health` - Health check
- `GET /candidates` - Get all candidates
- `GET /results` - Get election results

### Protected Endpoints (Require Authentication)
- `POST /vote` - Cast a vote
- `GET /vote-status` - Check if user has voted

### Admin Endpoints
- `POST /init` - Initialize candidate data

## 🔧 Configuration

### Environment Variables
```bash
USER_POOL_ID=us-east-1_zfMUmmI7i
USER_POOL_CLIENT_ID=o82kd78l2ie1chb3h0223e74k
VOTES_TABLE=stotra-elections-backend-votes-dev
CANDIDATES_TABLE=stotra-elections-backend-candidates-dev
```

### CORS Configuration
Configured for:
- `http://localhost:3000` (React dev)
- `http://localhost:8080` (Express dev)
- `https://main.d3okoijvek90er.amplifyapp.com` (Production)
- `https://d84lty8p4kdlc.cloudfront.net` (CloudFront)

## 🧪 Testing

### Health Check
```bash
curl https://YOUR_API_URL/health
```

### Get Candidates
```bash
curl https://YOUR_API_URL/candidates
```

### Cast Vote (Authenticated)
```bash
curl -X POST https://YOUR_API_URL/vote \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"candidateId": "1"}'
```

### Get Results
```bash
curl https://YOUR_API_URL/results
```

## 🗄️ Database Schema

### Votes Table
```json
{
  "userId": "cognito-user-id",
  "candidateId": "1", 
  "candidateName": "Alice Johnson",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "ipAddress": "192.168.1.1"
}
```

### Candidates Table
```json
{
  "id": "1",
  "name": "Alice Johnson",
  "description": "Experienced leader...",
  "platform": "Focus on student welfare...",
  "image": "https://..."
}
```

## 🔐 Security Features

- **JWT Authentication**: Cognito token verification
- **CORS Protection**: Configured allowed origins
- **Input Validation**: Request body validation
- **Rate Limiting**: AWS API Gateway built-in
- **Encryption**: DynamoDB encryption at rest

## 📊 Monitoring

- **CloudWatch Logs**: Function execution logs
- **CloudWatch Metrics**: Performance monitoring
- **X-Ray Tracing**: Request tracing (optional)
- **API Gateway Metrics**: Request/response monitoring

## 🚀 Deployment Stages

### Development
```bash
npm run deploy:dev
```

### Production
```bash
npm run deploy:prod
```

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Start offline development
npm run local

# Test locally
curl http://localhost:3000/health
```

## 📝 Logs

```bash
# View logs
serverless logs -f api

# Tail logs
serverless logs -f api --tail
```

## 🗑️ Cleanup

```bash
# Remove development stack
serverless remove --stage dev

# Remove production stack  
serverless remove --stage prod
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.