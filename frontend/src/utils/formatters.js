// Remove empty filters so they are not sent as ?q=&role=
export function clean(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== "" && v !== null && v !== undefined)
  );
}

export function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function getErrorMessage(error, fallback = "Something went wrong.") {
  const data = error?.response?.data;
  if (typeof data?.detail === "string") return data.detail;
  if (typeof data?.error === "string") return data.error;
  if (typeof error?.message === "string") return error.message;
  return fallback;
}

export function getFieldErrors(error) {
  const data = error?.response?.data;
  return data && typeof data === "object" ? data : {};
}