const BASE_API_URL = `${import.meta.env.VITE_API_HOST}/api`
export const apiUrls = {
    getAllMembers: ({ page = 1, pageSize } = {}) => {
        const searchParams = new URLSearchParams({ page: String(page) })

        if (pageSize) {
            searchParams.set('page_size', String(pageSize))
        }

        return `${BASE_API_URL}/members/?${searchParams.toString()}`
    },
    login: () => `${BASE_API_URL}/login/`,
}