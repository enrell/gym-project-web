export function handleApiError(error: unknown) {
  if (axios.isAxiosError(error)) {
    // Handle Axios errors
  } else if (error instanceof Error) {
    // Handle general errors
  } else {
    // Handle unknown errors
  }
  // Log error, show user-friendly message, etc.
}