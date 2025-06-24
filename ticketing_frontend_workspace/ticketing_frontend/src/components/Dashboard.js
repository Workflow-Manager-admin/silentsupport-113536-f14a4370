import React from "react";
import TicketList from "./TicketList";

// PUBLIC_INTERFACE
/**
 * Dashboard main area: lists tickets and allows actions on them.
 *
 * @param {object} props
 * @param {Array} props.tickets - array of ticket objects
 * @param {function} props.onSelectTicket - called with ticket to show details
 * @param {boolean} props.loading - loading state for ticket list
 */
function Dashboard({ tickets = [], onSelectTicket, loading }) {
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>My Tickets</h1>
      </header>
      <div style={{ margin: "16px 0 32px" }}>
        <TicketList tickets={tickets} onSelectTicket={onSelectTicket} loading={loading} />
      </div>
    </div>
  );
}

export default Dashboard;
