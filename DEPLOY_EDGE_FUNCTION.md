# Deploy Supabase Edge Function for Push Notifications

## Step 1: Install Supabase CLI

```bash
# Windows (PowerShell)
irm https://deno.land/install.ps1 | iex

# Or install Supabase CLI
npm install -g supabase
```

## Step 2: Login to Supabase

```bash
supabase login
```

## Step 3: Link Your Project

```bash
supabase link --project-ref gvrniusfxhrswyhgbhpz
```

## Step 4: Create Function

```bash
supabase functions new send-notification
```

## Step 5: Copy Function Code

1. Copy contents from `supabase-edge-function-send-notification.ts`
2. Paste into: `supabase/functions/send-notification/index.ts`

## Step 6: Set Environment Variable

```bash
# Set FCM Server Key (get from Firebase Console)
supabase secrets set FCM_SERVER_KEY=your-firebase-server-key-here
```

## Step 7: Deploy

```bash
supabase functions deploy send-notification
```

## Alternative: Deploy via Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/gvrniusfxhrswyhgbhpz/functions
2. Click "Create a new function"
3. Name: `send-notification`
4. Copy code from `supabase-edge-function-send-notification.ts`
5. Paste into editor
6. Set secret: `FCM_SERVER_KEY` = your Firebase server key
7. Click "Deploy"

## Test the Function

After deployment, the admin panel can call:
```typescript
await supabase.functions.invoke('send-notification', {
  body: { title: 'Test', body: 'Test message' }
});
```

## Get Your Firebase Server Key

1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project
3. Settings (gear icon) → Project Settings
4. Cloud Messaging tab
5. Copy "Server key"
