const BASE_API_URL = `${import.meta.env.VITE_API_HOST}/api`
export const apiUrls = {
    getAllMembers: ({ page = 1, pageSize, search } = {}) => {
        const searchParams = new URLSearchParams({ page: String(page) })

        if (pageSize) {
            searchParams.set('page_size', String(pageSize))
        }

        if (typeof search === 'string' && search.trim() !== '') {
            // DRF SearchFilter commonly uses the "search" query param
            searchParams.set('search', search.trim())
        }

        return `${BASE_API_URL}/members/?${searchParams.toString()}`
    },
    login: () => `${BASE_API_URL}/login/`,
}