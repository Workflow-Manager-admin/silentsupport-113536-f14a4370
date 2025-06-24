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
/**
 * Controlled form for new ticket submission (used in TicketModal)
 */
function NewTicketForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({ title: "", message: "" });
  const [status, setStatus] = useState({});
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      setStatus({ error: "Title and message are required." });
      return;
    }
    if (form.title.length < 4 || form.title.length > 100) {
      setStatus({ error: "Title must be between 4 and 100 characters." });
      return;
    }
    if (form.message.length < 4 || form.message.length > 2000) {
      setStatus({ error: "Message must be between 4 and 2000 characters." });
      return;
    }
    setStatus({ loading: true });
    await onSubmit(form, setStatus);
  };
  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 18 }}>
        <label htmlFor="ticket-title" style={{ display: "block", marginBottom: 7, fontWeight: 500 }}>
          Title <span style={{ color: "var(--primary)" }}>*</span>
        </label>
        <input
          id="ticket-title"
          name="title"
          type="text"
          value={form.title}
          onChange={handleChange}
          disabled={status.loading}
          style={{
            width: "100%",
            padding: "9px 12px",
            fontSize: "1rem",
            border: "1px solid var(--border-color)",
            borderRadius: 5,
            background: "#fafbfc",
            color: "var(--text-primary)",
            marginBottom: 5,
          }}
          maxLength={100}
          required
        />
      </div>
      <div style={{ marginBottom: 24 }}>
        <label htmlFor="ticket-message" style={{ display: "block", marginBottom: 7, fontWeight: 500 }}>
          Description <span style={{ color: "var(--primary)" }}>*</span>
        </label>
        <textarea
          id="ticket-message"
          name="message"
          value={form.message}
          onChange={handleChange}
          disabled={status.loading}
          style={{
            width: "100%",
            minHeight: 75,
            padding: "9px 12px",
            fontSize: "1rem",
            border: "1px solid var(--border-color)",
            borderRadius: 5,
            background: "#fafbfc",
            color: "var(--text-primary)",
          }}
          maxLength={2000}
          required
        />
      </div>
      {status.error && (
        <div style={{ color: "#b51e1e", marginBottom: 14, fontWeight: 500 }}>{status.error}</div>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button
          type="button"
          onClick={onCancel}
          className="btn"
          style={{
            background: "var(--secondary)",
            color: "#fff",
            minWidth: 90,
          }}
          disabled={status.loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn"
          style={{
            background: "var(--primary)",
            color: "#fff",
            minWidth: 120,
            fontWeight: 700,
            opacity: status.loading ? 0.74 : 1,
          }}
          disabled={status.loading}
        >
          {status.loading ? "Submitting…" : "Submit Ticket"}
        </button>
      </div>
    </form>
  );
}

/**
 * Controlled form for editing existing ticket (used in TicketModal)
 */
function EditTicketForm({ ticket, onSubmit, onCancel }) {
  const [form, setForm] = useState({ 
    title: ticket?.title || "", 
    message: ticket?.message || "" 
  });
  const [status, setStatus] = useState({});
  
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      setStatus({ error: "Title and message are required." });
      return;
    }
    if (form.title.length < 4 || form.title.length > 100) {
      setStatus({ error: "Title must be between 4 and 100 characters." });
      return;
    }
    if (form.message.length < 4 || form.message.length > 2000) {
      setStatus({ error: "Message must be between 4 and 2000 characters." });
      return;
    }
    setStatus({ loading: true });
    await onSubmit(ticket.ticket_id, form, setStatus);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 18 }}>
        <label htmlFor="edit-ticket-title" style={{ display: "block", marginBottom: 7, fontWeight: 500 }}>
          Title <span style={{ color: "var(--primary)" }}>*</span>
        </label>
        <input
          id="edit-ticket-title"
          name="title"
          type="text"
          value={form.title}
          onChange={handleChange}
          disabled={status.loading}
          style={{
            width: "100%",
            padding: "9px 12px",
            fontSize: "1rem",
            border: "1px solid var(--border-color)",
            borderRadius: 5,
            background: "#fafbfc",
            color: "var(--text-primary)",
            marginBottom: 5,
          }}
          maxLength={100}
          required
        />
      </div>
      <div style={{ marginBottom: 24 }}>
        <label htmlFor="edit-ticket-message" style={{ display: "block", marginBottom: 7, fontWeight: 500 }}>
          Description <span style={{ color: "var(--primary)" }}>*</span>
        </label>
        <textarea
          id="edit-ticket-message"
          name="message"
          value={form.message}
          onChange={handleChange}
          disabled={status.loading}
          style={{
            width: "100%",
            minHeight: 75,
            padding: "9px 12px",
            fontSize: "1rem",
            border: "1px solid var(--border-color)",
            borderRadius: 5,
            background: "#fafbfc",
            color: "var(--text-primary)",
          }}
          maxLength={2000}
          required
        />
      </div>
      {status.error && (
        <div style={{ color: "#b51e1e", marginBottom: 14, fontWeight: 500 }}>{status.error}</div>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button
          type="button"
          onClick={onCancel}
          className="btn"
          style={{
            background: "var(--secondary)",
            color: "#fff",
            minWidth: 90,
          }}
          disabled={status.loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn"
          style={{
            background: "var(--primary)",
            color: "#fff",
            minWidth: 120,
            fontWeight: 700,
            opacity: status.loading ? 0.74 : 1,
          }}
          disabled={status.loading}
        >
          {status.loading ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

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
      // sort by newest, normalize structure for UI (maintain canonical backend fields)
      setTickets(
        data
          .map((ticket) => ({
            ...ticket,
            // Ensure any derived fields (if needed for UI) can be set here
            // Examples: status: ticket.closed ? "Closed" : "Open"
          }))
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      );
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
  const handleEditTicket = () => {
    setModalMode("edit");
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
              : modalMode === "edit"
                ? "Edit Ticket"
                : selectedTicket
                  ? "Ticket Details"
                  : "Ticket"
          }
        >
          {/* Render new ticket input fields when in "new" mode */}
          {modalMode === "new" && (
            <NewTicketForm onSubmit={handleSubmitTicket} onCancel={handleCloseModal} />
          )}
          {/* Render ticket details block when in "details" mode and have a selected ticket */}
          {modalMode === "details" && selectedTicket && (
            <div>
              <section className="ticket-details-section">
                <div className="ticket-details-title">{selectedTicket.title}</div>
                <div className="ticket-details-message">
                  {selectedTicket.message}
                </div>
                <div className="ticket-details-meta">
                  <span className={`ticket-details-badge${selectedTicket.closed ? " ticket-details-closed-badge" : ""}`}>
                    {selectedTicket.closed ? "Closed" : "Open"}
                  </span>
                  <span>
                    <b>Created:</b>{" "}
                    {selectedTicket.created_at
                      ? new Date(selectedTicket.created_at).toLocaleString()
                      : "-"}
                  </span>
                  {selectedTicket.closed && selectedTicket.closed_at && (
                    <>
                      <span>
                        <b>Closed:</b>{" "}
                        {new Date(selectedTicket.closed_at).toLocaleString()}
                      </span>
                      {selectedTicket.close_reason && (
                        <span className="ticket-details-close-reason">
                          <b>Reason:</b> {selectedTicket.close_reason}
                        </span>
                      )}
                    </>
                  )}
                </div>
                {/* Edit button - only show for open tickets */}
                {!selectedTicket.closed && (
                  <div className="ticket-details-actions">
                    <button
                      className="btn"
                      onClick={handleEditTicket}
                      style={{
                        background: "var(--accent)",
                        color: "#fff",
                        marginTop: 16,
                        fontSize: "0.95rem",
                        padding: "8px 16px",
                      }}
                    >
                      ✏️ Edit Ticket
                    </button>
                  </div>
                )}
              </section>
              {(selectedTicket.responses && selectedTicket.responses.length > 0) && (
                <section className="ticket-responses-section">
                  <div className="ticket-responses-title">Responses</div>
                  <div>
                    {selectedTicket.responses.map((resp, idx) => (
                      <div className="ticket-response-outer" key={idx}>
                        <div className="ticket-response-meta">
                          <b>{resp.responder || "Anonymous"}</b>
                          <span>
                            {resp.timestamp
                              ? new Date(resp.timestamp).toLocaleString()
                              : ""}
                          </span>
                        </div>
                        <div className="ticket-response-msg">
                          {resp.message}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
          {/* Render edit form when in "edit" mode and have a selected ticket */}
          {modalMode === "edit" && selectedTicket && (
            <EditTicketForm
              ticket={selectedTicket}
              onSubmit={handleUpdateTicket}
              onCancel={() => setModalMode("details")}
            />
          )}
        </TicketModal>

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
