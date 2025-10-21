export default {
	providers: [
		{
			// Clerk JWT issuer domain
			// Set CLERK_JWT_ISSUER_DOMAIN in your Convex dashboard environment variables
			// Get this from Clerk Dashboard → JWT Templates → convex → Issuer URL
			domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
			applicationID: 'convex'
		}
	]
};

