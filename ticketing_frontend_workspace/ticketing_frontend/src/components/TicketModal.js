import React from "react";

// PUBLIC_INTERFACE
/**
 * Modal for ticket submission/details/updates; blank until API integration.
 * 
 * @param {object} props
 * @param {boolean} props.open - show/hide
 * @param {function} props.onClose - called to close modal
 * @param {React.ReactNode} props.children
 * @param {string} props.title
 */
function TicketModal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop">
      <div className="modal" role="dialog" aria-modal="true">
        <header className="modal-header">
          <div>{title}</div>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </header>
        <section className="modal-content">{children}</section>
      </div>
    </div>
  );
}

export default TicketModal;
