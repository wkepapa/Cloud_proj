# 🚀 AWS Amplify Deployment Guide

## Step 1: Prepare for Deployment

### 1.1 Commit Your Code
```bash
git add .
git commit -m "🚀 Ready for Amplify deployment"
git push origin main
```

### 1.2 Build Configuration
- ✅ `amplify.yml` - Build configuration created
- ✅ Frontend optimized for production
- ✅ Cognito config supports multiple domains

## Step 2: Deploy to AWS Amplify

### Option A: Deploy via AWS Console (Recommended)

1. **Go to AWS Amplify Console**
   - Visit: https://console.aws.amazon.com/amplify/
   - Click "New app" → "Host web app"

2. **Connect Repository**
   - Choose "GitHub" (or your git provider)
   - Select your repository
   - Choose branch: `main`

3. **Configure Build Settings**
   - App name: `stotra-elections`
   - Build and test settings: Use the detected `amplify.yml`
   - Advanced settings:
     - Build image: `Amazon Linux:2023`
     - Environment variables: (none needed for now)

4. **Review and Deploy**
   - Review settings
   - Click "Save and deploy"
   - Wait for deployment (5-10 minutes)

### Option B: Deploy via Amplify CLI

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Configure Amplify
amplify configure

# Initialize Amplify in your project
amplify init

# Add hosting
amplify add hosting

# Deploy
amplify publish
```

## Step 3: Update Cognito Configuration

After deployment, you'll get an Amplify URL like:
`https://main.d1234567890.amplifyapp.com`

### 3.1 Update Cognito App Client

1. **Go to AWS Cognito Console**
   - User Pools → `oykth9` → App Integration → `Stotra`

2. **Add Production URLs**
   
   **Allowed callback URLs:**
   ```
   http://localhost:8080/callback
   http://localhost:3000/callback
   https://YOUR_AMPLIFY_DOMAIN.amplifyapp.com/callback
   https://d84lty8p4kdlc.cloudfront.net/callback
   ```

   **Allowed sign-out URLs:**
   ```
   http://localhost:8080
   http://localhost:3000
   https://YOUR_AMPLIFY_DOMAIN.amplifyapp.com
   https://d84lty8p4kdlc.cloudfront.net
   ```

3. **Save Changes**

### 3.2 Update Code Configuration

Update `frontend/src/config/cognito.js`:
```javascript
PRODUCTION_DOMAINS: [
  'https://main.dYOUR_ID.amplifyapp.com', // Your actual Amplify domain
  'https://d84lty8p4kdlc.cloudfront.net'
],
```

## Step 4: Test Production Deployment

1. **Visit your Amplify URL**
2. **Test authentication flow**
3. **Verify all features work**
4. **Check browser console for errors**

## Step 5: Custom Domain (Optional)

### 5.1 Add Custom Domain in Amplify
1. Go to Amplify Console → Your App → Domain management
2. Add domain: `elections.yourdomain.com`
3. Follow DNS configuration steps

### 5.2 Update Cognito URLs
Add your custom domain to Cognito callback URLs:
```
https://elections.yourdomain.com/callback
https://elections.yourdomain.com
```

## Step 6: Environment Variables (If Needed)

In Amplify Console → Environment variables:
```
VITE_APP_NAME=Stotra Elections Platform
VITE_ENVIRONMENT=production
```

## Troubleshooting

### Common Issues

1. **Build Fails**
   - Check `amplify.yml` configuration
   - Verify all dependencies in `package.json`
   - Check build logs in Amplify Console

2. **Authentication Fails**
   - Verify Cognito callback URLs include Amplify domain
   - Check browser console for CORS errors
   - Ensure HTTPS is used in production

3. **Routing Issues**
   - Add redirects in Amplify Console:
     ```
     Source: </^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|ttf)$)([^.]+$)/>
     Target: /index.html
     Status: 200 (Rewrite)
     ```

### Debug Production Issues

1. **Enable Debug Mode**
   - Temporarily add `<AuthDebug />` to production
   - Check browser console logs
   - Verify network requests

2. **Check Amplify Logs**
   - Go to Amplify Console → Build history
   - Check build and deploy logs

## Security Checklist

- ✅ HTTPS enforced
- ✅ Cognito client secret secured
- ✅ No sensitive data in client code
- ✅ CORS properly configured
- ✅ Authentication flow tested

## Performance Optimization

- ✅ Vite build optimization
- ✅ Code splitting enabled
- ✅ Assets minified
- ✅ Gzip compression (automatic in Amplify)

## Monitoring

- Set up CloudWatch for error monitoring
- Enable Amplify analytics
- Monitor authentication success rates

Your Stotra Elections Platform is now ready for production! 🎉