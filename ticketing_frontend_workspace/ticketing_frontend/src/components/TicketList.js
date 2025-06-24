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

  // Helper to get status and visual for ticket
  function getStatus(t) {
    if (t.closed) return "Closed";
    return "Open";
  }
  function getStatusClass(t) {
    return t.closed ? "closed" : "open";
  }
  function getLastUpdated(t) {
    // Prefer closed_at, fallback to created_at, fallback to blank
    if (t.closed && t.closed_at) return t.closed_at;
    // You might wish to show latest response time if present, but for now: created_at.
    return t.created_at || "";
  }

  return (
    <div className="ticket-list">
      <div className="ticket-list-header">
        <span>Subject</span>
        <span style={{ minWidth: 220 }}>Message Preview</span>
        <span>Status</span>
        <span style={{ minWidth: 110 }}>Created / Closed</span>
      </div>
      <div className="ticket-list-body">
        {tickets.map((t) => (
          <button
            className="ticket-row"
            key={t.ticket_id}
            onClick={() => onSelectTicket(t)}
            aria-label={`View ticket: ${t.title}`}
          >
            <span className="ticket-subject">{t.title}</span>
            <span
              style={{
                maxWidth: 400,
                color: "var(--text-secondary)",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                overflow: "hidden",
                fontSize: "0.98rem",
                display: "inline-block",
              }}
            >
              {t.message ? (t.message.length > 84 ? t.message.slice(0, 84) + "…" : t.message) : ""}
            </span>
            <span className={`ticket-status status-${getStatusClass(t)}`}>{getStatus(t)}</span>
            <span>
              {getLastUpdated(t)
                ? new Date(getLastUpdated(t)).toLocaleString()
                : ""}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default TicketList;
