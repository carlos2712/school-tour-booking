import { signIn, auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ verify?: string }>;
}) {
  const session = await auth();
  if (session) redirect("/admin");

  const { verify } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-gold font-bold text-xl tracking-wide uppercase">
            American Stage
          </p>
          <p className="text-gray-500 text-sm tracking-widest uppercase mt-1">
            Admin Portal
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-8">
          {verify ? (
            <div className="text-center">
              <div className="text-4xl mb-4">📧</div>
              <h1 className="text-foreground font-bold text-xl mb-2">Check your email</h1>
              <p className="text-gray-500 text-sm">
                We sent you a magic link. Click it to sign in to the admin panel.
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-foreground font-bold text-xl mb-1">Sign in</h1>
              <p className="text-gray-500 text-sm mb-6">
                Enter your admin email to receive a sign-in link.
              </p>
              <form
                action={async (formData: FormData) => {
                  "use server";
                  await signIn("resend", formData);
                }}
                className="space-y-4"
              >
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="admin@americanstage.org"
                    className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-foreground placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gold text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full h-10 bg-gold text-navy font-semibold rounded-md hover:bg-gold-light transition-colors text-sm"
                >
                  Send magic link →
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
