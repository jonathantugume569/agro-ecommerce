// A label + input/textarea/select + error text.
// <FormField label="Email" name="email" type="email" value={v} onChange={fn} error={err} required />
// <FormField as="select" ...><option>..</option></FormField>
export default function FormField({ label, name, as = "input", error, hint, children, ...rest }) {
  const Tag = as;
  const id = `field-${name}`;

  return (
    <div className={`form-field${error ? " has-error" : ""}`}>
      <label htmlFor={id}>
        {label}
        {rest.required && <span className="req"> *</span>}
      </label>
      <Tag id={id} name={name} {...rest}>
        {children}
      </Tag>
      {hint && !error && <small className="hint">{hint}</small>}
      {error && <small className="error-text">{error}</small>}
    </div>
  );
}
