import { auth, currentUser } from "@clerk/nextjs/server";

export const dynamic = 'force-dynamic';

export default async function DebugAuthPage() {
  const authData = await auth();
  const user = await currentUser();

  return (
    <div className="p-8 bg-gray-900 min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-4">Debug Auth Info</h1>

      <div className="space-y-4">
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="font-bold mb-2">Auth Data:</h2>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(
              {
                userId: authData.userId,
                orgId: authData.orgId,
                orgRole: authData.orgRole,
                orgSlug: authData.orgSlug,
                sessionClaims: authData.sessionClaims,
              },
              null,
              2
            )}
          </pre>
        </div>

        <div className="bg-gray-800 p-4 rounded">
          <h2 className="font-bold mb-2">Current User:</h2>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(
              user
                ? {
                    id: user.id,
                    username: user.username,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    emailAddresses: user.emailAddresses,
                  }
                : null,
              null,
              2
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}
