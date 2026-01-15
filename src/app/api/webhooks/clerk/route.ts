/**
 * Clerk Webhook Handler
 * Syncs user data from Clerk to our database
 */

import { WebhookEvent } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { headers } from "next/headers";
import { Webhook } from "svix";
import { encrypt } from "@/lib/auth/encryption";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

export async function POST(req: Request) {
  // Get the webhook secret from environment
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error(
      "Please add CLERK_WEBHOOK_SECRET to your environment variables",
    );
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error: Missing svix headers", { status: 400 });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the webhook
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error: Verification error", { status: 400 });
  }

  // Handle the webhook event
  const eventType = evt.type;

  try {
    switch (eventType) {
      case "user.created": {
        const {
          id,
          email_addresses,
          first_name,
          last_name,
          image_url,
          username,
        } = evt.data;

        // Get primary email
        const primaryEmail = email_addresses.find(
          (email) => email.id === evt.data.primary_email_address_id,
        );

        if (!primaryEmail) {
          return new Response("Error: No primary email found", { status: 400 });
        }

        // Check if this is the first user (they become admin)
        const existingUsers = await db.select().from(users);
        const isFirstUser = existingUsers.length === 0;

        // Encrypt sensitive data
        const encryptedEmail = encrypt(primaryEmail.email_address);
        const encryptedName =
          first_name || last_name
            ? encrypt(`${first_name || ""} ${last_name || ""}`.trim())
            : null;

        // Create user in database
        await db.insert(users).values({
          id: nanoid(),
          clerkId: id,
          username: username || null,
          encryptedEmail,
          encryptedName,
          encryptedDisplayName: encryptedName, // Initially same as name
          imageUrl: image_url || null,
          role: isFirstUser ? "admin" : "user",
          isProfilePublic: false,
        });

        console.log(
          `✅ User created: ${id} (${isFirstUser ? "Admin" : "User"})`,
        );
        break;
      }

      case "user.updated": {
        const {
          id,
          email_addresses,
          first_name,
          last_name,
          image_url,
          username,
        } = evt.data;

        // Get primary email
        const primaryEmail = email_addresses.find(
          (email) => email.id === evt.data.primary_email_address_id,
        );

        if (!primaryEmail) {
          return new Response("Error: No primary email found", { status: 400 });
        }

        // Encrypt sensitive data
        const encryptedEmail = encrypt(primaryEmail.email_address);
        const encryptedName =
          first_name || last_name
            ? encrypt(`${first_name || ""} ${last_name || ""}`.trim())
            : null;

        // Update user in database
        await db
          .update(users)
          .set({
            username: username || null,
            encryptedEmail,
            encryptedName,
            encryptedDisplayName: encryptedName, // Sync display name with updated name
            imageUrl: image_url || null,
            updatedAt: new Date(),
          })
          .where(eq(users.clerkId, id));

        console.log(`✅ User updated: ${id}`);
        break;
      }

      case "user.deleted": {
        const { id } = evt.data;

        if (!id) {
          return new Response("Error: No user ID provided", { status: 400 });
        }

        // Mark user as deleted (soft delete) instead of removing from database
        // This preserves battle history and user data for admin review
        // Only clear username (to free for reuse) and public fields
        // Keep encrypted name fields so admins can still identify the user
        await db
          .update(users)
          .set({
            isDeleted: true,
            deletedAt: new Date(),
            username: null, // Free up for reuse
            imageUrl: null, // Remove profile picture
            isProfilePublic: false, // Hide profile
            updatedAt: new Date(),
            // Note: encryptedEmail, encryptedName, encryptedDisplayName are kept for admin reference
          })
          .where(eq(users.clerkId, id));

        console.log(`✅ User marked as deleted: ${id}`);
        break;
      }

      default:
        console.log(`⚠️  Unhandled webhook event type: ${eventType}`);
    }

    return new Response("Webhook processed successfully", { status: 200 });
  } catch (error) {
    console.error(`Error processing webhook ${eventType}:`, error);
    return new Response("Error processing webhook", { status: 500 });
  }
}
