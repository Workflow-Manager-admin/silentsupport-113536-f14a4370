import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import "./components/components.css";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import TicketModal from "./components/TicketModal";

/**
 * API base URL for FastAPI backend.
 * In browser environments, process.env is undefined unless replaced by a bundler.
 * To avoid ReferenceError, use a safe fallback.
 */
const API_BASE =
  (typeof process !== "undefined" && process.env && process.env.REACT_APP_API_BASE)
    ? process.env.REACT_APP_API_BASE
    : "https://vscode-internal-788600-beta.beta01.cloud.kavia.ai:3001";

// Helper function to fetch JSON (handles non-2xx HTTP as errors)
async function fetchJSON(url, options = {}) {
  const resp = await fetch(url, {
    ...options,
    headers: {
      ...(options && options.headers ? options.headers : {}),
      "Content-Type": "application/json",
    },
  });
  if (!resp.ok) {
    const reason = await resp.text();
    let body;
    try {
      body = JSON.parse(reason);
    } catch {
      body = { error: reason || resp.statusText, status: resp.status };
    }
    throw body;
  }
  return await resp.json();
}

// PUBLIC_INTERFACE
/**
 * Main entry point: Ticketing Frontend App
 */
function App() {
  // TICKET STATE
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [ticketsError, setTicketsError] = useState(null);

  // POLLING
  const pollingRef = useRef();
  const POLL_INTERVAL = 8000; // ms; adjust as needed

  // MODAL / SELECT STATE
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null); // (ticket object)
  const [modalMode, setModalMode] = useState("new"); // "new", "details", "edit", "respond", "close"

  // GLOBAL/CONFIRM STATE
  const [globalMessage, setGlobalMessage] = useState(null);

  // Load all tickets
  const loadTickets = async () => {
    setLoadingTickets(true);
    setTicketsError(null);
    try {
      const data = await fetchJSON(`${API_BASE}/tickets`);
      // sort by newest
      setTickets(data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (err) {
      setTicketsError(err && err.error ? err.error : "Failed to load tickets");
    }
    setLoadingTickets(false);
  };

  // Polling effect for real-time ticket updates
  useEffect(() => {
    loadTickets();
    pollingRef.current = setInterval(() => {
      loadTickets();
    }, POLL_INTERVAL);
    return () => {
      clearInterval(pollingRef.current);
    };
    // eslint-disable-next-line
  }, []);

  // Modal open handlers
  const handleNewTicket = () => {
    setSelectedTicket(null);
    setModalMode("new");
    setModalOpen(true);
  };
  const handleSelectTicket = async (ticket) => {
    setModalMode("details");
    setModalOpen(true);
    // Fetch fresh details
    try {
      const t = await fetchJSON(`${API_BASE}/tickets/${ticket.ticket_id || ticket.id}`);
      setSelectedTicket(t);
    } catch (err) {
      setSelectedTicket(ticket); // fallback
    }
  };
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedTicket(null);
    setModalMode("new");
  };

  // Ticket submission
  const handleSubmitTicket = async (form, onStatus) => {
    onStatus({ loading: true });
    try {
      const t = await fetchJSON(`${API_BASE}/tickets`, {
        method: "POST",
        body: JSON.stringify({
          title: form.title,
          message: form.message,
        }),
      });
      setGlobalMessage("Ticket submitted successfully");
      handleCloseModal();
      await loadTickets(); // refresh
      onStatus({ loading: false, success: true });
    } catch (err) {
      onStatus({ loading: false, error: err && err.error ? err.error : "Submission failed" });
    }
  };

  // Ticket update (title/message)
  const handleUpdateTicket = async (ticketId, form, onStatus) => {
    onStatus({ loading: true });
    try {
      const updated = await fetchJSON(`${API_BASE}/tickets/${ticketId}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...(form.title !== undefined ? { title: form.title } : {}),
          ...(form.message !== undefined ? { message: form.message } : {}),
        }),
      });
      setGlobalMessage("Ticket updated successfully");
      handleCloseModal();
      await loadTickets();
      onStatus({ loading: false, success: true });
    } catch (err) {
      onStatus({ loading: false, error: err && err.error ? err.error : "Update failed" });
    }
  };

  // Ticket add response (message)
  const handleAddResponse = async (ticketId, form, onStatus) => {
    onStatus({ loading: true });
    try {
      await fetchJSON(`${API_BASE}/tickets/${ticketId}/responses`, {
        method: "POST",
        body: JSON.stringify({
          responder: form.responder || "Anonymous",
          message: form.message,
        }),
      });
      setGlobalMessage("Response added");
      handleCloseModal();
      await loadTickets();
      onStatus({ loading: false, success: true });
    } catch (err) {
      onStatus({ loading: false, error: err && err.error ? err.error : "Response send failed" });
    }
  };

  // Ticket close
  const handleCloseTicket = async (ticketId, closeReason, onStatus) => {
    onStatus({ loading: true });
    try {
      await fetchJSON(`${API_BASE}/tickets/${ticketId}/close`, {
        method: "POST",
        body: JSON.stringify({
          close_reason: closeReason || "",
        }),
      });
      setGlobalMessage("Ticket closed");
      handleCloseModal();
      await loadTickets();
      onStatus({ loading: false, success: true });
    } catch (err) {
      onStatus({ loading: false, error: err && err.error ? err.error : "Close failed" });
    }
  };

  // Display global message (confirmation/error) for a short time
  useEffect(() => {
    if (!globalMessage) return;
    const timer = setTimeout(() => setGlobalMessage(null), 3400);
    return () => clearTimeout(timer);
  }, [globalMessage]);

  return (
    <div className="app">
      {/* Sidebar Navigation */}
      <Sidebar onNewTicket={handleNewTicket} active="tickets" />

      {/* Topbar/brand */}
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
          loading={loadingTickets}
          error={ticketsError}
        />

        <TicketModal
          open={modalOpen}
          onClose={handleCloseModal}
          title={
            modalMode === "new"
              ? "Submit New Ticket"
              : selectedTicket
              ? "Ticket Details"
              : "Ticket"
          }
          ticket={selectedTicket}
          mode={modalMode}
          onSubmit={handleSubmitTicket}
          onUpdate={handleUpdateTicket}
          onAddResponse={handleAddResponse}
          onCloseTicket={handleCloseTicket}
        />

        {/* Global message (success/error) */}
        {globalMessage && (
          <div
            style={{
              position: "fixed",
              top: 70,
              right: 32,
              background: "var(--primary)",
              color: "#fff",
              padding: "15px 23px",
              borderRadius: 8,
              boxShadow: "var(--shadow)",
              zIndex: 10900,
              fontWeight: 500,
              fontSize: "1.11rem",
            }}
          >
            {globalMessage}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
