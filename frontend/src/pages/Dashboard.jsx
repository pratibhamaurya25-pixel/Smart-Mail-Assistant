import { useEffect, useState } from "react";
import api from "../api/axios.js";

function getErrorMessage(error) {
  return error.response?.data?.message || "Could not connect to the server. Please try again.";
}

function MessageList({ messages, type, onDelete, deletingId }) {
  if (messages.length === 0) {
    return <p className="empty-state">No messages here yet.</p>;
  }

  return (
    <ul className="message-list">
      {messages.map((message) => (
        <li className="message-card" key={message._id}>
          <div className="message-heading">
            <div>
              <p className="message-person">
                {type === "inbox" ? `From ${message.senderName}` : `To ${message.receiverName}`}
              </p>
              <h3>{message.subject}</h3>
            </div>
            <button
              className="delete-button"
              type="button"
              onClick={() => onDelete(message._id)}
              disabled={deletingId === message._id}
              aria-label={`Delete message: ${message.subject}`}
            >
              {deletingId === message._id ? "Deleting..." : "Delete"}
            </button>
          </div>
          <p className="message-body">{message.message}</p>
          <time className="message-date" dateTime={message.createdAt}>
            {new Date(message.createdAt).toLocaleString()}
          </time>
        </li>
      ))}
    </ul>
  );
}

export default function Dashboard() {
  const [nameInput, setNameInput] = useState(
    () => localStorage.getItem("smart-mail-assistant-name") || ""
  );
  const [activeName, setActiveName] = useState(nameInput);
  const [receiverName, setReceiverName] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [inbox, setInbox] = useState([]);
  const [sentMessages, setSentMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!activeName) {
      setInbox([]);
      setSentMessages([]);
      setLoadingMessages(false);
      return undefined;
    }

    let ignoreResponse = false;
    setLoadingMessages(true);
    setError("");

    Promise.all([
      api.get("/emails/inbox", { params: { receiverName: activeName } }),
      api.get("/emails/sent", { params: { senderName: activeName } }),
    ])
      .then(([inboxResponse, sentResponse]) => {
        if (ignoreResponse) return;
        setInbox(inboxResponse.data.emails);
        setSentMessages(sentResponse.data.emails);
      })
      .catch((requestError) => {
        if (!ignoreResponse) setError(getErrorMessage(requestError));
      })
      .finally(() => {
        if (!ignoreResponse) setLoadingMessages(false);
      });

    return () => {
      ignoreResponse = true;
    };
  }, [activeName, refreshKey]);

  function saveName(event) {
    event.preventDefault();
    const savedName = nameInput.trim();

    if (!savedName) {
      setError("Enter your name to open your inbox.");
      return;
    }

    localStorage.setItem("smart-mail-assistant-name", savedName);
    setNameInput(savedName);
    setActiveName(savedName);
    setError("");
    setNotice("");
  }

  async function sendMessage(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setSubmitting(true);

    try {
      await api.post("/emails/send", {
        senderName: activeName,
        receiverName: receiverName.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });
      setReceiverName("");
      setSubject("");
      setMessage("");
      setNotice("Your message was sent.");
      setRefreshKey((currentKey) => currentKey + 1);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteMessage(id) {
    setError("");
    setNotice("");
    setDeletingId(id);

    try {
      await api.delete("/emails", { data: { id } });
      setNotice("Message deleted.");
      setRefreshKey((currentKey) => currentKey + 1);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setDeletingId("");
    }
  }

  return (
    <main className="dashboard">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">✉</span>
          <div>
            <p className="eyebrow">A SIMPLE WAY TO KEEP IN TOUCH</p>
            <h1>Smart Mail Assistant</h1>
          </div>
        </div>
        <form className="name-form" onSubmit={saveName}>
          <label htmlFor="your-name">Your Name</label>
          <div className="name-control">
            <input
              id="your-name"
              type="text"
              value={nameInput}
              onChange={(event) => setNameInput(event.target.value)}
              maxLength={80}
              placeholder="Enter your name"
              required
            />
            <button type="submit">Open Inbox</button>
          </div>
        </form>
      </header>

      <div className="dashboard-content">
        <section className="panel compose-panel" aria-labelledby="compose-title">
          <p className="section-label">NEW MESSAGE</p>
          <h2 id="compose-title">Compose a message</h2>
          <p className="panel-description">
            Write a note to someone by name. No email account needed.
          </p>
          <form className="compose-form" onSubmit={sendMessage}>
            <label htmlFor="receiver-name">Receiver Name</label>
            <input
              id="receiver-name"
              type="text"
              value={receiverName}
              onChange={(event) => setReceiverName(event.target.value)}
              maxLength={80}
              placeholder="Who is this for?"
              required
              disabled={!activeName || submitting}
            />

            <label htmlFor="subject">Subject</label>
            <input
              id="subject"
              type="text"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              maxLength={120}
              placeholder="Add a subject"
              required
              disabled={!activeName || submitting}
            />

            <label htmlFor="message">Message</label>
            <textarea
              id="message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={10000}
              rows={6}
              placeholder="Write your message..."
              required
              disabled={!activeName || submitting}
            />

            <button className="send-button" type="submit" disabled={!activeName || submitting}>
              {submitting ? "Sending..." : "Send Message"}
            </button>
            {!activeName && <p className="field-note">Enter your name above to start.</p>}
          </form>
        </section>

        <div className="message-sections">
          {error && <p className="feedback error" role="alert">{error}</p>}
          {notice && <p className="feedback success" role="status">{notice}</p>}

          <section className="panel messages-panel" aria-labelledby="inbox-title">
            <div className="section-heading">
              <div>
                <p className="section-label">YOUR MESSAGES</p>
                <h2 id="inbox-title">Inbox</h2>
              </div>
              <span className="message-count">{inbox.length}</span>
            </div>
            {loadingMessages ? (
              <p className="empty-state">Loading your inbox...</p>
            ) : (
              <MessageList
                messages={inbox}
                type="inbox"
                onDelete={deleteMessage}
                deletingId={deletingId}
              />
            )}
          </section>

          <section className="panel messages-panel" aria-labelledby="sent-title">
            <div className="section-heading">
              <div>
                <p className="section-label">MESSAGES YOU WROTE</p>
                <h2 id="sent-title">Sent Messages</h2>
              </div>
              <span className="message-count">{sentMessages.length}</span>
            </div>
            {loadingMessages ? (
              <p className="empty-state">Loading sent messages...</p>
            ) : (
              <MessageList
                messages={sentMessages}
                type="sent"
                onDelete={deleteMessage}
                deletingId={deletingId}
              />
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
