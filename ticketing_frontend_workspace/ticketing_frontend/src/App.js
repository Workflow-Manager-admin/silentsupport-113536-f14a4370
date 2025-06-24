import React, { useState } from "react";
import "./App.css";
import "./components/components.css";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import TicketModal from "./components/TicketModal";

// Mock initial ticket data
const mockTickets = [
  {
    id: "1",
    subject: "Can't login to the dashboard",
    status: "open",
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    subject: "Feature request: dark mode",
    status: "closed",
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

// PUBLIC_INTERFACE
/**
 * Main entry point: Ticketing Frontend App
 */
function App() {
  const [tickets, setTickets] = useState(mockTickets);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Handlers for actions
  const handleNewTicket = () => {
    setSelectedTicket(null);
    setModalOpen(true);
  };
  const handleSelectTicket = (ticket) => {
    setSelectedTicket(ticket);
    setModalOpen(true);
  };
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedTicket(null);
  };

  return (
    <div className="app">
      {/* Sidebar Navigation */}
      <Sidebar onNewTicket={handleNewTicket} active="tickets" />

      {/* Topbar/brand — can be expanded with notifications/actions */}
      <nav
        className="navbar"
        style={{
          background: "var(--background)",
          borderBottom: "1px solid var(--border-color)",
          color: "var(--primary)",
          marginLeft: 210,
        }}
      >
        <div className="container" style={{ maxWidth: "100%", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div className="logo" style={{ color: "var(--primary)" }}>
              <span className="logo-symbol">🎫</span>
              SilentSupport
            </div>
          </div>
        </div>
      </nav>

      {/* Main content area */}
      <main>
        <Dashboard
          tickets={tickets}
          onSelectTicket={handleSelectTicket}
          loading={false}
        />

        <TicketModal
          open={modalOpen}
          onClose={handleCloseModal}
          title={selectedTicket ? "Ticket Details" : "New Ticket"}
        >
          {selectedTicket ? (
            <div>
              <div>
                <b>Subject:</b> {selectedTicket.subject}
              </div>
              <div>
                <b>Status:</b> {selectedTicket.status}
              </div>
              <div>
                <b>Last Updated:</b> {new Date(selectedTicket.updated_at).toLocaleString()}
              </div>
              <div style={{ marginTop: 22, color: "#aaa" }}>
                {/* Placeholder for ticket details, history, etc. */}
                [Ticket details and responses will appear here...]
              </div>
            </div>
          ) : (
            <div>
              {/* Placeholder for ticket submission form */}
              <form>
                <label>
                  Subject
                  <input
                    type="text"
                    style={{
                      display: "block",
                      width: "98%",
                      margin: "7px 0 20px 0",
                      padding: "9px 8px",
                      border: "1px solid var(--border-color)",
                      borderRadius: 4,
                    }}
                    placeholder="Describe your issue in one line"
                  />
                </label>
                <label>
                  Details
                  <textarea
                    style={{
                      display: "block",
                      width: "98%",
                      padding: "8px",
                      minHeight: "70px",
                      margin: "7px 0 20px 0",
                      border: "1px solid var(--border-color)",
                      borderRadius: 4,
                    }}
                    placeholder="Provide more details about your issue (optional)"
                  ></textarea>
                </label>
                <button
                  className="btn"
                  type="submit"
                  style={{
                    background: "var(--accent)",
                    color: "#fff",
                    float: "right",
                  }}
                  disabled={true /* until hooked to backend */}
                >
                  Submit (disabled: no backend)
                </button>
              </form>
            </div>
          )}
        </TicketModal>
      </main>
    </div>
  );
}

export default App;