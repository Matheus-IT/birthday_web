const BASE_API_URL = `${import.meta.env.VITE_API_HOST}/api`
export const apiUrls = {
    getAllMembers: () => `${BASE_API_URL}/members/`,
    login: () => `${BASE_API_URL}/login/`,
}