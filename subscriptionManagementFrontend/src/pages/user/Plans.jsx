import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import UserNavbar from "../../components/UserNavbar";
import UserSidebar from "../../components/UserSidebar";
import { getPlansForUserByServiceTypeAPI } from "../../services/planService";
import {
  switchPlanAPI,
  calculateUpgradeAPI,
  getMyActivePlansAPI,
} from "../../services/subscriptionService";
import { initiatePaymentAPI } from "../../services/paymentService";

const SERVICE_TYPES = [
  "SaaS",
  "Streaming",
  "Cloud Storage",
  "Education",
  "Healthcare",
  "Finance",
  "E-commerce",
  "Communication",
  "Gaming",
];

const SERVICE_ICONS = {
  SaaS: "💻",
  Streaming: "🎬",
  "Cloud Storage": "☁️",
  Education: "📚",
  Healthcare: "🏥",
  Finance: "💰",
  "E-commerce": "🛒",
  Communication: "💬",
  Gaming: "🎮",
};

function Plans() {
  const { user } = useAuth();
  const location = useLocation();
  const providerSectionRefs = useRef({});
  const didAutoScrollRef = useRef(false);

  const [plans, setPlans] = useState([]);
  // activeSubs is always an array — one entry per provider the user subscribes to
  const [activeSubs, setActiveSubs] = useState([]);
  const [confirmPlan, setConfirmPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [toast, setToast] = useState({ msg: "", type: "" });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState("");
  const [targetProviderId, setTargetProviderId] = useState("");
  const [downgradePlan, setDowngradePlan] = useState(null);

  // ── Helpers ───────────────────────────────────────────────────
  const displayBilling = (interval = "") =>
    interval ? interval.charAt(0) + interval.slice(1).toLowerCase() : "";

  const getFeatures = (plan) =>
    Array.isArray(plan.features)
      ? plan.features
      : (plan.features || "")
          .split(",")
          .map((f) => f.trim())
          .filter(Boolean);

  const tierStyle = {
    BASIC: { text: "#3730a3", bg: "#e0e7ff" },
    PRO: { text: "#9d174d", bg: "#fce7f3" },
    ENTERPRISE: { text: "#92400e", bg: "#fef3c7" },
  };
  const TIER_ORDER = { BASIC: 1, PRO: 2, ENTERPRISE: 3 };

  const normalizeToken = (value) =>
    String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");

  const normalizeSubscription = (sub) => ({
    ...sub,
    subId: sub?.subId ?? sub?.id ?? sub?.subscriptionId ?? sub?.subscription_id,
    planId: sub?.planId ?? sub?.plan_id ?? sub?.planID,
    planName: sub?.planName ?? sub?.plan_name ?? sub?.name,
    providerId: sub?.providerId ?? sub?.provider_id,
    providerName: sub?.providerName ?? sub?.provider_name,
    tier: String(sub?.tier ?? sub?.planTier ?? "")
      .trim()
      .toUpperCase(),
    price: sub?.price ?? sub?.planPrice ?? sub?.Price ?? sub?.amount,
    billing: sub?.billing ?? sub?.billingInterval ?? sub?.billing_interval,
    status: String(sub?.status ?? sub?.state ?? "")
      .trim()
      .toUpperCase(),
  });

  const getPlanRank = (tier) =>
    TIER_ORDER[
      String(tier ?? "")
        .trim()
        .toUpperCase()
    ] ?? 99;

  const getNumericAmount = (value) => {
    const cleaned = String(value ?? "")
      .replace(/[^0-9.]/g, "")
      .trim();
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  };

  const getRemainingDays = (subscription) => {
    const value = Number(subscription?.daysRemaining ?? subscription?.daysLeft ?? 0);
    return Number.isFinite(value) ? value : 0;
  };

  const canSwitchPlan = (subscription) => getRemainingDays(subscription) > 2;

  const getSwitchBlockedMessage = (subscription) =>
    !subscription || canSwitchPlan(subscription)
      ? ""
      : "You cannot switch plan right now because 2 or less days are remaining for your current subscribed plan to end.";

  const shouldTreatAsDowngrade = (currentSub, targetPlan) => {
    if (!currentSub) return false;

    const targetPrice = getNumericAmount(targetPlan?.price);

    const currentSubPrice = getNumericAmount(
      currentSub.price ?? currentSub.planPrice ?? currentSub.amount,
    );

    // If subscription payload misses price, resolve from currently loaded provider plans.
    const currentPlanFromList = plans.find((p) => {
      const sameById = normalizeToken(p?.id) === normalizeToken(currentSub?.planId);
      const sameByName = normalizeToken(p?.name) === normalizeToken(currentSub?.planName);
      return sameById || sameByName;
    });

    const currentPlanPrice = getNumericAmount(currentPlanFromList?.price);
    const currentPrice = currentSubPrice > 0 ? currentSubPrice : currentPlanPrice;

    // Logic: If the new plan is cheaper, it's a downgrade/direct switch
    if (targetPrice < currentPrice) return true;

    // Fallback: tier-based downgrade check when prices are equal/missing.
    const currentTier = currentSub.tier || currentPlanFromList?.tier;
    const currentRank = getPlanRank(currentTier);
    const targetRank = getPlanRank(targetPlan?.tier);
    if (currentRank !== 99 && targetRank !== 99 && targetRank < currentRank) {
      return true;
    }

    return false;
  };

  const matchesPlanIdentity = (sub, plan) => {
    const subPlanId = normalizeToken(sub?.planId);
    const planId = normalizeToken(plan?.id);
    const subPlanName = normalizeToken(sub?.planName);
    const planName = normalizeToken(plan?.name);

    if (!subPlanId && !subPlanName) return false;
    if (!planId && !planName) return false;

    return (
      subPlanId === planId ||
      subPlanId.includes(planId) ||
      planId.includes(subPlanId) ||
      subPlanName === planName ||
      subPlanName.includes(planName) ||
      planName.includes(subPlanName)
    );
  };

  // ── Given a plan, find the user's active sub for that provider ─
  // One sub per provider — match by providerId if available, fallback planId
  const getActiveSubForProvider = (plan) => {
    if (!activeSubs.length) return null;
    return (
      activeSubs.find((s) =>
        plan.providerId
          ? String(s.providerId) === String(plan.providerId) ||
            matchesPlanIdentity(s, plan)
          : matchesPlanIdentity(s, plan),
      ) || null
    );
  };

  // ── Is this exact plan the user's current plan for its provider? ─
  const isPlanCurrentForProvider = (plan) => {
    const sub = getActiveSubForProvider(plan);
    if (!sub) return false;
    return matchesPlanIdentity(sub, plan);
  };

  // ── Fetch all active subscriptions on mount ───────────────────
  const fetchActiveSubs = async () => {
    try {
      const data = await getMyActivePlansAPI();
      
      // Backend returns either a single object or an array
      const normalized = (Array.isArray(data) ? data : data ? [data] : [])
        .map(normalizeSubscription)
        .filter(
          (s) =>
            ["ACTIVE", "ACTIVATED", "ACTIVE_SUBSCRIPTION"].includes(s.status) ||
            s.active === true ||
            s.enabled === true ||
            s.isActive === true,
        );

      const arr = normalized;
      setActiveSubs(arr);
      sessionStorage.setItem(
        `smp_subscriptions_${user?.email}`,
        JSON.stringify(arr),
      );
    } catch (err) {
      if (err.response?.status === 404) {
        setActiveSubs([]);
        sessionStorage.removeItem(`smp_subscriptions_${user?.email}`);
      } else {
        // Fall back to cache on network error
        const cached = sessionStorage.getItem(
          `smp_subscriptions_${user?.email}`,
        );
        const parsed = cached ? JSON.parse(cached) : [];
        setActiveSubs(
          (Array.isArray(parsed) ? parsed : parsed ? [parsed] : []).map(
            normalizeSubscription,
          ),
        );
      }
    }
  };

  useEffect(() => {
    fetchActiveSubs();

    const handleSubscriptionUpdate = (event) => {
      if (event.detail?.action === "cancel") {
        setActiveSubs([]);
        sessionStorage.removeItem(`smp_subscriptions_${user?.email}`);
      } else if (
        event.detail?.action === "subscribe" ||
        event.detail?.action === "switch"
      ) {
        fetchActiveSubs();
      }
    };
    window.addEventListener(
      "smp-subscription-updated",
      handleSubscriptionUpdate,
    );
    return () =>
      window.removeEventListener(
        "smp-subscription-updated",
        handleSubscriptionUpdate,
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const serviceType = params.get("serviceType") || "";
    const providerId = params.get("providerId") || "";

    didAutoScrollRef.current = false;
    setTargetProviderId(providerId);

    if (!serviceType) {
      setSelectedServiceType("");
      return;
    }

    setSelectedServiceType(
      SERVICE_TYPES.includes(serviceType) ? serviceType : "",
    );
  }, [location.search]);

  // ── Fetch plans when service type changes ─────────────────────
  useEffect(() => {
    if (!selectedServiceType) {
      setPlans([]);
      return;
    }
    const fetchPlans = async () => {
      setLoading(true);
      setFetchError("");
      setPlans([]);
      try {
        const data = await getPlansForUserByServiceTypeAPI(selectedServiceType);
        setPlans(data);
      } catch (err) {
        setFetchError(
          err.response?.data?.message ||
            `Failed to load ${selectedServiceType} plans.`,
        );
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, [selectedServiceType]);

  useEffect(() => {
    if (
      !selectedServiceType ||
      !targetProviderId ||
      loading ||
      !plans.length ||
      didAutoScrollRef.current
    ) {
      return;
    }

    const targetNode = providerSectionRefs.current[targetProviderId];
    if (!targetNode) return;

    targetNode.scrollIntoView({ behavior: "smooth", block: "start" });
    didAutoScrollRef.current = true;
  }, [loading, plans, selectedServiceType, targetProviderId]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 3500);
  };

  const handleConfirmSubscribe = async () => {
    const plan = confirmPlan;
    setConfirmPlan(null);
    setPaymentLoading(true);

    try {
      const existingSubForProvider = getActiveSubForProvider(plan);

      if (existingSubForProvider) {
        // ✅ Detect downgrade FIRST
        const isDowngrade = shouldTreatAsDowngrade(existingSubForProvider, plan);

        if (isDowngrade) {
          // 🟢 DOWNGRADE → ask confirmation, then direct switch (no payment)
          setDowngradePlan({ plan, existingSub: existingSubForProvider });
          return;
        }

        // 🔴 UPGRADE → calculate + payment
        const upgrade = await calculateUpgradeAPI(plan.id);
        const extraAmount = Number(upgrade.extraAmountToPay ?? 0);
        const remainingDays = Number(upgrade.remainingDays ?? 0);

        const payment = await initiatePaymentAPI(plan.id, extraAmount, "INR");

        localStorage.setItem("smp_payment_isswitch", "true");
        localStorage.setItem("smp_payment_planid", String(plan.id));
        localStorage.setItem("smp_payment_remdays", String(remainingDays));
        localStorage.setItem("smp_payment_amount", String(extraAmount));

        window.location.href = payment.checkoutUrl;
      } else {
        // ── NEW SUBSCRIPTION: user has no plan from this provider yet ──
        const payment = await initiatePaymentAPI(plan.id, plan.price, "INR");

        localStorage.setItem("smp_payment_isswitch", "false");
        localStorage.setItem("smp_payment_planid", String(plan.id));
        localStorage.setItem("smp_payment_remdays", "0");
        localStorage.setItem("smp_payment_amount", String(plan.price));

        window.location.href = payment.checkoutUrl;
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        "Something went wrong. Please try again.";

      if (
        errorMsg.includes("already have") ||
        errorMsg.includes("active subscription")
      ) {
        await fetchActiveSubs();
        showToast("Subscription state refreshed. Please try again.", "error");
      } else {
        showToast(errorMsg, "error");
      }
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleDowngradeConfirm = async () => {
    if (!downgradePlan) return;

    const { plan, existingSub } = downgradePlan;
    setPaymentLoading(true);

    try {
      const data = await switchPlanAPI(plan.id, existingSub.daysRemaining);

      setActiveSubs((prev) => [
        ...prev.filter((s) => String(s.subId) !== String(existingSub.subId)),
        {
          subId: String(data.subId),
          planId: String(data.planId),
          planName: data.planName,
          providerId: String(plan.providerId || existingSub.providerId),
          providerName: plan.providerName || existingSub.providerName,
          tier: data.tier,
          price: data.price ?? data.planPrice ?? 0,
          billing: data.billing ?? data.billingInterval,
          status: data.status,
        },
      ]);

      const refreshed = await getPlansForUserByServiceTypeAPI(selectedServiceType);
      setPlans(refreshed);
      showToast(`Switched to ${data.planName} successfully!`);
      setDowngradePlan(null);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to switch plan.", "error");
    } finally {
      setPaymentLoading(false);
    }
  };


  // // ── Subscribe / switch plan ───────────────────────────────────
  // const handleConfirmSubscribe = async () => {
  //   const plan = confirmPlan;
  //   setConfirmPlan(null);
  //   setPaymentLoading(true);

  //   try {
  //     // Find if user already has a sub for this plan's provider
  //     const existingSubForProvider = getActiveSubForProvider(plan);

  //     if (existingSubForProvider) {
  //       // ── SWITCH: user has a plan from this provider — switch to different tier ──
  //       const upgrade = await calculateUpgradeAPI(plan.id);
  //       const isDowngrade = shouldTreatAsDowngrade(existingSubForProvider, plan);

  //       if (isDowngrade) {
  //         // Downgrade — switch directly, no payment
  //         const data = await switchPlanAPI(plan.id, upgrade.remainingDays);
  //         const updatedSub = {
  //           subId: String(data.subId),
  //           planId: String(data.planId),
  //           planName: data.planName,
  //           providerId: String(
  //             plan.providerId || existingSubForProvider.providerId,
  //           ),
  //           providerName:
  //             plan.providerName || existingSubForProvider.providerName,
  //           tier: data.tier,
  //           price: data.price || data.planPrice || data.Price || 0,
  //           billing: data.billing || data.billingInterval,
  //           startDate: data.startDate,
  //           renewalDate: data.endDate,
  //           daysRemaining: data.daysRemaining,
  //           autoRenew: data.autoRenew,
  //           status: data.status,
  //         };
  //         setActiveSubs((prev) => [
  //           ...prev.filter(
  //             (s) => String(s.subId) !== String(existingSubForProvider.subId),
  //           ),
  //           updatedSub,
  //         ]);
  //         sessionStorage.setItem(
  //           `smp_subscriptions_${user?.email}`,
  //           JSON.stringify([
  //             ...activeSubs.filter(
  //               (s) => String(s.subId) !== String(existingSubForProvider.subId),
  //             ),
  //             updatedSub,
  //           ]),
  //         );
  //         showToast(`Switched to ${data.planName} successfully!`);
  //         const refreshed =
  //           await getPlansForUserByServiceTypeAPI(selectedServiceType);
  //         setPlans(refreshed);
  //       } else if (Number(upgrade.extraAmountToPay) > 0) {
  //         // Upgrade — redirect to Stripe
  //         const payment = await initiatePaymentAPI(
  //           plan.id,
  //           upgrade.extraAmountToPay,
  //           "INR",
  //         );
  //         localStorage.setItem("smp_payment_isswitch", "true");
  //         localStorage.setItem(
  //           "smp_payment_amount",
  //           String(upgrade.extraAmountToPay),
  //         );
  //         window.location.href = payment.checkoutUrl;
  //       } else {
  //         // Same tier/price — switch directly, no payment needed
  //         const data = await switchPlanAPI(plan.id, upgrade.remainingDays);
  //         const updatedSub = {
  //           subId: String(data.subId),
  //           planId: String(data.planId),
  //           planName: data.planName,
  //           providerId: String(
  //             plan.providerId || existingSubForProvider.providerId,
  //           ),
  //           providerName:
  //             plan.providerName || existingSubForProvider.providerName,
  //           tier: data.tier,
  //           price: data.price || data.planPrice || data.Price ||0,
  //           billing: data.billing || data.billingInterval,
  //           startDate: data.startDate,
  //           renewalDate: data.endDate,
  //           daysRemaining: data.daysRemaining,
  //           autoRenew: data.autoRenew,
  //           status: data.status,
  //         };
  //         // Replace the old sub for this provider, keep subs for other providers
  //         setActiveSubs((prev) => [
  //           ...prev.filter(
  //             (s) => String(s.subId) !== String(existingSubForProvider.subId),
  //           ),
  //           updatedSub,
  //         ]);
  //         sessionStorage.setItem(
  //           `smp_subscriptions_${user?.email}`,
  //           JSON.stringify([
  //             ...activeSubs.filter(
  //               (s) => String(s.subId) !== String(existingSubForProvider.subId),
  //             ),
  //             updatedSub,
  //           ]),
  //         );
  //         showToast(`Switched to ${data.planName} successfully!`);
  //         const refreshed =
  //           await getPlansForUserByServiceTypeAPI(selectedServiceType);
  //         setPlans(refreshed);

  //       }
  //     } else {
  //       // ── NEW SUBSCRIPTION: user has no plan from this provider yet ──
  //       const payment = await initiatePaymentAPI(plan.id, plan.price, "INR");
  //       localStorage.setItem("smp_payment_isswitch", "false");
  //       localStorage.setItem("smp_payment_amount", "0");
  //       window.location.href = payment.checkoutUrl;
  //     }
  //   } catch (err) {
  //     const errorMsg =
  //       err.response?.data?.message ||
  //       "Something went wrong. Please try again.";
  //     if (
  //       errorMsg.includes("already have") ||
  //       errorMsg.includes("active subscription")
  //     ) {
  //       // Stale state — refresh from backend
  //       await fetchActiveSubs();
  //       showToast("Subscription state refreshed. Please try again.", "error");
  //     } else {
  //       showToast(errorMsg, "error");
  //     }
  //   } finally {
  //     setPaymentLoading(false);
  //   }
  // };

  const activePlans = plans
    .filter((p) => p.active)
    .sort((a, b) => (TIER_ORDER[a.tier] ?? 99) - (TIER_ORDER[b.tier] ?? 99));

  return (
    <div>
      <UserNavbar />
      <div className="user-shell">
        <UserSidebar />
        <main className="user-content">
          {/* Toast */}
          {toast.msg && (
            <div
              style={{
                position: "fixed",
                top: "76px",
                right: "28px",
                zIndex: 300,
                background: toast.type === "success" ? "#f0fdf4" : "#fef2f2",
                border: `1px solid ${toast.type === "success" ? "#bbf7d0" : "#fecaca"}`,
                color: toast.type === "success" ? "#166534" : "#991b1b",
                borderRadius: "10px",
                padding: "12px 20px",
                fontSize: "14px",
                fontWeight: "500",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
            >
              {toast.type === "success" ? "✓" : "✗"} {toast.msg}
            </div>
          )}

          {/* Page header */}
          <div style={{ marginBottom: "20px" }}>
            <h1
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "22px",
                fontWeight: 700,
                color: "var(--text-dark)",
                marginBottom: "4px",
              }}
            >
              Browse Plans
            </h1>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Select a service category to explore available plans. You can
              subscribe to one plan per provider.
            </p>
          </div>

          {/* Active subscriptions banner */}
          {activeSubs.length > 0 && (
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "12px",
                padding: "14px 20px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  fontWeight: "600",
                  color: "#166534",
                  fontSize: "13px",
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>✅</span>
                Active subscriptions ({activeSubs.length})
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {activeSubs.map((s) => (
                  <span
                    key={s.subId || s.planId}
                    style={{
                      background: "white",
                      border: "1px solid #bbf7d0",
                      color: "#166534",
                      fontSize: "12px",
                      fontWeight: "600",
                      padding: "4px 12px",
                      borderRadius: "20px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    {s.providerName && (
                      <span style={{ color: "#4d7c60", fontWeight: "400" }}>
                        {s.providerName} ·
                      </span>
                    )}
                    {s.planName}
                    <span style={{ color: "#4d7c60", fontWeight: "400" }}>
                      ₹{s.price}/{displayBilling(s.billing)}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Service type selector */}
          <div
            style={{
              background: "var(--bg-card)",
              borderRadius: "14px",
              border: "1px solid var(--border)",
              padding: "18px 20px",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                fontWeight: "700",
                color: "var(--text-light)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: "12px",
              }}
            >
              Service Category
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                gap: "8px",
              }}
            >
              {SERVICE_TYPES.map((type) => {
                const isSelected = selectedServiceType === type;
                return (
                  <button
                    key={type}
                    onClick={() =>
                      setSelectedServiceType(isSelected ? "" : type)
                    }
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "7px",
                      padding: "9px 12px",
                      borderRadius: "10px",
                      border: isSelected
                        ? "2px solid var(--brand)"
                        : "1.5px solid var(--border)",
                      background: isSelected
                        ? "var(--brand-light)"
                        : "var(--bg)",
                      color: isSelected ? "var(--brand)" : "var(--text-mid)",
                      cursor: "pointer",
                      fontFamily: "var(--font-body)",
                      fontSize: "13px",
                      fontWeight: isSelected ? "600" : "400",
                      transition: "all 0.15s ease",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor =
                          "var(--brand-muted)";
                        e.currentTarget.style.background = "#f5f3ff";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = "var(--border)";
                        e.currentTarget.style.background = "var(--bg)";
                      }
                    }}
                  >
                    <span style={{ fontSize: "15px", flexShrink: 0 }}>
                      {SERVICE_ICONS[type]}
                    </span>
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {type}
                    </span>
                    {isSelected && (
                      <span
                        style={{
                          marginLeft: "auto",
                          fontSize: "11px",
                          flexShrink: 0,
                        }}
                      >
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {selectedServiceType && (
              <button
                onClick={() => setSelectedServiceType("")}
                style={{
                  marginTop: "10px",
                  background: "none",
                  border: "none",
                  fontSize: "12px",
                  color: "var(--text-light)",
                  cursor: "pointer",
                  padding: "2px 0",
                  textDecoration: "underline",
                }}
              >
                ✕ Clear selection
              </button>
            )}
          </div>

          {fetchError && (
            <div className="smp-error-msg" style={{ marginBottom: "16px" }}>
              {fetchError}
            </div>
          )}

          {/* No category selected */}
          {!selectedServiceType && !loading && (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                background: "var(--bg-card)",
                borderRadius: "16px",
                border: "1px solid var(--border)",
              }}
            >
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>🗂️</div>
              <div
                style={{
                  fontFamily: "'Sora', sans-serif",
                  fontSize: "17px",
                  fontWeight: "600",
                  color: "var(--text-dark)",
                  marginBottom: "8px",
                }}
              >
                Choose a service category
              </div>
              <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                Select a category above to see available plans.
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div
              style={{
                background: "var(--bg-card)",
                borderRadius: "16px",
                border: "1px solid var(--border)",
                padding: "80px",
                textAlign: "center",
                color: "var(--text-light)",
                fontSize: "14px",
              }}
            >
              <div style={{ fontSize: "32px", marginBottom: "12px" }}>
                {SERVICE_ICONS[selectedServiceType] || "⏳"}
              </div>
              Loading {selectedServiceType} plans...
            </div>
          )}

          {/* No plans */}
          {!loading &&
            selectedServiceType &&
            activePlans.length === 0 &&
            !fetchError && (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px 20px",
                  background: "var(--bg-card)",
                  borderRadius: "16px",
                  border: "1px solid var(--border)",
                }}
              >
                <div style={{ fontSize: "40px", marginBottom: "12px" }}>📭</div>
                <div
                  style={{
                    fontFamily: "'Sora', sans-serif",
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "var(--text-dark)",
                    marginBottom: "8px",
                  }}
                >
                  No plans available
                </div>
                <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>
                  No active {selectedServiceType} plans yet. Try a different
                  category.
                </div>
              </div>
            )}

          {/* Plans grid */}
          {!loading && activePlans.length > 0 && (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "16px",
                }}
              >
                <span style={{ fontSize: "20px" }}>
                  {SERVICE_ICONS[selectedServiceType]}
                </span>
                <h2
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "var(--text-dark)",
                    margin: 0,
                  }}
                >
                  {selectedServiceType} Plans
                </h2>
                <span
                  style={{
                    background: "var(--brand-light)",
                    color: "var(--brand)",
                    fontSize: "11px",
                    fontWeight: "700",
                    padding: "2px 8px",
                    borderRadius: "20px",
                  }}
                >
                  {activePlans.length} available
                </span>
              </div>

              {/* ── Group plans by provider ── */}
              {(() => {
                // Build a map of providerId → { providerName, plans[] }
                const providerMap = {};
                activePlans.forEach((plan) => {
                  const key = String(plan.providerId ?? "unknown");
                  if (!providerMap[key]) {
                    providerMap[key] = {
                      providerKey: key,
                      providerId: plan.providerId,
                      providerName: plan.providerName || "Provider",
                      plans: [],
                    };
                  }
                  providerMap[key].plans.push(plan);
                });
                const providers = Object.values(providerMap);

                return providers.map((provider) => {
                  const subForThisProvider =
                    activeSubs.find(
                      (s) =>
                        String(s.providerId) === String(provider.providerId),
                    ) ||
                    activeSubs.find((s) =>
                      provider.plans.some((plan) =>
                        matchesPlanIdentity(s, plan),
                      ),
                    );
                  const switchBlockedMessage = getSwitchBlockedMessage(subForThisProvider);

                  return (
                    <div
                      key={provider.providerKey}
                      ref={(node) => {
                        if (node) {
                          providerSectionRefs.current[provider.providerKey] = node;
                        } else {
                          delete providerSectionRefs.current[provider.providerKey];
                        }
                      }}
                      style={{ marginBottom: "28px", scrollMarginTop: "90px" }}
                    >
                      {/* Provider header */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          marginBottom: "12px",
                          paddingBottom: "10px",
                          borderBottom: "1px solid var(--border)",
                        }}
                      >
                        {/* Provider avatar initials */}
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "8px",
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
                          {provider.providerName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div
                            style={{
                              fontFamily: "var(--font-heading)",
                              fontSize: "14px",
                              fontWeight: "700",
                              color: "var(--text-dark)",
                            }}
                          >
                            {provider.providerName}
                          </div>
                          <div
                            style={{
                              fontSize: "11px",
                              color: "var(--text-muted)",
                            }}
                          >
                            {subForThisProvider
                              ? `✅ You are subscribed to ${subForThisProvider.planName} from this provider`
                              : `${provider.plans.length} plan${provider.plans.length !== 1 ? "s" : ""} available · Select one to subscribe`}
                          </div>
                          {switchBlockedMessage && (
                            <div
                              style={{
                                marginTop: "6px",
                                background: "var(--error-bg)",
                                border: "1px solid var(--error-border)",
                                borderRadius: "8px",
                                padding: "8px 10px",
                                fontSize: "12px",
                                color: "var(--error)",
                                maxWidth: "720px",
                              }}
                            >
                              {switchBlockedMessage}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="plans-grid">
                        {provider.plans.map((plan, index) => {
                          const isCurrent = isPlanCurrentForProvider(plan);
                          const hasDifferentPlanFromProvider =
                            !!subForThisProvider && !isCurrent;
                          const switchBlocked = !!switchBlockedMessage && !isCurrent;
                          const isPopular = plan.tier === "PRO";
                          const colors =
                            tierStyle[plan.tier] || tierStyle.BASIC;

                          return (
                            <div
                              key={`${plan.id}-${index}`}
                              className={
                                "plan-card" +
                                (isPopular && !isCurrent ? " popular" : "") +
                                (isCurrent ? " current-plan" : "")
                              }
                              style={{
                                display: "flex",
                                flexDirection: "column",
                              }}
                            >
                              {isPopular && !isCurrent && (
                                <div className="popular-badge">
                                  ⭐ Most Popular
                                </div>
                              )}
                              {isCurrent && (
                                <div className="current-badge">
                                  ✓ Current Plan
                                </div>
                              )}

                              <div
                                className="plan-card-header"
                                style={{
                                  background:
                                    plan.tier === "ENTERPRISE"
                                      ? "linear-gradient(135deg, #1e1b4b, #312e81)"
                                      : plan.tier === "PRO"
                                        ? "#f5f3ff"
                                        : "#fafbff",
                                }}
                              >
                                <div
                                  className="plan-tier-label"
                                  style={{
                                    color:
                                      plan.tier === "ENTERPRISE"
                                        ? "#a5b4fc"
                                        : colors.text,
                                  }}
                                >
                                  {plan.tier}
                                </div>
                                <div
                                  className="plan-name"
                                  style={{
                                    color:
                                      plan.tier === "ENTERPRISE"
                                        ? "white"
                                        : "var(--text-dark)",
                                  }}
                                >
                                  {plan.name}
                                </div>
                                {plan.description && (
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      marginBottom: "8px",
                                      color:
                                        plan.tier === "ENTERPRISE"
                                          ? "rgba(255,255,255,0.6)"
                                          : "var(--text-light)",
                                    }}
                                  >
                                    {plan.description}
                                  </div>
                                )}
                                <div
                                  className="plan-price"
                                  style={{
                                    color:
                                      plan.tier === "ENTERPRISE"
                                        ? "#67e8f9"
                                        : "var(--brand)",
                                  }}
                                >
                                  ₹{plan.price}
                                  <span className="plan-price-cycle">
                                    /{displayBilling(plan.billingInterval)}
                                  </span>
                                </div>
                              </div>

                              <div
                                className="plan-card-body"
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  flex: 1,
                                }}
                              >
                                <ul className="plan-feature-list">
                                  {getFeatures(plan).map((f, i) => (
                                    <li key={i}>
                                      <span className="check">✓</span>
                                      {f}
                                    </li>
                                  ))}
                                </ul>
                                {plan.subscriberCount !== undefined && (
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      color: "var(--text-light)",
                                      marginBottom: "12px",
                                    }}
                                  >
                                    👥 {plan.subscriberCount} subscriber
                                    {plan.subscriberCount !== 1 ? "s" : ""}
                                  </div>
                                )}
                                <button
                                  className={
                                    "btn-select-plan" +
                                    (isCurrent ? " current" : "")
                                  }
                                  disabled={isCurrent || switchBlocked}
                                  onClick={() => {
                                    if (isCurrent || switchBlocked) return;
                                    setConfirmPlan(plan);
                                  }}
                                  style={{
                                    marginTop: "auto",
                                    ...(plan.tier === "ENTERPRISE" && !isCurrent
                                      ? { background: "#4f46e5" }
                                      : {}),
                                    opacity:
                                      isCurrent || switchBlocked ? 0.65 : 1,
                                  }}
                                >
                                  {isCurrent
                                    ? "✓ Current plan"
                                    : switchBlocked
                                      ? "Switch unavailable"
                                    : hasDifferentPlanFromProvider
                                      ? "Switch to this plan"
                                      : "Select plan"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}
            </>
          )}
        </main>
      </div>

      {/* Confirm modal */}
      {confirmPlan && (
        <div className="modal-overlay" onClick={() => setConfirmPlan(null)}>
          <div
            className="confirm-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="confirm-modal-icon">
              {confirmPlan.tier === "ENTERPRISE"
                ? "🏢"
                : confirmPlan.tier === "PRO"
                  ? "⭐"
                  : "📋"}
            </div>
            <div className="confirm-modal-title">
              {getActiveSubForProvider(confirmPlan)
                ? "Switch plan?"
                : "Subscribe to plan?"}
            </div>
            <div className="confirm-modal-body">
              {(() => {
                const existingSub = getActiveSubForProvider(confirmPlan);
                if (!existingSub)
                  return "You will be redirected to Stripe's secure payment page.";
                const existingPrice = Number(existingSub.price ?? 0);
                const newPrice = Number(confirmPlan.price ?? 0);
                // calculateUpgradeAPI is the source of truth but we show a hint based on price
                return newPrice <= existingPrice
                  ? "This is a downgrade — your plan will switch immediately at no charge."
                  : `You'll pay only the prorated difference (not the full ₹${confirmPlan.price}).`;
              })()}
              <strong>{confirmPlan.name}</strong> for{" "}
              <strong>
                ₹{confirmPlan.price}/
                {displayBilling(confirmPlan.billingInterval)}
              </strong>
              .
              {confirmPlan.providerName && (
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    marginTop: "6px",
                  }}
                >
                  Provider: <strong>{confirmPlan.providerName}</strong>
                </div>
              )}
              <br />
              <div
                style={{
                  background: "var(--info-bg)",
                  border: "1px solid var(--info-border)",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  fontSize: "13px",
                  color: "#1e40af",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span>🔒</span>
                {(() => {
                  const existingSub = getActiveSubForProvider(confirmPlan);
                  return existingSub &&
                    confirmPlan.price < (existingSub.price ?? Infinity)
                    ? "Downgrade requires confirmation and then switches immediately."
                    : "You will be redirected to Stripe's secure payment page.";
                })()}
              </div>
            </div>
            <div className="confirm-modal-actions">
              <button
                className="btn-modal-cancel"
                onClick={() => setConfirmPlan(null)}
              >
                Cancel
              </button>
              <button
                className="btn-admin-primary"
                onClick={handleConfirmSubscribe}
                disabled={paymentLoading}
                style={{ opacity: paymentLoading ? 0.7 : 1 }}
              >
                {paymentLoading
                  ? "Processing..."
                  : (() => {
                      const existingSub = getActiveSubForProvider(confirmPlan);
                      if (!existingSub) return "Proceed to payment";
                      const isDowngrade = existingSub && confirmPlan.price <= (existingSub.price ?? Infinity);
                      return isDowngrade ? "Yes, switch plan" : "Proceed to payment";
                    })()}
              </button>
            </div>
          </div>
        </div>
        
      )}

      {downgradePlan && (
        <div className="modal-overlay" onClick={() => setDowngradePlan(null)}>
          <div className="confirm-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-modal-icon">⚠️</div>
            <div className="confirm-modal-title">Confirm Downgrade</div>
            <div className="confirm-modal-body">
              You are switching from <strong>{downgradePlan.existingSub.planName}</strong> to{" "}
              <strong>{downgradePlan.plan.name}</strong>.
              <br />
              This plan is lower priced and will be switched immediately without payment.
            </div>
            <div className="confirm-modal-actions">
              <button
                className="btn-modal-cancel"
                onClick={() => setDowngradePlan(null)}
              >
                Cancel
              </button>
              <button
                className="btn-admin-primary"
                onClick={handleDowngradeConfirm}
                disabled={paymentLoading}
                style={{ opacity: paymentLoading ? 0.7 : 1 }}
              >
                {paymentLoading ? "Processing..." : "Confirm and switch"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Plans;
