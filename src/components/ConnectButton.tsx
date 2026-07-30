export function ConnectButton() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-2xl font-semibold">Training Coach</h1>
      <p className="max-w-md text-slate-400">
        Connect your Strava account to get load-aware daily workout recommendations and a
        structured training plan.
      </p>
      <a
        href="/api/strava/login"
        className="rounded-md bg-orange-600 px-5 py-2.5 font-medium text-white hover:bg-orange-500"
      >
        Connect with Strava
      </a>
    </div>
  );
}
