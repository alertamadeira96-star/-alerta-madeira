# Automatic push notifications and push tokens

## Why push_tokens?

To send a push notification to someone’s phone, we need that device’s **push token** – a unique “address” for that app on that device (from Expo or Firebase). Without it, we can’t deliver the notification.

- When a user **opens the app on a real phone** and is **logged in**, the app asks the device for its push token and **saves it in the `push_tokens` table** in Supabase.
- So “users with push tokens” = users who have opened the app on a device at least once. **No extra step for the user** – it happens automatically when they use the app.
- When we want to send a notification, we read all tokens from `push_tokens` and send the push to each one. Everyone who has the app installed and has opened it (and granted notification permission) gets the notification.

---

## Automatic push (no manual “Send”)

Push notifications are **automatic** when something happens in the app:

1. **New post** – When someone creates a post, the app calls the Edge Function `notify-on-event` with `event: 'new_post'`. The function sends a push to **all** registered devices: title **“Nova publicação”**, body = post title (or snippet). No admin has to tap “Send”.
2. **New comment** – When someone adds a comment, the app calls `notify-on-event` with `event: 'new_comment'`. Everyone gets a push: **“Novo comentário”** / **“Alguém comentou numa publicação.”**

So:

- **Automatic** = new post or new comment → app triggers `notify-on-event` → push to all users with a push token.
- **Manual** = admin opens Admin → Notifications and taps “Send” for a custom message (uses `send-notification`).

---

## What you need to do

1. **Deploy the Edge Function `notify-on-event`**  
   Supabase Dashboard → Edge Functions → Create function → name **`notify-on-event`** → paste the contents of **`supabase/functions/notify-on-event/index.ts`** → Deploy.

2. **That’s it for automatic push**  
   No Database Webhook is required. The app calls the function when a post or comment is created.

3. **(Optional)** Set **`WEBHOOK_SECRET`** only if you also use Database Webhooks for the same function. If you don’t use webhooks, you can leave it unset.

---

## Summary

| Question | Answer |
|----------|--------|
| Why push_tokens? | We need each device’s “address” to send a push. The app saves it when the user opens the app on a phone. |
| Do users need to do anything? | No. They just use the app; the token is registered automatically. |
| Is push automatic? | Yes. New post → everyone gets “Nova publicação”. New comment → everyone gets “Novo comentário”. |
| What’s manual? | Only the admin “Send” in Admin → Notifications for custom messages. |
