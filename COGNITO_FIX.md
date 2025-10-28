# 🔧 Cognito Login Fix

## Issue
Cognito login is not working because `http://localhost:3000/callback` is not in your allowed callback URLs.

## Quick Fix

### Step 1: Add Callback URL in AWS Console
1. Go to **AWS Console** → **Cognito** → **User Pools**
2. Select your user pool: `oykth9` (us-east-1_zfMUmmI7i)
3. Go to **App Integration** tab
4. Find your app client: `Stotra` (o82kd78l2ie1chb3h0223e74k)
5. Click **Edit**

### Step 2: Update URLs
**Add to Allowed callback URLs:**
```
http://localhost:3000/callback
```

**Add to Allowed sign-out URLs:**
```
http://localhost:3000
```

**Your final callback URLs should be:**
- http://localhost:8080/callback
- http://localhost:3000/callback  ← ADD THIS
- https://d84lty8p4kdlc.cloudfront.net/callback

**Your final sign-out URLs should be:**
- http://localhost:8080
- http://localhost:3000  ← ADD THIS
- https://d84lty8p4kdlc.cloudfront.net

### Step 3: Save Changes
Click **Save changes** in the AWS Console.

### Step 4: Test
1. Restart your React app: `npm run dev`
2. Go to `http://localhost:3000`
3. Click "Sign in with AWS Cognito"
4. Should redirect to Cognito hosted UI
5. After login, should redirect back to your app

## Debug Tools
- Click the "🐛 Debug Auth" button in the bottom-right corner
- Check browser console for detailed logs
- Look for any error messages

## Common Issues
1. **"Invalid redirect URI"** → Callback URL not added to Cognito
2. **"Client does not exist"** → Wrong client ID
3. **CORS errors** → Domain mismatch
4. **State mismatch** → Clear browser storage and try again

## Test URLs
- **Development**: http://localhost:3000
- **Callback**: http://localhost:3000/callback
- **Cognito Domain**: https://us-east-1zfmummi7i.auth.us-east-1.amazoncognito.com