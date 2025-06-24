import React from "react";

// PUBLIC_INTERFACE
/**
 * Lists tickets in a minimal, modern table/list layout.
 *
 * @param {object} props
 * @param {Array} props.tickets - array of ticket objects
 * @param {function} props.onSelectTicket - called with ticket
 * @param {boolean} props.loading
 */
function TicketList({ tickets, onSelectTicket, loading }) {
  if (loading) {
    return <div style={{ padding: 24 }}>Loading tickets…</div>;
  }
  if (!tickets || !tickets.length) {
    return <div style={{ padding: 24, color: "var(--text-secondary)" }}>No tickets yet.</div>;
  }
  return (
    <div className="ticket-list">
      <div className="ticket-list-header">
        <span>Subject</span>
        <span>Status</span>
        <span style={{ minWidth: 110 }}>Last Updated</span>
      </div>
      <div className="ticket-list-body">
        {tickets.map(t =>
          <button
            className="ticket-row"
            key={t.id}
            onClick={() => onSelectTicket(t)}
            aria-label={`View ticket: ${t.subject}`}
          >
            <span className="ticket-subject">{t.subject}</span>
            <span className={`ticket-status status-${t.status}`}>{t.status}</span>
            <span>{new Date(t.updated_at).toLocaleString()}</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default TicketList;
