function ErrorMessage({ error }) {
  function handleRetry() {
    window.location.reload();
  }

  return (
    <div className="flex min-h-40 items-center justify-center rounded-xl border border-red-200 bg-red-50 p-6 shadow-md">
      <div className="text-center">
        {/* Error Icon */}
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <span className="text-2xl">⚠️</span>
        </div>

        {/* Title */}
        <h2 className="text-lg font-semibold text-red-700">
          Oops! Something went wrong
        </h2>

        {/* Error Message */}
        <p className="mt-2 text-sm text-red-600">
          {error?.message || "We couldn't load your tasks."}
        </p>

        {/* Retry Button */}
        <button
          type="button"
          onClick={handleRetry}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

export default ErrorMessage;