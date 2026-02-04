# Push Notifications – Setup Guide

## What’s already done

1. **App (Rork)**  
   - When a user logs in, the app gets an **Expo push token** and saves it to Supabase `push_tokens`.  
   - Only on **native** (iOS/Android); on web we don’t register (and we skip listeners to avoid the “removeSubscription” error).

2. **Admin panel**  
   - “Notifications” tab: you can type **Title** and **Body** and tap **Send**.  
   - That calls `supabaseService.sendNotification(title, body)`, which invokes the Supabase Edge Function `send-notification`.

3. **Edge Function**  
   - Code is in **`supabase/functions/send-notification/index.ts`**.  
   - It: checks admin, reads tokens from `push_tokens`, sends to **Expo Push API** for Expo tokens (Rork app), optionally to **FCM** for other tokens (e.g. Flutter), saves a row in `notifications`, and returns sent/failed counts.

So: **back office = admin panel in the app**. You use it by logging in as admin and using the Admin → Notifications screen. What’s left is **deploying** the Edge Function and (optional) configuring FCM for a future Flutter app.

---

## What you need to do

### 1. Deploy the Edge Function (required for “Send” to work)

You need to deploy `send-notification` to your Supabase project so the admin “Send” button actually delivers push notifications.

**Option A – Supabase Dashboard (easiest)**

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.  
2. Go to **Edge Functions** (left sidebar).  
3. Click **Create a new function**.  
4. Name: **`send-notification`**.  
5. Copy the full contents of **`supabase/functions/send-notification/index.ts`** from this repo into the editor.  
6. Click **Deploy**.

**Option B – Supabase CLI**

```bash
# Install Supabase CLI if needed: npm i -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy send-notification
```

Replace `YOUR_PROJECT_REF` with your project ref (e.g. from the project URL).

After deployment, the admin panel “Send” will call this function. **No FCM key is needed for the Rork app** – Expo push tokens are sent via Expo’s API.

---

### 2. (Optional) FCM for a future Flutter app

If later you add a **Flutter** app that uses **Firebase Cloud Messaging**:

1. In Supabase Dashboard → **Edge Functions** → **send-notification** → **Secrets**, add:  
   **`FCM_SERVER_KEY`** = your Firebase Cloud Messaging server key (from Firebase Console → Project settings → Cloud Messaging).  
2. The Edge Function already supports FCM: it sends to any token in `push_tokens` that is **not** an Expo token (i.e. FCM tokens).

For the **current Rork (Expo) app**, push works with only the Edge Function deployed; no FCM key required.

---

## How it works end‑to‑end

1. **User (Rork app, native)**  
   - Logs in → app gets Expo push token → token is saved to Supabase `push_tokens` (via `registerPushToken`).

2. **Admin**  
   - Logs in as admin → opens Admin → Notifications tab → enters Title + Body → taps **Send**.

3. **App**  
   - Calls `supabase.functions.invoke('send-notification', { body: { title, body } })` with the admin’s JWT.

4. **Edge Function**  
   - Verifies admin → reads all rows from `push_tokens` → for each **Expo** token calls Expo Push API → for each **FCM** token (if `FCM_SERVER_KEY` is set) calls FCM → inserts one row into `notifications` → returns sent/failed counts.

5. **Devices**  
   - Devices with the app (and valid Expo or FCM tokens) receive the notification.

---

## Testing

1. **Get a token in the app**  
   - Run the Rork app on a **real device** (Expo Go or a build).  
   - Log in (so `registerForPushNotifications` runs and saves the token to Supabase).  
   - In Supabase → **Table Editor** → **push_tokens** you should see a row with an `ExponentPushToken[...]` token.

2. **Send from admin**  
   - In the app (or browser), log in as admin → Admin → Notifications → fill Title and Body → **Send**.  
   - The device that registered the token should receive the notification.

3. **If nothing is received**  
   - Confirm the Edge Function is deployed (Edge Functions list in Supabase).  
   - Check **push_tokens** has the device’s token.  
   - Check **notifications** table for a new row (confirms the function ran).  
   - On iOS, ensure the app has notification permission and that you’re not in a simulator (use a real device).

---

## Summary

| Step | Action |
|------|--------|
| 1 | Deploy the Edge Function **send-notification** (Dashboard or CLI). |
| 2 | Use the admin panel (back office) → Notifications → Send. |
| 3 | (Optional) Add **FCM_SERVER_KEY** in Edge Function secrets when you have a Flutter app. |

Once the function is deployed, push notifications from the admin panel are handled by this flow; the back office for sending them is the Admin panel in the app.

---

## Automatic notifications (new posts, etc.)

So **users get notified when there are new posts** (and optionally new comments), use a second Edge Function plus a Database Webhook.

### 1. Deploy the Edge Function `notify-on-event`

1. In Supabase Dashboard → **Edge Functions** → **Create a new function**.
2. Name: **`notify-on-event`**.
3. Copy the full contents of **`supabase/functions/notify-on-event/index.ts`** into the editor.
4. Deploy.
5. (Recommended) Set a secret: Edge Functions → **notify-on-event** → **Secrets** → add **`WEBHOOK_SECRET`** = a long random string.

### 2. Add a Database Webhook (new posts → push)

1. In Supabase Dashboard go to **Database** → **Webhooks**.
2. **Create a new webhook**.
3. Configure: **Name** e.g. `notify-on-new-post`, **Table** `public.posts`, **Events** **Insert**, **URL** `https://YOUR_PROJECT_REF.supabase.co/functions/v1/notify-on-event` (replace `YOUR_PROJECT_REF` with your project ref).
4. If you set `WEBHOOK_SECRET`, add **HTTP Header** `x-webhook-secret` = the same value.
5. Save.

Every time a new row is inserted into `posts`, Supabase will POST to `notify-on-event` and the function will send a push to all registered devices (e.g. **"Nova publicação"** + post title/snippet).

### 3. (Optional) Notify on new comments

Create another webhook: **Table** `public.comments`, **Events** **Insert**, **URL** same as above. The function already handles comments and will send **"Novo comentário"** / **"Alguém comentou numa publicação."**

### Summary of push flows

| Trigger | Function | Who gets notified |
|--------|----------|--------------------|
| Admin taps **Send** in Admin → Notifications | `send-notification` | All users with a push token |
| New row in `posts` (Database Webhook) | `notify-on-event` | All users with a push token |
| New row in `comments` (optional webhook) | `notify-on-event` | All users with a push token |

Manual sends use **send-notification**; automatic (new posts / new comments) use **notify-on-event** + Database Webhooks.

 the “back office” for sending them is the Admin panel in the app.
