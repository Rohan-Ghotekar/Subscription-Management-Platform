import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import UserNavbar from "../../components/UserNavbar";
import UserSidebar from "../../components/UserSidebar";
import {
  updateProfileAPI,
  getProfileAPI,
  updateProfilePhotoAPI,
} from "../../services/authService";

const formatDate = (isoString) => {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (isoString) => {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

function Profile() {
  const { user, updateUser, updateAvatar } = useAuth();
  const fileInputRef = useRef(null);

  const [editing, setEditing]       = useState(false);
  const [name, setName]             = useState(user?.name || "");
  const [mobile, setMobile]         = useState("");
  const [avatarUrl, setAvatarUrl]   = useState(null);
  const [createdAt, setCreatedAt]   = useState(null);
  const [updatedAt, setUpdatedAt]   = useState(null);
  const [fetchError, setFetchError] = useState("");
  const [fetching, setFetching]     = useState(true);

  const [photoPreview, setPhotoPreview]     = useState(null);
  const [photoFile, setPhotoFile]           = useState(null);
  const [photoError, setPhotoError]         = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [toast, setToast]   = useState({ msg: "", type: "" });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // ✅ Fetch profile only once on mount to prevent infinite loop from unstable context functions
    const fetchProfile = async () => {
      setFetching(true);
      try {
        const data = await getProfileAPI();
        setName(data.fullName || user?.name || "");
        setMobile(data.mobile || "");
        setAvatarUrl(data.avatarUrl || null);
        if (data.avatarUrl && updateAvatar) updateAvatar(data.avatarUrl);
        setCreatedAt(data.createdAt || null);
        setUpdatedAt(data.updatedAt || null);
      } catch {
        setFetchError("Could not load profile data.");
      } finally {
        setFetching(false);
      }
    };
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 3500);
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    setPhotoError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) { setPhotoError("Please select a valid image file."); return; }
    if (file.size > 1 * 1024 * 1024) { setPhotoError("Image must be under 1 MB."); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
    setPhotoFile(file);
  };

  const handlePhotoUpload = async () => {
    if (!photoFile) return;
    setUploadingPhoto(true);
    setPhotoError("");
    try {
      const data = await updateProfilePhotoAPI(photoFile);
      setAvatarUrl(data.avatarUrl);
      setPhotoPreview(null);
      setPhotoFile(null);
      if (updateAvatar) updateAvatar(data.avatarUrl);
      showToast("Profile photo updated successfully!");
    } catch (err) {
      setPhotoError(err.response?.data?.message || "Failed to upload photo. Please try again.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleCancelPhoto = () => {
    setPhotoPreview(null);
    setPhotoFile(null);
    setPhotoError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async () => {
    setError("");
    if (!name.trim()) { setError("Name cannot be empty."); return; }
    if (!mobile.trim()) { setError("Mobile number cannot be empty."); return; }
    if (mobile.trim().length !== 10) { setError("Please enter a valid 10-digit mobile number."); return; }
    if (!/^[0-9+\s-]{7,15}$/.test(mobile.trim())) { setError("Please enter a valid mobile number."); return; }

    setLoading(true);
    try {
      const data = await updateProfileAPI(name.trim(), mobile.trim());
      setUpdatedAt(new Date().toISOString());
      const currentUser = JSON.parse(sessionStorage.getItem("smp_user") || "{}");
      const updatedUser = { ...currentUser, name: name.trim() };
      sessionStorage.setItem("smp_user", JSON.stringify(updatedUser));
      if (updateUser) updateUser(updatedUser);
      setEditing(false);
      showToast(data?.message || "Profile updated successfully!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setName(user?.name || "");
    setError("");
    setEditing(false);
  };

  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const displayAvatar = photoPreview || avatarUrl;

  return (
    <div>
      <UserNavbar />
      <div className="user-shell">
        <UserSidebar />
        <main className="user-content profile-page-content">

          {/* Toast */}
          {toast.msg && (
            <div style={{
              position: "fixed", top: "68px", right: "24px", zIndex: 300,
              background: toast.type === "success" ? "#f0fdf4" : "#fef2f2",
              border: `1px solid ${toast.type === "success" ? "#bbf7d0" : "#fecaca"}`,
              color: toast.type === "success" ? "#166534" : "#991b1b",
              borderRadius: "10px", padding: "10px 18px",
              fontSize: "13px", fontWeight: "500",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            }}>
              {toast.type === "success" ? "✓" : "✗"} {toast.msg}
            </div>
          )}

          {/* Page title row */}
          <div className="profile-page-head">
            <div>
              <h1 className="admin-page-title" style={{ marginBottom: "2px" }}>
                My Profile
              </h1>
              <p className="profile-page-subtitle">View and update your account details.</p>
            </div>
          </div>

          {fetching ? (
            <div className="profile-loading-card">
              Loading profile...
            </div>
          ) : (
            <>
              {fetchError && <div className="smp-error-msg" style={{ marginBottom: "12px" }}>{fetchError}</div>}

              {/* ── Single compact card ── */}
              <div className="profile-card profile-card-modern">

                {/* Thin colour band */}
                <div className="profile-header-band profile-header-band-modern" />

                {/* Avatar + name + edit button row */}
                <div className="profile-avatar-row profile-avatar-row-spread">
                  <div className="profile-avatar-meta">

                    {/* Avatar */}
                    <div className="profile-avatar-wrap">
                      {displayAvatar ? (
                        <img src={displayAvatar} alt="Profile" className="profile-avatar-image" />
                      ) : (
                        <div className="profile-avatar profile-avatar-modern">
                          {initials}
                        </div>
                      )}
                      {editing && (
                        <button type="button" onClick={() => fileInputRef.current?.click()} title="Upload photo"
                          className="profile-avatar-upload-btn">
                          📷
                        </button>
                      )}
                      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoSelect} />
                    </div>

                    {/* Name + role */}
                    <div className="profile-name-block">
                      <div className="profile-name profile-name-modern">{name}</div>
                      <span className="profile-role-badge">User</span>
                      <div className="profile-meta-chips">
                        <span className="profile-meta-chip">Joined {formatDate(createdAt)}</span>
                        <span className="profile-meta-chip">Updated {formatDate(updatedAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Edit / Save / Cancel */}
                  <div className="profile-top-actions">
                    {!editing ? (
                      <button className="btn-admin-secondary" style={{ padding: "7px 14px", fontSize: "13px" }} onClick={() => setEditing(true)}>
                        ✏️ Edit
                      </button>
                    ) : (
                      <>
                        <button className="btn-profile-save" onClick={handleSave} disabled={loading} style={{ padding: "7px 16px", fontSize: "13px", opacity: loading ? 0.7 : 1 }}>
                          {loading ? "Saving..." : "Save"}
                        </button>
                        <button className="btn-profile-cancel" onClick={handleCancel} disabled={loading} style={{ padding: "7px 14px", fontSize: "13px" }}>
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Photo upload bar */}
                {photoFile && (
                  <div className="profile-upload-strip">
                    <span style={{ fontSize: "13px" }}>📷</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "#166534" }}>{photoFile.name}</div>
                      <div style={{ fontSize: "11px", color: "#4d7c60" }}>{(photoFile.size / 1024).toFixed(1)} KB · Preview shown above</div>
                    </div>
                    <button className="btn-profile-save" onClick={handlePhotoUpload} disabled={uploadingPhoto} style={{ padding: "5px 12px", fontSize: "12px", opacity: uploadingPhoto ? 0.7 : 1 }}>
                      {uploadingPhoto ? "Uploading..." : "Upload"}
                    </button>
                    <button className="btn-profile-cancel" onClick={handleCancelPhoto} disabled={uploadingPhoto} style={{ padding: "5px 10px", fontSize: "12px" }}>
                      Cancel
                    </button>
                  </div>
                )}

                {/* Errors */}
                {photoError && <div className="profile-inline-alert"><div className="smp-error-msg">{photoError}</div></div>}
                {error      && <div className="profile-inline-alert"><div className="smp-error-msg">{error}</div></div>}

                {/* ── Fields + Account info in one grid ── */}
                <div className="profile-fields profile-fields-compact">

                  {/* Full name */}
                  <div className="profile-field">
                    <label>Full name</label>
                    <input type="text" value={name} onChange={(e) => { setName(e.target.value); setError(""); }} disabled={!editing} placeholder="Your full name"
                      style={{ padding: "8px 12px", border: "1.5px solid var(--border)", borderRadius: "8px", fontSize: "13px", color: "var(--text-dark)", background: editing ? "white" : "var(--bg)", outline: "none" }} />
                  </div>

                  {/* Email */}
                  <div className="profile-field">
                    <label>Email address</label>
                    <input type="email" value={user?.email || ""} disabled
                      style={{ padding: "8px 12px", border: "1.5px solid var(--border)", borderRadius: "8px", fontSize: "13px", color: "var(--text-mid)", background: "var(--bg)", outline: "none" }} />
                  </div>

                  {/* Mobile */}
                  <div className="profile-field">
                    <label>
                      Mobile number {editing && <span style={{ color: "var(--text-light)", fontWeight: 400, textTransform: "none" }}>({mobile.length}/10)</span>}
                    </label>
                    <input type="tel" value={mobile}
                      onChange={(e) => { const val = e.target.value.replace(/\D/g, ""); if (val.length <= 10) { setMobile(val); setError(""); } }}
                      disabled={!editing} placeholder="e.g. 9876543210"
                      style={{ padding: "8px 12px", border: "1.5px solid var(--border)", borderRadius: "8px", fontSize: "13px", color: "var(--text-dark)", background: editing ? "white" : "var(--bg)", outline: "none" }} />
                  </div>

                  {/* Role */}
                  <div className="profile-field">
                    <label>Account role</label>
                    <input value="User" disabled
                      style={{ padding: "8px 12px", border: "1.5px solid var(--border)", borderRadius: "8px", fontSize: "13px", color: "var(--text-mid)", background: "var(--bg)", outline: "none" }} />
                  </div>

                  {/* Member since */}
                  <div className="profile-field">
                    <label>Member since</label>
                    <div style={{ padding: "8px 12px", border: "1.5px solid var(--border)", borderRadius: "8px", fontSize: "13px", color: "var(--text-mid)", background: "var(--bg)" }}>
                      {formatDate(createdAt)}
                    </div>
                  </div>

                  {/* Last updated */}
                  <div className="profile-field">
                    <label>Last updated</label>
                    <div style={{ padding: "8px 12px", border: "1.5px solid var(--border)", borderRadius: "8px", fontSize: "13px", color: "var(--text-mid)", background: "var(--bg)" }}>
                      {formatDateTime(updatedAt)}
                    </div>
                  </div>

                  {/* Email verified */}
                  <div className="profile-field">
                    <label>Email verified</label>
                    <div style={{ padding: "8px 12px", border: "1.5px solid #bbf7d0", borderRadius: "8px", fontSize: "13px", color: "#166534", fontWeight: 600, background: "#f0fdf4" }}>
                      ✓ Verified
                    </div>
                  </div>

                  {/* Last login */}
                  <div className="profile-field">
                    <label>Last login</label>
                    <div style={{ padding: "8px 12px", border: "1.5px solid var(--border)", borderRadius: "8px", fontSize: "13px", color: "var(--text-mid)", background: "var(--bg)" }}>
                      Today
                    </div>
                  </div>

                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default Profile;