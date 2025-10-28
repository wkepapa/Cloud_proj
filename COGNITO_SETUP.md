# Cognito Setup Guide for Stotra Elections

This guide helps you configure the React app with your existing AWS Cognito setup.

## 🔧 Current Configuration

Your existing Cognito setup from the Express app:
- **User Pool ID**: `us-east-1_zfMUmmI7i`
- **Client ID**: `o82kd78l2ie1chb3h0223e74k`
- **Domain**: `us-east-1zfmummi7i.auth.us-east-1.amazoncognito.com`
- **Region**: `us-east-1`

## 📝 Configuration Steps

### 1. Update Amplify Configuration

The `frontend/src/amplifyconfiguration.json` file is already configured with your Cognito details. You only need to:

1. **Get your Identity Pool ID** (if you have one):
   ```bash
   aws cognito-identity list-identity-pools --max-results 10
   ```
   
2. **Update the placeholder** in `amplifyconfiguration.json`:
   ```json
   "aws_cognito_identity_pool_id": "us-east-1:YOUR_ACTUAL_IDENTITY_POOL_ID"
   ```

### 2. Verify Cognito User Pool Settings

In AWS Console → Cognito → User Pools → `us-east-1_zfMUmmI7i`:

1. **App Integration** tab:
   - Ensure your app client `o82kd78l2ie1chb3h0223e74k` exists
   - Add callback URLs: `http://localhost:3000/`, `https://yourdomain.com/`
   - Add sign-out URLs: `http://localhost:3000/`, `https://yourdomain.com/`

2. **Sign-in experience**:
   - Username attributes: Email ✅
   - Required attributes: Email ✅

3. **Security requirements**:
   - Password policy: Minimum 8 characters ✅
   - MFA: Optional (currently OFF) ✅

### 3. Test Authentication Flow

1. **Start the React app**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

2. **Test sign-up**:
   - Go to `http://localhost:3000`
   - Click "Create Account"
   - Enter email and password
   - Check email for verification code

3. **Test sign-in**:
   - Use verified email/password
   - Should redirect to authenticated state

## 🔍 Troubleshooting

### Common Issues

1. **"User does not exist" error**:
   - User might not be confirmed
   - Check Cognito console → Users tab
   - Manually confirm user if needed

2. **"Invalid redirect URI" error**:
   - Add `http://localhost:3000/` to allowed callback URLs
   - Add `http://localhost:3000/` to allowed sign-out URLs

3. **"Client does not exist" error**:
   - Verify client ID `o82kd78l2ie1chb3h0223e74k` exists
   - Check if client is enabled

### Verification Commands

```bash
# Check if user pool exists
aws cognito-idp describe-user-pool --user-pool-id us-east-1_zfMUmmI7i

# Check app client configuration
aws cognito-idp describe-user-pool-client \
  --user-pool-id us-east-1_zfMUmmI7i \
  --client-id o82kd78l2ie1chb3h0223e74k

# List users in pool
aws cognito-idp list-users --user-pool-id us-east-1_zfMUmmI7i
```

## 🚀 Production Deployment

For production deployment:

1. **Update callback URLs** in Cognito:
   - Add your production domain
   - Remove localhost URLs

2. **Update amplifyconfiguration.json**:
   - Change redirect URLs to production domain
   - Ensure HTTPS is used

3. **Environment variables**:
   - Consider using environment-specific configs
   - Keep sensitive data secure

## 🔐 Security Best Practices

1. **Password Policy**: Already configured for 8+ characters
2. **Email Verification**: Enabled ✅
3. **MFA**: Consider enabling for production
4. **Rate Limiting**: Built into Cognito
5. **HTTPS**: Required for production

## 📞 Support

If you encounter issues:
1. Check AWS CloudWatch logs
2. Enable Cognito detailed logging
3. Test with AWS CLI commands above
4. Verify network connectivity

Your existing Cognito setup should work seamlessly with the new React app!