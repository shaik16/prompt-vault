import { redirect } from '@sveltejs/kit';

export const load = async ({ locals, params }) => {
	const { userId } = await locals.auth();

	if (!userId) {
		return redirect(307, '/sign-in');
	}

	// Return the prompt ID for client-side fetching
	return {
		promptId: params.id
	};
};

