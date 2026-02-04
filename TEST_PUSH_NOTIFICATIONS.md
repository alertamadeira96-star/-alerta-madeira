# How to test push notifications on the app

Push notifications **only work on a real phone** (iOS or Android). They do **not** work in the browser or in a simulator.

---

## 1. Deploy the Edge Function (one-time)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **Edge Functions** → **Create a new function**.
3. Name: **`notify-on-event`**.
4. Copy the full contents of **`supabase/functions/notify-on-event/index.ts`** from this project into the editor.
5. Click **Deploy**.

(Optional: deploy **`send-notification`** too if you want to test manual “Send” from Admin → Notifications.)

---

## 2. Run the app on a real device

1. On your computer, in the project folder, run:
   ```bash
   bun run start
   ```
2. Open **Expo Go** on your phone (install from App Store / Play Store if needed).
3. Scan the QR code that appears in the terminal.
4. The app opens on your phone.

---

## 3. Register your device (get a push token)

1. In the app on your phone, **log in** (or create an account and log in).
2. When you’re logged in, the app asks for **notification permission** – tap **Allow**.
3. The app then gets the push token and saves it to Supabase.

**Check that the token was saved:**

- Supabase Dashboard → **Table Editor** → **push_tokens**.
- You should see a row with your user and a token like `ExponentPushToken[xxxxx]`.

If there’s no row, make sure you’re on a **real device**, you’re **logged in**, and you **allowed** notifications.

---

## 4. Test automatic push (new post)

1. **Keep the app open on your phone** (or put it in the background – don’t force-close it).
2. Create a **new post** in the app (e.g. from another account on another device, or from the same account – you can use the web app in the browser to create a post if the app is on your phone).
3. Right after the post is created, your phone should get a push: **“Nova publicação”** + the post title.

If you only have one device:

- Open the app on your phone and log in (so the token is saved).
- Then use the **same app on your phone** to create a new post.
- You should still get the push (your device is in the list of tokens).

---

## 5. Test manual push (admin “Send”) – optional

1. Log in as an **admin** user.
2. Go to **Admin** → **Notifications**.
3. Enter a **Title** and **Body** (e.g. “Test” / “Hello from admin”).
4. Tap **Send**.
5. Your phone (and any other device with a token) should get that notification.

(This only works if **`send-notification`** is deployed.)

---

## Quick checklist

| Step | Done? |
|------|--------|
| Edge Function **notify-on-event** deployed | |
| App run on **real phone** (Expo Go + QR) | |
| **Logged in** and **allowed** notifications | |
| Row in Supabase **push_tokens** | |
| Create a **new post** → push received | |

---

## If you don’t get a notification

1. **Token in Supabase?**  
   Table Editor → **push_tokens** – there must be a row for your device.

2. **Function deployed?**  
   Edge Functions list should show **notify-on-event** (and **send-notification** if you use manual Send).

3. **Real device?**  
   Push does not work in browser or simulator.

4. **Notification permission?**  
   Phone Settings → your app / Expo Go → Notifications → allowed.

5. **App not force-closed?**  
   Put the app in background; don’t swipe it away so the system can deliver the push.

6. **Wait a few seconds**  
   Sometimes the push is delayed by a few seconds.
