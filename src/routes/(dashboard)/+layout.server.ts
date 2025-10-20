import { redirect } from '@sveltejs/kit';
import { clerkClient } from 'svelte-clerk/server';

export const load = async ({ locals }) => {
	const { userId } = await locals.auth();

	if (!userId) {
		return redirect(307, '/sign-in');
	}

	// Fetch full user data for the sidebar
	const user = await clerkClient.users.getUser(userId);

	return {
		userId,
		user: {
			id: user.id,
			firstName: user.firstName,
			lastName: user.lastName,
			email: user.primaryEmailAddress?.emailAddress,
			imageUrl: user.imageUrl
		}
	};
};
