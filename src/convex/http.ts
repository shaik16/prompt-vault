import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { Webhook } from 'svix';
import { internal } from './_generated/api';

/**
 * Simple test route to verify HTTP routing is working
 */
export const testRoute = httpAction(async () => {
	console.log('✓ Test route called');
	return new Response('Hello World', {
		status: 200,
		headers: { 'Content-Type': 'text/plain' }
	});
});

/**
 * Clerk Webhook Handler
 *
 * This HTTP endpoint receives webhooks from Clerk when users are created, updated, or deleted.
 * It verifies the webhook signature and syncs the user data to the Convex database.
 *
 * Setup:
 * 1. Go to Clerk Dashboard → Webhooks
 * 2. Create a webhook endpoint pointing to: https://your-convex-url/clerk
 * 3. Subscribe to events: user.created, user.updated, user.deleted
 * 4. Copy the signing secret and add it to your environment variables as CLERK_WEBHOOK_SECRET
 */

export const clerk = httpAction(async (ctx, request) => {
	const event = await request.json();
	const eventType = event.type;

	// Verify webhook signature
	const svixId = request.headers.get('svix-id');
	const svixTimestamp = request.headers.get('svix-timestamp');
	const svixSignature = request.headers.get('svix-signature');

	if (!svixId || !svixTimestamp || !svixSignature) {
		return new Response('Missing Svix headers', { status: 400 });
	}

	const secret = process.env.CLERK_WEBHOOK_SECRET;
	console.log(secret);

	if (!secret) {
		console.error('CLERK_WEBHOOK_SECRET not configured');
		return new Response('Webhook secret not configured', { status: 500 });
	}

	try {
		const wh = new Webhook(secret);
		wh.verify(JSON.stringify(event), {
			'svix-id': svixId,
			'svix-timestamp': svixTimestamp,
			'svix-signature': svixSignature
		});
		console.log('✓ Webhook signature verified for event:', eventType);
	} catch (err) {
		console.error('✗ Webhook verification failed:', err);
		return new Response('Webhook verification failed', { status: 401 });
	}

	// Handle different event types
	if (eventType === 'user.created' || eventType === 'user.updated') {
		const { id, email_addresses, first_name, last_name, image_url } = event.data;

		const email = email_addresses?.[0]?.email_address || '';
		const name = `${first_name || ''} ${last_name || ''}`.trim();

		console.log(`Processing ${eventType} event for user:`, {
			clerkUserId: id,
			email,
			name
		});

		try {
			await ctx.runMutation(internal.users.upsertFromClerk, {
				clerkUserId: id,
				email,
				name,
				imageUrl: image_url
			});

			console.log('✓ User synced successfully:', id);
			return new Response(JSON.stringify({ success: true }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});
		} catch (err) {
			console.error('✗ Error syncing user:', err);
			return new Response(JSON.stringify({ error: String(err) }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			});
		}
	}

	if (eventType === 'user.deleted') {
		const { id } = event.data;

		console.log('Processing user.deleted event for user:', id);

		try {
			await ctx.runMutation(internal.users.deleteFromClerk, {
				clerkUserId: id
			});

			console.log('✓ User deleted successfully:', id);
			return new Response(JSON.stringify({ success: true }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});
		} catch (err) {
			console.error('✗ Error deleting user:', err);
			return new Response(JSON.stringify({ error: String(err) }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			});
		}
	}

	// Ignore other event types
	return new Response(JSON.stringify({ success: true }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' }
	});
});

const http = httpRouter();

// Test route - remove after verifying HTTP routing works
http.route({
	path: '/test',
	method: 'GET',
	handler: testRoute
});

http.route({
	path: '/clerk',
	method: 'POST',
	handler: clerk
});

export default http;
