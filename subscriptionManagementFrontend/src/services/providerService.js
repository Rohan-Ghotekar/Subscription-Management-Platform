import api from './axios'

export const getProviderSummaryAPI=async()=>{
    const response=await api.get('/api/provider/summary')
    return response.data
}
export const getProviderPlanDistributionAPI = async () => {
  const response = await api.get('/api/provider/plandistribution')
  return response.data
}

export const  getProviderSubscriptionGrowthAPI = async () => {
  const response = await api.get('/api/provider/growth')
  return response.data
}

export const getProviderUserActivePlanAPI=async(userId)=>{
    const response=await api.get(`/api/provider/useractiveplan/${userId}`)
    return response.data
}