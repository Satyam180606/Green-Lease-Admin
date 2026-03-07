import React, { useEffect, useState } from "react";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { db, auth } from "../firebase";
import { useNavigate } from "react-router-dom";

const STATUS_COLORS = {
    pending: "#f59e0b",
    approved: "#22c55e",
    rejected: "#ef4444",
};

export default function Dashboard() {
    const [submissions, setSubmissions] = useState([]);
    const [selected, setSelected] = useState(null);
    const [updating, setUpdating] = useState(false);
    const [filterStatus, setFilterStatus] = useState("all");
    const navigate = useNavigate();

    useEffect(() => {
        const unsub = onSnapshot(collection(db, "land_submissions"), (snapshot) => {
            const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            setSubmissions(data);

            // Keep selected item in sync with real-time updates
            if (selected) {
                const updated = data.find((s) => s.id === selected.id);
                if (updated) setSelected(updated);
            }
        });
        return unsub;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function updateStatus(submissionId, newStatus) {
        setUpdating(true);
        try {
            await updateDoc(doc(db, "land_submissions", submissionId), {
                status: newStatus,
            });
        } catch (err) {
            alert("Failed to update status: " + err.message);
        } finally {
            setUpdating(false);
        }
    }

    async function handleLogout() {
        await signOut(auth);
        navigate("/");
    }

    const filtered =
        filterStatus === "all"
            ? submissions
            : submissions.filter((s) => s.status === filterStatus);

    const counts = {
        all: submissions.length,
        pending: submissions.filter((s) => s.status === "pending").length,
        approved: submissions.filter((s) => s.status === "approved").length,
        rejected: submissions.filter((s) => s.status === "rejected").length,
    };

    function formatDate(createdAt) {
        if (!createdAt) return "—";
        const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
        return date.toLocaleString();
    }

    return (
        <div className="dashboard">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <span className="logo-icon">🌿</span>
                    <span>Green Lease</span>
                </div>

                <nav className="sidebar-nav">
                    <button
                        className={`nav-item ${filterStatus === "all" ? "active" : ""}`}
                        onClick={() => setFilterStatus("all")}
                    >
                        📋 All Submissions
                        <span className="badge">{counts.all}</span>
                    </button>
                    <button
                        className={`nav-item ${filterStatus === "pending" ? "active" : ""}`}
                        onClick={() => setFilterStatus("pending")}
                    >
                        ⏳ Pending
                        <span className="badge badge-pending">{counts.pending}</span>
                    </button>
                    <button
                        className={`nav-item ${filterStatus === "approved" ? "active" : ""}`}
                        onClick={() => setFilterStatus("approved")}
                    >
                        ✅ Approved
                        <span className="badge badge-approved">{counts.approved}</span>
                    </button>
                    <button
                        className={`nav-item ${filterStatus === "rejected" ? "active" : ""}`}
                        onClick={() => setFilterStatus("rejected")}
                    >
                        ❌ Rejected
                        <span className="badge badge-rejected">{counts.rejected}</span>
                    </button>
                </nav>

                <button className="logout-btn" onClick={handleLogout}>
                    🚪 Logout
                </button>
            </aside>

            {/* Main content */}
            <main className="main-content">
                <header className="dashboard-header">
                    <div>
                        <h2>Land Submissions</h2>
                        <p className="subtitle">
                            {filtered.length} submission{filtered.length !== 1 ? "s" : ""}{" "}
                            {filterStatus !== "all" ? `• ${filterStatus}` : ""}
                        </p>
                    </div>
                    <div className="header-meta">
                        <span className="live-dot" title="Real-time updates active" />
                        Live
                    </div>
                </header>

                <div className="content-area">
                    {/* Table */}
                    <div className={`table-panel ${selected ? "shrunk" : ""}`}>
                        {filtered.length === 0 ? (
                            <div className="empty-state">No submissions found.</div>
                        ) : (
                            <table className="submissions-table">
                                <thead>
                                    <tr>
                                        <th>Submission ID</th>
                                        <th>Citizen Name</th>
                                        <th>Address</th>
                                        <th>Land Area</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((s) => (
                                        <tr
                                            key={s.id}
                                            onClick={() =>
                                                setSelected(selected?.id === s.id ? null : s)
                                            }
                                            className={selected?.id === s.id ? "selected-row" : ""}
                                        >
                                            <td className="mono">{s.submissionId || s.id}</td>
                                            <td>{s.citizenName || "—"}</td>
                                            <td>{s.address || "—"}</td>
                                            <td>{s.landArea ? `${s.landArea} sq.m` : "—"}</td>
                                            <td>
                                                <span
                                                    className="status-badge"
                                                    style={{
                                                        backgroundColor:
                                                            STATUS_COLORS[s.status] || "#94a3b8",
                                                    }}
                                                >
                                                    {s.status || "unknown"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Detail panel */}
                    {selected && (
                        <div className="detail-panel">
                            <div className="detail-header">
                                <h3>Submission Details</h3>
                                <button className="close-btn" onClick={() => setSelected(null)}>
                                    ✕
                                </button>
                            </div>

                            <div className="detail-body">
                                {/* Status actions */}
                                <div className="action-bar">
                                    <span
                                        className="status-badge large"
                                        style={{
                                            backgroundColor:
                                                STATUS_COLORS[selected.status] || "#94a3b8",
                                        }}
                                    >
                                        {selected.status || "unknown"}
                                    </span>
                                    <button
                                        className="btn btn-approve"
                                        disabled={updating || selected.status === "approved"}
                                        onClick={() => updateStatus(selected.id, "approved")}
                                    >
                                        ✅ Approve
                                    </button>
                                    <button
                                        className="btn btn-reject"
                                        disabled={updating || selected.status === "rejected"}
                                        onClick={() => updateStatus(selected.id, "rejected")}
                                    >
                                        ❌ Reject
                                    </button>
                                </div>

                                {/* Citizen info */}
                                <section className="detail-section">
                                    <h4>👤 Citizen Information</h4>
                                    <div className="detail-grid">
                                        <div className="detail-row">
                                            <span className="label">Name</span>
                                            <span>{selected.citizenName || "—"}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="label">Phone</span>
                                            <span>{selected.phoneNumber || "—"}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="label">Submission ID</span>
                                            <span className="mono">
                                                {selected.submissionId || selected.id}
                                            </span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="label">Submitted</span>
                                            <span>{formatDate(selected.createdAt)}</span>
                                        </div>
                                    </div>
                                </section>

                                {/* Land info */}
                                <section className="detail-section">
                                    <h4>🏠 Land Information</h4>
                                    <div className="detail-grid">
                                        <div className="detail-row">
                                            <span className="label">Address</span>
                                            <span>{selected.address || "—"}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="label">Land Area</span>
                                            <span>
                                                {selected.landArea ? `${selected.landArea} sq.m` : "—"}
                                            </span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="label">Latitude</span>
                                            <span className="mono">{selected.latitude ?? "—"}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="label">Longitude</span>
                                            <span className="mono">{selected.longitude ?? "—"}</span>
                                        </div>
                                    </div>
                                    {selected.latitude && selected.longitude && (
                                        <a
                                            className="map-link"
                                            href={`https://maps.google.com/?q=${selected.latitude},${selected.longitude}`}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            📍 View on Google Maps
                                        </a>
                                    )}
                                </section>

                                {/* Description */}
                                {selected.description && (
                                    <section className="detail-section">
                                        <h4>📝 Description</h4>
                                        <p className="description-text">{selected.description}</p>
                                    </section>
                                )}

                                {/* Images */}
                                {selected.imageUrls && selected.imageUrls.length > 0 && (
                                    <section className="detail-section">
                                        <h4>🖼️ Uploaded Images ({selected.imageUrls.length})</h4>
                                        <div className="image-gallery">
                                            {selected.imageUrls.map((url, i) => (
                                                <a key={i} href={url} target="_blank" rel="noreferrer">
                                                    <img
                                                        src={url}
                                                        alt={`Submission image ${i + 1}`}
                                                        className="gallery-img"
                                                        onError={(e) => {
                                                            e.target.style.display = "none";
                                                        }}
                                                    />
                                                </a>
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
