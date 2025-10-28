/**
 * Script to manually sync a user's profile from Clerk to the database
 * Usage: tsx scripts/sync-user-profile.ts <clerk-user-id>
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { createClerkClient } from '@clerk/backend';
import { db } from '../src/lib/db/client';
import { users } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';
import { encrypt } from '../src/lib/auth/encryption';

async function syncUserProfile(clerkUserId: string) {
  try {
    console.log(`🔄 Fetching user from Clerk: ${clerkUserId}`);
    
    if (!process.env.CLERK_SECRET_KEY) {
      console.error('❌ CLERK_SECRET_KEY not found in environment variables');
      process.exit(1);
    }
    
    // Fetch user from Clerk
    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
    const clerkUser = await clerk.users.getUser(clerkUserId);

    if (!clerkUser) {
      console.error('❌ User not found in Clerk');
      process.exit(1);
    }

    console.log(`✅ Found Clerk user: ${clerkUser.firstName} ${clerkUser.lastName}`);

    // Get primary email
    const primaryEmail = clerkUser.emailAddresses.find(
      (email) => email.id === clerkUser.primaryEmailAddressId
    );

    if (!primaryEmail) {
      console.error('❌ No primary email found');
      process.exit(1);
    }

    // Encrypt sensitive data
    const encryptedEmail = encrypt(primaryEmail.emailAddress);
    const fullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim();
    const encryptedName = fullName ? encrypt(fullName) : null;

    console.log(`🔄 Updating database record...`);

    // Update user in database
    await db
      .update(users)
      .set({
        encryptedEmail,
        encryptedName,
        encryptedDisplayName: encryptedName, // Sync display name with current name
        imageUrl: clerkUser.imageUrl || null,
        updatedAt: new Date(),
      })
      .where(eq(users.clerkId, clerkUserId));

    console.log(`✅ User profile synced successfully!`);
    console.log(`   Name: ${fullName}`);
    console.log(`   Email: ${primaryEmail.emailAddress}`);
    console.log(`   Image: ${clerkUser.imageUrl || 'None'}`);

  } catch (error) {
    console.error('❌ Error syncing user profile:', error);
    process.exit(1);
  }
}

// Get Clerk user ID from command line arguments
const clerkUserId = process.argv[2];

if (!clerkUserId) {
  console.error('❌ Please provide a Clerk user ID');
  console.log('Usage: tsx scripts/sync-user-profile.ts <clerk-user-id>');
  process.exit(1);
}

syncUserProfile(clerkUserId).then(() => {
  console.log('✅ Done!');
  process.exit(0);
});


