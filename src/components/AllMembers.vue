<script setup>
import MemberItem from './MemberItem.vue'
import MemberModal from './MemberModal.vue'
import { apiUrls } from '../api/urls.js'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { toBirthdayDate } from '../utils.js'

const router = useRouter()
const members = ref([])
const loading = ref(false)
const loadError = ref(null)
const selectedMember = ref(null)
const searchQuery = ref('')

const currentPage = ref(1)
const pageSize = ref(5)
const pageSizeOptions = [5, 10, 20, 50]
const totalItems = ref(0)
const paginationLinks = ref({ next: null, previous: null })



function normalizeBirthdayFlag(rawFlag, birthdayDate) {
    const derivedFromDate = birthdayDate instanceof Date && !Number.isNaN(birthdayDate.getTime())
        ? (() => {
            const today = new Date()
            return (
                today.getDate() === birthdayDate.getDate() &&
                today.getMonth() === birthdayDate.getMonth()
            )
        })()
        : false

    if (typeof rawFlag === 'boolean') {
        return rawFlag ? true : derivedFromDate
    }

    if (typeof rawFlag === 'number') {
        return rawFlag !== 0 ? true : derivedFromDate
    }

    if (typeof rawFlag === 'string') {
        const normalized = rawFlag.trim().toLowerCase()

        if (normalized === 'true' || normalized === '1' || normalized === 't' || normalized === 'yes') {
            return true
        }

        if (normalized === 'false' || normalized === '0' || normalized === 'f' || normalized === 'no') {
            return derivedFromDate
        }
    }

    return derivedFromDate
}

const totalPages = computed(() => {
    const total = typeof totalItems.value === 'number' && totalItems.value >= 0
        ? totalItems.value
        : members.value.length

    return Math.max(1, Math.ceil(total / pageSize.value))
})

const hasNextPage = computed(() => {
    if (paginationLinks.value.next !== null) {
        return Boolean(paginationLinks.value.next)
    }
    return currentPage.value < totalPages.value
})

const hasPreviousPage = computed(() => {
    if (paginationLinks.value.previous !== null) {
        return Boolean(paginationLinks.value.previous)
    }
    return currentPage.value > 1
})

// Build a condensed list of page buttons: numbers and ellipses
const pageButtons = computed(() => {
    const total = totalPages.value
    const current = currentPage.value

    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1)
    }

    const pages = [1]

    // Left ellipsis
    if (current > 4) {
        pages.push('…')
    }

    // Middle window around current (ensure within [2, total-1])
    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)
    for (let p = start; p <= end; p++) {
        pages.push(p)
    }

    // Right ellipsis
    if (current < total - 3) {
        pages.push('…')
    }

    pages.push(total)
    return pages
})

// Range information for "Exibindo X–Y de Z"
const pageStart = computed(() => {
    if (!totalItems.value) return 0
    return (currentPage.value - 1) * pageSize.value + 1
})

const pageEnd = computed(() => {
    if (!totalItems.value) return 0
    return Math.min(totalItems.value, currentPage.value * pageSize.value)
})

async function fetchMembers(page = currentPage.value) {
    loading.value = true
    loadError.value = null

    try {
        const storedToken = localStorage.getItem('authToken')
        const headers = storedToken ? { 'Authorization': `Token ${storedToken}` } : {}
        const url = apiUrls.getAllMembers({ page, pageSize: pageSize.value, search: searchQuery.value })
        const res = await fetch(url, { headers })

        if (res.status === 401) {
            // Remove o token inválido
            localStorage.removeItem('authToken')
            
            // Limpa os dados
            members.value = []
            totalItems.value = 0
            paginationLinks.value = { next: null, previous: null }
            currentPage.value = 1
            loadError.value = null
            
            // Redireciona para login usando Vue Router
            router.push({ name: 'login' })
            return
        }

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`)
        }

        const data = await res.json()
        console.log('Members url:', url);
        console.log('Request headers:', headers);
        console.log('Response status:', res.status);
        console.log('Fetched members data:', data);



        const resultList = Array.isArray(data?.results)
            ? data.results
            : Array.isArray(data)
                ? data
                : []

        members.value = resultList.map(member => {
            const birthdayDate = toBirthdayDate(member.birth_date)

            return {
                id: member.id,
                name: member.name,
                birthday: birthdayDate,
                phoneNumber: member.phone_number,
                profilePicture: member.profile_picture,
                department: member.department,
                isBirthdayToday: normalizeBirthdayFlag(member.is_birthday_today, birthdayDate),
            }
        })

        totalItems.value = typeof data?.count === 'number' ? data.count : members.value.length
        paginationLinks.value = {
            next: data?.next ?? null,
            previous: data?.previous ?? null,
        }

        currentPage.value = page
    } catch (error) {
        loadError.value = 'Erro ao carregar membros'
        console.error('Failed to load members', error)
    } finally {
        loading.value = false
    }
}

function openMember(member) {
    selectedMember.value = member
}

function closeModal() {
    selectedMember.value = null
}
// Delete a member by id
async function deleteMember(id) {
    const storedToken = localStorage.getItem('authToken')
    const headers = storedToken ? { 'Authorization': `Token ${storedToken}` } : {}
    try {
        const res = await fetch(apiUrls.deleteMember(id), { method: 'DELETE', headers })
        if (res.status === 401) {
            localStorage.removeItem('authToken')
            router.push({ name: 'login' })
            return
        }
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`)
        }
        closeModal()
        // Refresh list after deletion
        fetchMembers(currentPage.value)
    } catch (error) {
        console.error('Failed to delete member', error)
    }
}

function goToNextPage() {
    if (hasNextPage.value) {
        const nextPage = currentPage.value + 1
        fetchMembers(nextPage)
    }
}

function goToPreviousPage() {
    if (hasPreviousPage.value) {
        const prevPage = Math.max(1, currentPage.value - 1)
        fetchMembers(prevPage)
    }
}

function goToFirstPage() {
    if (currentPage.value > 1) {
        fetchMembers(1)
    }
}

function goToLastPage() {
    const total = totalPages.value
    if (currentPage.value < total) {
        fetchMembers(total)
    }
}

function goToPage(page) {
    const total = totalPages.value
    if (typeof page === 'number' && page >= 1 && page <= total && page !== currentPage.value) {
        fetchMembers(page)
    }
}

function goToCreateMember() {
    router.push({ name: 'member-create' })
}

function onPageSizeChange(event) {
    const newSize = Number(event.target.value)

    if (!Number.isNaN(newSize) && newSize > 0) {
        pageSize.value = newSize
        fetchMembers(1)
    }
}

// Debounce helper (simple, no external lib)
function debounce(fn, delay = 300) {
    let t
    return (...args) => {
        clearTimeout(t)
        t = setTimeout(() => fn(...args), delay)
    }
}

const debouncedSearch = debounce(() => fetchMembers(1), 300)

// Live search while typing (debounced)
watch(searchQuery, () => {
    debouncedSearch()
})

onMounted(() => {
    fetchMembers()
})

</script>

<template>
    <section>
        <h2>Todos os membros</h2>

        <div class="all-members-container">
            <p v-if="loading">Carregando...</p>
            <p v-if="!loading && loadError" class="error">{{ loadError }}</p>
            <div class="all-members-top-div">
                <div class="page-size-selector">
                    <label for="page-size">Itens por página</label>
                    <select id="page-size" :value="pageSize" @change="onPageSizeChange" :disabled="loading">
                        <option v-for="option in pageSizeOptions" :key="option" :value="option">{{ option }}</option>
                    </select>
                </div>
                <div class="all-members-search">
                    <input type="text" placeholder="Buscar membro por nome..." v-model="searchQuery"
                        @keyup.enter="fetchMembers(1)">
                </div>
                <button type="button" class="create-member-btn" @click="goToCreateMember" :disabled="loading">
                    + Novo membro
                </button>
            </div>
            <ul v-if="members.length" class="member-list">
                <li style="list-style:none" v-for="member in members" :key="member.name">
                    <MemberItem :name="member.name" :birthday="member.birthday"
                        :is-birthday-today="member.isBirthdayToday" @select="openMember(member)" />
                </li>
            </ul>
            <p v-else-if="!loading && !loadError" class="empty-state">Nenhum membro encontrado.</p>

            <div v-if="!loadError" class="pagination-card">
                <div class="pagination" role="navigation" aria-label="Paginação">
                    <button type="button" class="page-btn first-btn" @click="goToFirstPage"
                        :disabled="loading || currentPage === 1" aria-label="Primeira página">« Primeiro</button>

                    <button type="button" class="page-btn" @click="goToPreviousPage"
                        :disabled="loading || !hasPreviousPage" aria-label="Página anterior">‹ Anterior</button>

                    <ul class="page-list" aria-live="polite">
                        <li v-for="(item, idx) in pageButtons" :key="idx">
                            <span v-if="item === '…'" class="ellipsis" aria-hidden="true">{{ item }}</span>
                            <button v-else type="button" class="page-number" :class="{ active: item === currentPage }"
                                :aria-current="item === currentPage ? 'page' : null" @click="goToPage(item)"
                                :disabled="loading || item === currentPage">
                                {{ item }}
                            </button>
                        </li>
                    </ul>

                    <button type="button" class="page-btn" @click="goToNextPage" :disabled="loading || !hasNextPage"
                        aria-label="Próxima página">Próxima ›</button>

                    <button type="button" class="page-btn last-btn" @click="goToLastPage"
                        :disabled="loading || currentPage === totalPages" aria-label="Última página">Último »</button>
                </div>
            </div>

            <MemberModal
                v-if="selectedMember"
                :id="selectedMember.id"
                :name="selectedMember.name"
                :birthday="selectedMember.birthday"
                @close="closeModal"
                @delete="deleteMember"
            />
        </div>

    </section>
</template>

<style scoped>
.error {
    color: #b91c1c
}

.all-members-container {
    display: flex;
    flex-direction: column;
}

.all-members-top-div {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    /* Shared control height for select, input and button */
    --control-h: 36px;
}

.create-member-btn {
    height: var(--control-h);
    padding: 0 1rem;
    border-radius: 8px;
    border: none;
    background: #6366f1;
    color: #fff;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s ease, box-shadow 0.2s ease;
    box-shadow: 0 10px 20px -14px rgba(79, 70, 229, 0.9);
    margin-left: auto;
}

.create-member-btn:hover:enabled {
    background: #4f46e5;
}

.create-member-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    box-shadow: none;
}

.all-members-search {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-grow: 1;
    min-width: 0;
    /* allow input to shrink on small screens */
}

.all-members-search input[type="text"] {
    height: var(--control-h);
    padding: 0 0.75rem;
    border-radius: 8px;
    border: 1px solid var(--color-border);
    background: var(--color-background);
    color: var(--color-text);
    min-width: 0;
    width: 100%;
}

.member-list {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    margin-top: 1rem;
    padding: 0;
}

.pagination-card {
    margin-top: 1.5rem;
    border: 1px solid var(--color-border);
    background: var(--color-background-soft);
    border-radius: 12px;
    padding: 0.75rem;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.pagination-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.25rem 0.5rem 0.75rem 0.5rem;
    border-bottom: 1px solid var(--color-border);
}

.range {
    color: #6b7280;
    font-size: 0.9rem;
}

.pagination {
    margin-top: 0.75rem;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
}

.pagination button,
.page-number,
.page-btn {
    padding: 0.5rem 1rem;
    border-radius: 999px;
    border: 1px solid var(--color-border);
    background-color: var(--color-background);
    color: var(--color-text);
    font-weight: 500;
    cursor: pointer;
    transition: box-shadow 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.pagination button:hover:enabled,
.page-number:hover:enabled,
.page-btn:hover:enabled {
    background-color: var(--color-background-mute);
    border-color: var(--color-border-hover);
}

.pagination button:disabled,
.page-number:disabled,
.page-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    background-color: var(--color-background-soft);
}

.page-status {
    font-weight: 500;
    color: #4b5563;
    padding: 0 0.5rem;
}

.page-size-selector {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #4b5563;
}

.page-size-selector select {
    height: var(--control-h);
    padding: 0 0.75rem;
    border-radius: 8px;
    border: 1px solid var(--color-border);
    background-color: var(--color-background);
    color: var(--color-text);
    font-weight: 500;
    transition: border-color 0.2s ease;
}

/* Ensure dropdown options also respect theme colors */
.page-size-selector select option {
    color: var(--color-text);
    background-color: var(--color-background);
}

.page-size-selector select:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25);
}

.page-list {
    display: flex;
    align-items: center;
    list-style: none;
    margin: 0 0.25rem;
    padding: 0;
    gap: 0.25rem;
}

.page-number {
    min-width: 2.25rem;
    padding: 0.4rem 0.75rem;
    border: 1px solid var(--color-border);
}

.page-number.active {
    background: linear-gradient(180deg, rgba(99, 102, 241, 0.25) 0%, rgba(99, 102, 241, 0.14) 100%);
    border-color: #6366f1;
    color: #4338ca;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

.ellipsis {
    display: inline-block;
    padding: 0 0.5rem;
    color: #6b7280;
}

.empty-state {
    margin-top: 1rem;
    color: #4b5563;
}

@media (max-width: 480px) {
    .pagination {
        flex-wrap: wrap;
        justify-content: space-between;
        row-gap: 0.5rem;
    }

    /* Place numbers on their own full-width row */
    .page-list {
        order: 2;
        width: 100%;
        justify-content: center;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        padding-bottom: 0.25rem;
        /* avoid scrollbar overlap */
    }

    /* Make Prev/Next share the first row nicely */
    .pagination .page-btn {
        flex: 1 1 calc(50% - 0.25rem);
        min-width: calc(50% - 0.25rem);
    }

    .all-members-top-div {
        flex-direction: column;
        align-items: stretch;
        gap: 0.5rem;
    }

    .page-size-selector {
        justify-content: space-between;
    }

    .all-members-search {
        width: 100%;
    }

    .create-member-btn {
        width: 100%;
        margin-left: 0;
    }

    .pagination-meta {
        flex-direction: column;
        align-items: stretch;
        gap: 0.5rem;
    }

    .range {
        text-align: center;
    }

    .page-status {
        display: none;
    }

    .first-btn,
    .last-btn {
        display: none;
    }
}
</style>
