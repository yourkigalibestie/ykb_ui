type FriendlyErrorInput = {
  status?: number;
  error?: unknown;
  action?: string;
};

function isLikelyNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) return true;
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  return (
    message.includes('failed to fetch') ||
    message.includes('networkerror') ||
    message.includes('network request failed') ||
    message.includes('load failed') ||
    message.includes('econnrefused') ||
    message.includes('enotfound') ||
    message.includes('socket hang up')
  );
}

function getActionLabel(action?: string): string {
  if (!action || action.trim().length === 0) return 'load this information';
  return action.trim();
}

export function getFriendlyRequestError({ status, error, action }: FriendlyErrorInput): string {
  const actionLabel = getActionLabel(action);

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return 'You seem to be offline. Please check your internet connection and try again.';
  }

  if (typeof status === 'number') {
    if (status === 408) {
      return 'The request took too long. Please try again.';
    }

    if (status === 429) {
      return 'Too many requests were sent at once. Please wait a moment and try again.';
    }

    if (status === 502 || status === 503 || status === 504) {
      return `Our service is temporarily unavailable. Please try again in a few minutes.`;
    }

    if (status >= 500) {
      return `Something went wrong on our side while trying to ${actionLabel}. Please try again soon.`;
    }

    if (status === 404) {
      return `We could not find what you were looking for right now. Please try again later.`;
    }

    if (status >= 400) {
      return `We could not ${actionLabel} right now. Please try again.`;
    }
  }

  if (isLikelyNetworkError(error)) {
    return 'We could not connect right now. Please check your internet connection and try again.';
  }

  return `We could not ${actionLabel} right now. Please try again.`;
}
