import React from "react";
import "./Sidebar.css";

// PUBLIC_INTERFACE
/**
 * Sidebar navigation for main app actions.
 * @param {object} props
 * @param {function} props.onNewTicket - callback for "New Ticket"
 * @param {string} props.active - currently selected navigation
 */
function Sidebar({ onNewTicket, active }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-title">Support</div>
      <nav className="sidebar-nav">
        <button
          className={`sidebar-link ${active === "tickets" ? "active" : ""}`}
          aria-current={active === "tickets"}
        >
          <span role="img" aria-label="tickets">🎫</span> Tickets
        </button>
        <button
          className="sidebar-link"
          onClick={onNewTicket}
          style={{ marginTop: "auto", background: "var(--accent)", color: "#fff" }}
        >
          + New Ticket
        </button>
      </nav>
    </aside>
  );
}

export default Sidebar;
