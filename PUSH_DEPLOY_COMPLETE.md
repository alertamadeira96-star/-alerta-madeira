# Push Notifications – Complete Setup

## Step 1: Run SQL in Supabase

1. Supabase Dashboard → **SQL Editor** → **New query**
2. Copy and run the contents of **`supabase-push-tables.sql`**
3. This creates `notifications` and `push_tokens` tables (if they don't exist)

## Step 2: Deploy Edge Functions

### notify-on-event (automatic push on new post/comment)

1. Supabase → **Edge Functions** → **Create a new function**
2. Name: **`notify-on-event`**
3. Paste the full contents of **`supabase/functions/notify-on-event/index.ts`**
4. Deploy

### send-notification (manual push from Admin panel)

1. Supabase → **Edge Functions** → **Create a new function**
2. Name: **`send-notification`**
3. Paste the full contents of **`supabase/functions/send-notification/index.ts`**
4. Deploy

## Step 3: Test from Dashboard

1. Supabase → **Edge Functions** → **notify-on-event** → **Invoke**
2. **Headers:** Key `x-invoke-secret`, Value `test`
3. **Body:**
   ```json
   {"event":"new_post","title":"Test","body":"Test notification"}
   ```
4. Click Invoke
5. Check **Table Editor** → **notifications** – a new row should appear

## Step 4: Test from App (web)

1. Run `bun run web`
2. Log in and create a new post
3. Check **Table Editor** → **notifications** – a new row should appear
4. Check browser console – no "Push notify error" if it worked

## Summary

| Component | Purpose |
|-----------|---------|
| `supabase-push-tables.sql` | Creates notifications + push_tokens tables |
| `notify-on-event` | Sends push when post/comment created (automatic) |
| `send-notification` | Sends push when admin taps Send (manual) |
