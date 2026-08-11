import { useState, useEffect } from "react";
import AdminNavbar from "../../components/AdminNavbar";
import AdminSidebar from "../../components/AdminSidebar";
import {
  getAllProvidersAPI,
  changeProviderStateAPI,
} from "../../services/adminService";

const formatDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const SERVICE_TYPE_COLORS = {
  SaaS: { bg: "#eef2ff", color: "#3730a3" },
  Streaming: { bg: "#fdf4ff", color: "#7e22ce" },
  "Cloud Storage": { bg: "#eff6ff", color: "#1d4ed8" },
  Education: { bg: "#f0fdf4", color: "#166534" },
  Healthcare: { bg: "#ecfdf5", color: "#065f46" },
  Finance: { bg: "#fffbeb", color: "#92400e" },
  "E-commerce": { bg: "#fff7ed", color: "#9a3412" },
  Communication: { bg: "#f0f9ff", color: "#0369a1" },
  Gaming: { bg: "#fef2f2", color: "#991b1b" },
  Other: { bg: "#f8fafc", color: "#475569" },
};

function ManageProviders() {
  const PROVIDERS_PER_PAGE = 3;
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all"); // 'all' | 'permitted' | 'pending'
  const [search, setSearch] = useState("");
  const [permitting, setPermitting] = useState(null); // providerId currently being permitted
  const [toast, setToast] = useState({ msg: "", type: "" });
  const [selectedProvider, setSelectedProvider] = useState(null); // for detail modal
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAllProvidersAPI();
      setProviders(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load providers.");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 3500);
  };

  const handlePermit = async (provider) => {
    setPermitting(provider.userId);
    const isCurrentlyPermitted = provider.isPermitted;
    try {
      await changeProviderStateAPI(provider.userId); // same API — backend toggles state
      const newStatus = !isCurrentlyPermitted;
      setProviders((prev) =>
        prev.map((p) =>
          p.userId === provider.userId ? { ...p, isPermitted: newStatus } : p,
        ),
      );
      if (selectedProvider?.userId === provider.userId) {
        setSelectedProvider((prev) => ({ ...prev, isPermitted: newStatus }));
      }
      showToast(
        newStatus
          ? `${provider.fullName} has been permitted successfully!`
          : `${provider.businessName || provider.fullName} access has been revoked.`,
        newStatus ? "success" : "error",
      );
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to update provider status.",
        "error",
      );
    } finally {
      setPermitting(null);
    }
  };

  // ── Filtering + Search ────────────────────────────────────────
  const filtered = providers.filter((p) => {
    const matchesFilter =
      filter === "all"
        ? true
        : filter === "permitted"
          ? p.isPermitted
          : filter === "pending"
            ? !p.isPermitted
            : true;

    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      [p.fullName, p.email, p.businessName, p.serviceType, p.description].some(
        (f) => f?.toLowerCase().includes(q),
      );

    return matchesFilter && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PROVIDERS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PROVIDERS_PER_PAGE;
  const paginatedProviders = filtered.slice(
    startIndex,
    startIndex + PROVIDERS_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const totalCount = providers.length;
  const permittedCount = providers.filter((p) => p.isPermitted).length;
  const pendingCount = providers.filter((p) => !p.isPermitted).length;

  const initials = (name = "") =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  const getPageNumbers = () => {
    const pages = [];
    for (let p = 1; p <= totalPages; p += 1) {
      const isEdge = p === 1 || p === totalPages;
      const isNear = Math.abs(p - safePage) <= 1;
      if (isEdge || isNear) {
        pages.push(p);
      } else if (pages[pages.length - 1] !== "...") {
        pages.push("...");
      }
    }
    return pages;
  };

  return (
    <div>
      <AdminNavbar />
      <div className="admin-shell manage-providers-shell">
        <AdminSidebar />
        <main className="admin-content manage-providers-page">
          {/* Toast */}
          {toast.msg && (
            <div
              style={{
                position: "fixed",
                top: "76px",
                right: "28px",
                zIndex: 300,
                background:
                  toast.type === "success"
                    ? "var(--success-bg)"
                    : "var(--error-bg)",
                border: `1px solid ${toast.type === "success" ? "var(--success-border)" : "var(--error-border)"}`,
                color: toast.type === "success" ? "#065f46" : "#991b1b",
                borderRadius: "10px",
                padding: "12px 20px",
                fontSize: "14px",
                fontWeight: "500",
                boxShadow: "var(--shadow-md)",
              }}
            >
              {toast.type === "success" ? "✓" : "✗"} {toast.msg}
            </div>
          )}

          {/* Page header */}
          <div className="admin-page-header">
            <h1 className="admin-page-title">Manage Providers</h1>
            <p className="admin-page-subtitle">
              View all registered service providers and grant platform access.
            </p>
          </div>

          {/* KPI summary row */}
          {!loading && !error && (
            <div className="kpi-grid" style={{ marginBottom: "24px" }}>
              {[
                {
                  icon: "🏢",
                  label: "Total providers",
                  value: totalCount,
                  color: "var(--brand)",
                  sub: "All registered",
                },
                {
                  icon: "✅",
                  label: "Permitted",
                  value: permittedCount,
                  color: "var(--success)",
                  sub: "Active access",
                },
                {
                  icon: "⏳",
                  label: "Pending approval",
                  value: pendingCount,
                  color: "var(--warning)",
                  sub: "Awaiting permit",
                },
              ].map((k) => (
                <div className="kpi-card" key={k.label}>
                  <div className="kpi-card-icon">{k.icon}</div>
                  <div className="kpi-card-label">{k.label}</div>
                  <div className="kpi-card-value" style={{ color: k.color }}>
                    {k.value}
                  </div>
                  <div className="kpi-card-sub">{k.sub}</div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="smp-error-msg" style={{ marginBottom: "16px" }}>
              {error}
            </div>
          )}

          {/* Search + filter bar */}
          <div
            className="manage-providers-toolbar"
            style={{
              background: "var(--bg-card)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border)",
              padding: "16px 20px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            {/* Search */}
            <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
              <span
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "14px",
                  color: "var(--text-light)",
                }}
              >
                🔍
              </span>
              <input
                type="text"
                placeholder="Search by name, email, business or service type..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 14px 9px 36px",
                  border: "1.5px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "13px",
                  color: "var(--text-dark)",
                  background: "var(--bg)",
                  outline: "none",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--brand)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>

            {/* Filter tabs */}
            <div
              style={{
                display: "flex",
                gap: "4px",
                background: "var(--bg-subtle)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                padding: "4px",
              }}
            >
              {[
                { key: "all", label: `All (${totalCount})` },
                { key: "permitted", label: `Permitted (${permittedCount})` },
                { key: "pending", label: `Pending (${pendingCount})` },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  style={{
                    padding: "7px 16px",
                    borderRadius: "var(--radius-md)",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "var(--font-body)",
                    fontSize: "13px",
                    fontWeight: filter === tab.key ? "600" : "400",
                    background:
                      filter === tab.key ? "var(--bg-card)" : "transparent",
                    color:
                      filter === tab.key ? "var(--brand)" : "var(--text-muted)",
                    boxShadow: filter === tab.key ? "var(--shadow-sm)" : "none",
                    transition: "all 0.15s ease",
                    whiteSpace: "nowrap",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Providers table */}
          <div className="data-table-card">
            <div className="data-table-header">
              <h3>Service providers</h3>
              <span style={{ fontSize: "13px", color: "var(--text-light)" }}>
                {loading
                  ? "Loading..."
                  : `${filtered.length} total • Page ${safePage}/${totalPages}`}
              </span>
            </div>

            {loading ? (
              <div
                style={{
                  padding: "60px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: "14px",
                }}
              >
                Loading providers...
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: "60px", textAlign: "center" }}>
                <div style={{ fontSize: "36px", marginBottom: "12px" }}>🏢</div>
                <div
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "var(--text-dark)",
                    marginBottom: "6px",
                  }}
                >
                  {search || filter !== "all"
                    ? "No providers match your filter"
                    : "No providers registered yet"}
                </div>
                <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  {search || filter !== "all"
                    ? "Try clearing your search or filter."
                    : "Providers will appear here once they register."}
                </div>
              </div>
            ) : (
              <div className="manage-providers-table-wrap">
                <table className="manage-providers-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Provider</th>
                    <th>Business</th>
                    <th>Service type</th>
                    <th>Contact</th>
                    <th>Registered</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProviders.map((p, i) => {
                    const stColor =
                      SERVICE_TYPE_COLORS[p.serviceType] ||
                      SERVICE_TYPE_COLORS.Other;
                    const isBeingPermitted = permitting === p.userId;
                    return (
                      <tr key={p.userId}>
                        <td
                          style={{
                            color: "var(--text-light)",
                            fontWeight: "600",
                            fontSize: "13px",
                          }}
                        >
                          {startIndex + i + 1}
                        </td>

                        {/* Provider */}
                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                            }}
                          >
                            {p.avatarUrl ? (
                              <img
                                src={p.avatarUrl}
                                alt={p.fullName}
                                style={{
                                  width: "34px",
                                  height: "34px",
                                  borderRadius: "50%",
                                  objectFit: "cover",
                                  flexShrink: 0,
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: "34px",
                                  height: "34px",
                                  borderRadius: "50%",
                                  background: "var(--brand-light)",
                                  border: "1px solid var(--brand-muted)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontFamily: "var(--font-heading)",
                                  fontSize: "12px",
                                  fontWeight: "700",
                                  color: "var(--brand)",
                                  flexShrink: 0,
                                }}
                              >
                                {initials(p.fullName)}
                              </div>
                            )}
                            <div>
                              <div
                                style={{
                                  fontWeight: "500",
                                  color: "var(--text-dark)",
                                  fontSize: "13px",
                                }}
                              >
                                {p.fullName}
                              </div>
                              <div
                                style={{
                                  fontSize: "12px",
                                  color: "var(--text-muted)",
                                }}
                              >
                                {p.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Business */}
                        <td>
                          <div
                            style={{
                              fontWeight: "500",
                              color: "var(--text-dark)",
                              fontSize: "13px",
                            }}
                          >
                            {p.businessName || "—"}
                          </div>
                          {p.description && (
                            <div
                              style={{
                                fontSize: "11px",
                                color: "var(--text-muted)",
                                maxWidth: "160px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                              title={p.description}
                            >
                              {p.description}
                            </div>
                          )}
                        </td>

                        {/* Service type */}
                        <td>
                          <span
                            style={{
                              display: "inline-block",
                              background: stColor.bg,
                              color: stColor.color,
                              fontSize: "11px",
                              fontWeight: "700",
                              padding: "3px 10px",
                              borderRadius: "20px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {p.serviceType || "—"}
                          </span>
                        </td>

                        {/* Contact */}
                        <td
                          style={{
                            fontSize: "12px",
                            color: "var(--text-muted)",
                          }}
                        >
                          {p.mobile || "—"}
                        </td>

                        {/* Registered */}
                        <td
                          style={{
                            fontSize: "12px",
                            color: "var(--text-muted)",
                          }}
                        >
                          {formatDate(p.createdAt)}
                        </td>

                        {/* Status */}
                        <td>
                          <span
                            style={{
                              display: "inline-block",
                              background: p.isPermitted
                                ? "var(--success-bg)"
                                : "var(--warning-bg)",
                              color: p.isPermitted ? "#065f46" : "#92400e",
                              border: `1px solid ${p.isPermitted ? "var(--success-border)" : "var(--warning-border)"}`,
                              fontSize: "11px",
                              fontWeight: "700",
                              padding: "3px 10px",
                              borderRadius: "20px",
                            }}
                          >
                            {p.isPermitted ? "✓ Permitted" : "⏳ Pending"}
                          </span>
                        </td>

                        {/* Action */}
                        <td>
                          <div style={{ display: "flex", gap: "8px" }}>
                            {/* View details button */}
                            <button
                              className="btn-admin-secondary"
                              style={{ padding: "6px 12px", fontSize: "12px" }}
                              onClick={() => setSelectedProvider(p)}
                            >
                              View
                            </button>

                            {/* ✅ Fixed — always shows a toggle button */}
                            <button
                              className={
                                p.isPermitted
                                  ? "btn-admin-danger"
                                  : "btn-admin-primary"
                              }
                              style={{
                                padding: "6px 14px",
                                fontSize: "12px",
                                opacity: isBeingPermitted ? 0.7 : 1,
                              }}
                              disabled={isBeingPermitted}
                              onClick={() => handlePermit(p)}
                            >
                              {isBeingPermitted
                                ? "Updating..."
                                : p.isPermitted
                                  ? "Revoke"
                                  : "Permit"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                </table>
              </div>
            )}

            {!loading && filtered.length > PROVIDERS_PER_PAGE && (
              <div
                className="manage-providers-pagination"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "10px",
                  padding: "10px 16px",
                  borderTop: "1px solid var(--border)",
                  background: "var(--bg-subtle)",
                }}
              >
                <span className="manage-providers-pagination-info">
                  Showing {startIndex + 1}-{Math.min(safePage * PROVIDERS_PER_PAGE, filtered.length)} of {filtered.length}
                </span>

                <div
                  style={{
                    display: "flex",
                    gap: "4px",
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    style={{
                      padding: "5px 10px",
                      borderRadius: "7px",
                      border: "1.5px solid var(--border)",
                      background: safePage === 1 ? "var(--bg-subtle)" : "var(--bg-card)",
                      color: safePage === 1 ? "var(--text-light)" : "var(--text-mid)",
                      cursor: safePage === 1 ? "not-allowed" : "pointer",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}
                  >
                    ← Prev
                  </button>

                  {getPageNumbers().map((page, idx) =>
                    page === "..." ? (
                      <span
                        key={`e-${idx}`}
                        style={{
                          padding: "4px",
                          fontSize: "12px",
                          color: "var(--text-light)",
                        }}
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "7px",
                          border:
                            safePage === page
                              ? "none"
                              : "1.5px solid var(--border)",
                          background:
                            safePage === page ? "var(--brand)" : "var(--bg-card)",
                          color: safePage === page ? "white" : "var(--text-mid)",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: "600",
                          boxShadow: safePage === page ? "var(--shadow-sm)" : "none",
                        }}
                      >
                        {page}
                      </button>
                    ),
                  )}

                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={safePage === totalPages}
                    style={{
                      padding: "5px 10px",
                      borderRadius: "7px",
                      border: "1.5px solid var(--border)",
                      background:
                        safePage === totalPages ? "var(--bg-subtle)" : "var(--bg-card)",
                      color:
                        safePage === totalPages ? "var(--text-light)" : "var(--text-mid)",
                      cursor: safePage === totalPages ? "not-allowed" : "pointer",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}
                  >
                    Next →
                  </button>
                </div>

                <span style={{ fontSize: "11px", color: "var(--text-light)" }}>
                  {PROVIDERS_PER_PAGE} per page
                </span>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── Provider Detail Modal ── */}
      {selectedProvider && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedProvider(null)}
        >
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "520px" }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "20px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "14px" }}
              >
                {selectedProvider.avatarUrl ? (
                  <img
                    src={selectedProvider.avatarUrl}
                    alt=""
                    style={{
                      width: "52px",
                      height: "52px",
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "52px",
                      height: "52px",
                      borderRadius: "50%",
                      background: "var(--brand-light)",
                      border: "2px solid var(--brand-muted)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--font-heading)",
                      fontSize: "18px",
                      fontWeight: "700",
                      color: "var(--brand)",
                    }}
                  >
                    {initials(selectedProvider.fullName)}
                  </div>
                )}
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: "17px",
                      fontWeight: "700",
                      color: "var(--text-dark)",
                    }}
                  >
                    {selectedProvider.fullName}
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                    {selectedProvider.email}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedProvider(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                  color: "var(--text-light)",
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>

            {/* Business banner */}
            <div
              style={{
                background: "var(--bg-subtle)",
                borderRadius: "10px",
                padding: "14px 16px",
                marginBottom: "16px",
                border: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  color: "var(--text-light)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: "4px",
                }}
              >
                Business
              </div>
              <div
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "var(--text-dark)",
                  marginBottom: "6px",
                }}
              >
                {selectedProvider.businessName || "—"}
              </div>
              {(() => {
                const stColor =
                  SERVICE_TYPE_COLORS[selectedProvider.serviceType] ||
                  SERVICE_TYPE_COLORS.Other;
                return (
                  <span
                    style={{
                      display: "inline-block",
                      background: stColor.bg,
                      color: stColor.color,
                      fontSize: "11px",
                      fontWeight: "700",
                      padding: "2px 10px",
                      borderRadius: "20px",
                    }}
                  >
                    {selectedProvider.serviceType || "—"}
                  </span>
                );
              })()}
            </div>

            {/* Description */}
            {selectedProvider.description && (
              <div
                style={{
                  background: "var(--bg-subtle)",
                  borderRadius: "10px",
                  padding: "12px 16px",
                  marginBottom: "16px",
                  border: "1px solid var(--border)",
                  fontSize: "13px",
                  color: "var(--text-mid)",
                  lineHeight: "1.6",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    color: "var(--text-light)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: "6px",
                  }}
                >
                  Description
                </div>
                {selectedProvider.description}
              </div>
            )}

            {/* Info grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                marginBottom: "20px",
              }}
            >
              {[
                { label: "Mobile", value: selectedProvider.mobile || "—" },
                { label: "User ID", value: `#${selectedProvider.userId}` },
                {
                  label: "Registered",
                  value: formatDate(selectedProvider.createdAt),
                },
                {
                  label: "Status",
                  value: selectedProvider.isPermitted
                    ? "✓ Permitted"
                    : "⏳ Pending",
                  valueStyle: {
                    color: selectedProvider.isPermitted
                      ? "var(--success)"
                      : "var(--warning)",
                  },
                },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    background: "var(--bg-subtle)",
                    borderRadius: "8px",
                    padding: "12px 14px",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      color: "var(--text-light)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: "4px",
                    }}
                  >
                    {item.label}
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "var(--text-dark)",
                      ...item.valueStyle,
                    }}
                  >
                    {item.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
                paddingTop: "16px",
                borderTop: "1px solid var(--border)",
              }}
            >
              <button
                className="btn-modal-cancel"
                onClick={() => setSelectedProvider(null)}
              >
                Close
              </button>
              {!selectedProvider.isPermitted && (
                <button
                  className="btn-admin-primary"
                  disabled={permitting === selectedProvider.userId}
                  style={{
                    opacity: permitting === selectedProvider.userId ? 0.7 : 1,
                  }}
                  onClick={() => handlePermit(selectedProvider)}
                >
                  {permitting === selectedProvider.userId
                    ? "Permitting..."
                    : "✓ Permit this provider"}
                </button>
              )}
              {selectedProvider.isPermitted && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "var(--success)",
                    fontSize: "13px",
                    fontWeight: "600",
                  }}
                >
                  ✓ Provider has platform access
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageProviders;
