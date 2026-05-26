type FriendlyErrorInput = {
  status?: number;
  error?: unknown;
  action?: string;
};

function firstString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) return value;

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = firstString(item);
      if (found) return found;
    }
  }

  if (value && typeof value === 'object') {
    for (const item of Object.values(value as Record<string, unknown>)) {
      const found = firstString(item);
      if (found) return found;
    }
  }

  return null;
}

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

export function getFriendlyUnexpectedResponseError(action?: string): string {
  const actionLabel = getActionLabel(action);
  return `Something unexpected happened while trying to ${actionLabel}. Please try again.`;
}

export async function getFriendlyResponseError(response: Response, action?: string): Promise<string> {
  try {
    const data = (await response.json()) as unknown;
    const parsed = firstString((data as { error?: { message?: unknown; details?: unknown } })?.error?.message)
      ?? firstString((data as { error?: { message?: unknown; details?: unknown } })?.error?.details);

    if (parsed) return parsed;
  } catch {
    // ignore
  }

  return getFriendlyRequestError({ status: response.status, action });
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
