// Prices are in Ugandan shillings.
export function formatPrice(value) {
  if (value === null || value === undefined || value === "") return "";
  const number = Number(value);
  if (Number.isNaN(number)) return "";
  return `UGX ${number.toLocaleString("en-UG", { maximumFractionDigits: 0 })}`;
}
