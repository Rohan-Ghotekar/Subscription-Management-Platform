import api from './axios'

// // ── ADMIN SUMMARY ─────────────────────────────────────────────
// // GET /api/admin/summary?from=&to=  (from/to are optional)
// // Returns: { totalActiveSubscriptions, monthlyRecurringRevenue,
// //            churnRate, newSubscriptionsThisMonth,
// //            upcomingRenewalsNext30Days }
// export const getAdminSummaryAPI = async (from = '', to = '') => {
//   const params = {}
//   if (from) params.from = from
//   if (to)   params.to   = to
//   const response = await api.get('/api/admin/summary', { params })
//   return response.data
// }


// // ── PLAN DISTRIBUTION ─────────────────────────────────────────
// // GET /api/admin/plandistribution
// // Returns: [ { planName, count, percentage } ]
// export const getPlanDistributionAPI = async () => {
//   const response = await api.get('/api/admin/plandistribution')
//   return response.data
// }

// // ── SUBSCRIPTION GROWTH ───────────────────────────────────────
// // GET /api/admin/growth
// // Returns: [ { month, count } ]
// export const getSubscriptionGrowthAPI = async () => {
//   const response = await api.get('/api/admin/growth')
//   return response.data
// }
// // ── GET USER ACTIVE PLAN (Admin) ──────────────────────────────
// // GET /api/admin/getuseractiveplan/{userId}
// // Returns the plan object the user is currently subscribed to
// // { id, name, description, price, billingInterval, tier,
// //   features[], imageUrl, active, subscriberCount, createdAt }

// export const getUserActivePlanAPI =async (userId) => {
//   const response=await api.get(`api/admin/useractiveplan/${userId}`);
//   return response.data
// }

// ── GET ALL PROVIDERS ─────────────────────────────────────────
// GET /api/admin/allproviders
// Returns: [{ userId, email, fullName, avatarUrl, role, createdAt,
//             updatedAt, mobile, businessName, serviceType,
//             description, isPermitted }]

export const getAllProvidersAPI = async () => {
  const response = await api.get('/api/admin/allproviders')
  return response.data
}

// ── PERMIT PROVIDER ───────────────────────────────────────────
// PUT /api/admin/changeproviderstate/{providerId}
// providerId = userId (same users table, role = PROVIDER)
export const changeProviderStateAPI = async (providerId) => {
  const response = await api.put(`/api/admin/providerstate/${providerId}`)
  return response.data
}