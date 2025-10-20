import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	const { userId } = await locals.auth();

	if (!userId) {
		return redirect(307, '/sign-in');
	}

	return {
		userId
	};
};
