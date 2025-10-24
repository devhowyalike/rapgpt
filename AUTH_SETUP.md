# Clerk Authentication Setup Guide

This guide walks you through setting up Clerk authentication with role-based access control for RapGPT.

## Prerequisites

- A Clerk account (sign up at [clerk.com](https://clerk.com))
- Your application deployed or running locally

## Step 1: Create a Clerk Application

1. Go to the [Clerk Dashboard](https://dashboard.clerk.com)
2. Click "Create application"
3. Name your application (e.g., "RapGPT")
4. Select authentication methods:
   - Enable **Google** OAuth
   - You can add more providers later

## Step 2: Get Your API Keys

1. In your Clerk Dashboard, go to **API Keys**
2. Copy the following values:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`

## Step 3: Configure Environment Variables

Create or update your `.env.local` file with the following variables:

```bash
# Database (Vercel Postgres)
POSTGRES_URL=your_postgres_url

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Clerk Webhook Secret (we'll get this in Step 5)
CLERK_WEBHOOK_SECRET=whsec_...

# Encryption Key (generate in Step 4)
ENCRYPTION_KEY=...

# Anthropic API (for AI battle generation)
ANTHROPIC_API_KEY=your_anthropic_key
```

## Step 4: Generate Encryption Key

The encryption key is used to encrypt sensitive user data (email, names, display names) in the database.

Generate a secure 32-byte hex key by running:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and add it to your `.env.local` as `ENCRYPTION_KEY`.

**Important:** Keep this key secure and never commit it to version control. If you lose it, you won't be able to decrypt existing user data.

## Step 5: Set Up Clerk Webhook

The webhook syncs Clerk user data to your database and assigns roles.

### 5.1 Get Your Webhook URL

Your webhook endpoint is:

- **Local Development:** Use [ngrok](https://ngrok.com) or similar to expose localhost

  ```bash
  ngrok http 3000
  # Your webhook URL will be: https://your-ngrok-url.ngrok.io/api/webhooks/clerk
  ```

- **Production:** `https://your-domain.com/api/webhooks/clerk`

### 5.2 Configure Webhook in Clerk Dashboard

1. Go to **Webhooks** in your Clerk Dashboard
2. Click "Add Endpoint"
3. Enter your webhook URL: `https://your-domain.com/api/webhooks/clerk`
4. Select the following events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
5. Click "Create"
6. Copy the **Signing Secret** (starts with `whsec_`)
7. Add it to your `.env.local` as `CLERK_WEBHOOK_SECRET`

## Step 6: Run Database Migrations

Apply the database schema changes:

```bash
pnpm db:push
```

This creates the following tables:

- `users` - User accounts with roles
- `comments` - New comments (replaces JSONB)
- Updates `votes` table with user foreign keys
- Updates `battles` table with `created_by` and `is_featured` fields

## Step 7: Configure Clerk Appearance (Optional)

### Custom Sign-In Page

The app includes a custom sign-in page at `/sign-in` with RapGPT branding.

### Session Token Customization

To include user roles in the session token:

1. Go to **Sessions** in your Clerk Dashboard
2. Click "Edit" next to "Customize session token"
3. Add the following JSON:

```json
{
  "metadata": "{{user.public_metadata}}"
}
```

This allows the middleware to check user roles without database queries.

## Step 8: Test the Setup

1. **Start your development server:**

   ```bash
   pnpm dev
   ```

2. **Sign up as the first user:**

   - Navigate to your app
   - Click "Sign In" in the header
   - Create an account with Google OAuth
   - **This first user will automatically become an admin!**

3. **Verify admin access:**

   - You should see an "Admin" link in the header
   - Navigate to `/admin/dashboard`
   - You should see the admin dashboard

4. **Test user functionality:**
   - Create a second account (or use incognito/different browser)
   - This user will have the "user" role
   - They should NOT see the "Admin" link
   - They can access `/my-battles` to create personal battles

## Role Management

### First User = Admin

The first user to sign up automatically gets the `admin` role. This is handled in the webhook at `src/app/api/webhooks/clerk/route.ts`.

### Promoting Users to Admin

Currently, role management is manual. To promote a user to admin:

**Option 1: Directly in Database**

```sql
UPDATE users SET role = 'admin' WHERE clerk_id = 'user_xxxxx';
```

**Option 2: Via Clerk Dashboard Public Metadata**

1. Go to **Users** in Clerk Dashboard
2. Select the user
3. Edit **Public metadata**
4. Add: `{ "role": "admin" }`
5. The webhook will sync this on next user update

### Future Enhancement

The admin dashboard has a user management interface prepared. You can extend it to allow admins to toggle user roles.

## Features by Role

### Public (Unauthenticated)

- ✅ View featured battles
- ✅ View archive
- ✅ View individual battles
- ❌ Cannot vote or comment
- ❌ Cannot create battles

### User (Authenticated)

- ✅ All public features
- ✅ Vote on battles
- ✅ Comment on battles
- ✅ Create personal battles at `/my-battles/new`
  - ✅ Share battle links
- ❌ Cannot create featured battles
- ❌ Cannot access admin dashboard

### Admin (Authenticated)

- ✅ All user features
- ✅ Create featured battles at `/admin/battles/new`
- ✅ Access admin dashboard at `/admin/dashboard`
- ✅ View all users and their roles
- ✅ View and delete any battle
- ✅ Delete user battles and comments (cascade)

## Security Notes

1. **Environment Variables:** Never commit `.env.local` to git
2. **Encryption Key:** Store securely and back it up
3. **Webhook Secret:** Keep the `CLERK_WEBHOOK_SECRET` private
4. **Database Access:** Only admins should have direct database access

## Troubleshooting

### "User not found" after signing in

**Solution:** Check that your webhook is properly configured and receiving events. The webhook creates the user in your database. Check Clerk Dashboard > Webhooks > Logs.

### First user not getting admin role

**Solution:** Ensure the webhook fired for `user.created`. Check your webhook logs. You can manually set the role in the database if needed.

### Votes/Comments not working

**Solution:**

1. Verify user is signed in (check Clerk dev tools)
2. Check that user exists in your database
3. Check API route responses in Network tab
4. Verify database foreign keys are set up correctly

### Encryption errors

**Solution:**

1. Verify `ENCRYPTION_KEY` is set in `.env.local`
2. Ensure the key is exactly 64 hex characters (32 bytes)
3. Restart your development server after adding the key

## Production Deployment

### Vercel

1. **Add Environment Variables:**

   - Go to Project Settings > Environment Variables
   - Add all variables from `.env.local`
   - Include `ENCRYPTION_KEY` and `CLERK_WEBHOOK_SECRET`

2. **Update Webhook URL:**

   - In Clerk Dashboard, update webhook endpoint to production URL
   - `https://your-domain.vercel.app/api/webhooks/clerk`

3. **Run Migrations:**

   ```bash
   pnpm db:push
   ```

4. **Deploy:**
   ```bash
   vercel --prod
   ```

### First Production User

Sign up on production as soon as deployed to claim the admin role!

## Additional Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Next.js App Router Auth](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk Webhooks](https://clerk.com/docs/integrations/webhooks)
- [Drizzle ORM](https://orm.drizzle.team)

## Support

If you encounter issues:

1. Check Clerk Dashboard logs
2. Check your application logs
3. Verify all environment variables are set
4. Ensure webhook is receiving events
