export function Button({ children, variant = "primary", ...props }) {
  return (
    <button {...props} className={`btn btn-${variant} ${props.className || ""}`.trim()}>
      {children}
    </button>
  );
}

export function Input({ label, error, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input {...props} className="input" />
      {error && <small className="error">{error}</small>}
    </label>
  );
}

export function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-header">
          <h3>{title}</h3>
          <button onClick={onClose} className="btn btn-outline">
            Закрыть
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
