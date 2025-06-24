import React from "react";

// PUBLIC_INTERFACE
/**
 * Modal for ticket submission/details/updates with polished layout and proper styling.
 *
 * @param {object} props
 * @param {boolean} props.open - show/hide
 * @param {function} props.onClose - called to close modal
 * @param {string} props.title - modal header
 * @param {React.ReactNode} props.children - modal body/content
 */
function TicketModal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop">
      <div className="modal" role="dialog" aria-modal="true">
        <header className="modal-header">
          <div>{title}</div>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
            tabIndex={0}
          >✕</button>
        </header>
        <section className="modal-content">
          {children}
        </section>
        {/* Future: <footer className="modal-actions">{actions}</footer> */}
      </div>
    </div>
  );
}

export default TicketModal;
