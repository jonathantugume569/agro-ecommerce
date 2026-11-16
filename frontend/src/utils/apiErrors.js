// Turns Django REST Framework error responses into text for the UI.

function toText(value) {
  return Array.isArray(value) ? value.join(" ") : String(value);
}

// { email: "..." , password: "..." } for showing errors under each input.
export function getFieldErrors(error) {
  const data = error?.response?.data;
  if (!data || typeof data !== "object" || Array.isArray(data)) return {};

  const result = {};
  Object.entries(data).forEach(([key, value]) => {
    if (key === "detail" || key === "non_field_errors") return;
    result[key] = toText(value);
  });
  return result;
}

// One message for an alert box.
export function getErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  if (!error?.response) {
    return "Cannot reach the server. Check your connection and try again.";
  }
  const data = error.response.data;

  if (typeof data === "string") return fallback;
  if (Array.isArray(data)) return toText(data);
  if (data?.detail) return toText(data.detail);
  if (data?.non_field_errors) return toText(data.non_field_errors);

  const first = Object.values(getFieldErrors(error))[0];
  return first || fallback;
}
