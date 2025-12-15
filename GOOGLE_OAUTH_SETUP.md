# Google OAuth Setup Guide

This guide will help you configure Google OAuth authentication for the connected accounts feature.

## Prerequisites

- Access to your Supabase project dashboard
- A Google Cloud Console account

## Step 1: Configure Google OAuth in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Configure the OAuth consent screen if prompted:
   - Choose **External** user type
   - Fill in the required app information
   - Add scopes: `email`, `profile`
   - Add test users if in development
6. For Application type, select **Web application**
7. Add the following to **Authorized redirect URIs**:
   ```
   https://[YOUR-SUPABASE-PROJECT-REF].supabase.co/auth/v1/callback
   ```
   Replace `[YOUR-SUPABASE-PROJECT-REF]` with your actual Supabase project reference ID
8. Click **Create**
9. Copy the **Client ID** and **Client Secret**

## Step 2: Configure Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **Authentication** > **Providers**
4. Find **Google** in the list and enable it
5. Enter the **Client ID** and **Client Secret** from Step 1
6. Click **Save**

## Step 3: Run Database Migration

Apply the database migration to create the `connected_accounts` table:

```bash
# If using Supabase CLI locally
supabase db push

# Or apply manually through the Supabase dashboard
# Navigate to SQL Editor and run the migration file:
# supabase/migrations/20251214120000_add_connected_accounts.sql
```

## Step 4: Configure Environment Variables

Ensure your `.env` file has the correct Supabase credentials:

```env
VITE_SUPABASE_URL=https://[YOUR-SUPABASE-PROJECT-REF].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

## Step 5: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to Settings page
3. Find the "Connected Accounts" section
4. Click **Connect** next to Google
5. Complete the OAuth flow
6. Verify the account is shown as connected

## Features

- **Secure Storage**: OAuth tokens are securely stored in the database
- **Token Refresh**: Refresh tokens are saved for long-term access
- **Easy Disconnect**: Users can disconnect their Google account at any time
- **Profile Integration**: Connected Google email is displayed

## Security Notes

- Access tokens and refresh tokens are stored encrypted in the database
- Row Level Security (RLS) policies ensure users can only access their own connections
- The OAuth flow uses `access_type: 'offline'` and `prompt: 'consent'` for proper token generation

## Troubleshooting

### Redirect URI Mismatch
If you get a redirect URI mismatch error:
- Verify the redirect URI in Google Cloud Console matches your Supabase callback URL exactly
- Check that you've saved the changes in both Google Cloud Console and Supabase

### Connection Not Saving
If the connection doesn't save after OAuth:
- Check browser console for errors
- Verify the database migration has been applied
- Ensure RLS policies are enabled and configured correctly

### Token Expiration
- Access tokens typically expire after 1 hour
- Implement token refresh logic if you need to use the tokens for API calls
- The current implementation stores refresh tokens for future use

## Future Enhancements

Potential features to add:
- Automatic token refresh mechanism
- Integration with Google Calendar, Drive, or other services
- Support for additional providers (Microsoft, Apple, etc.)
- Sync functionality with Google services
