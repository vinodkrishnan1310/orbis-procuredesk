import { loginAction } from "@/app/actions/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return (
    <>
      <h1>Sign in</h1>
      {params.error ? (
        <p data-testid="login-error" role="alert">
          Sign in failed. Check your username and password.
        </p>
      ) : null}
      <form action={loginAction} method="post" data-testid="login-form">
        <p>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            required
          />
        </p>
        <p>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </p>
        <button type="submit" data-testid="login-submit">
          Sign in
        </button>
      </form>
    </>
  );
}