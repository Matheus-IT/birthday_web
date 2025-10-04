<script setup>
import MemberItem from './MemberItem.vue'
import MemberModal from './MemberModal.vue'
import { apiUrls } from '../api/urls.js'
import { computed, onMounted, ref } from 'vue'


const members = ref([])
const loading = ref(false)
const loadError = ref(null)
const selectedMember = ref(null)

const currentPage = ref(1)
const pageSize = ref(10)
const pageSizeOptions = [5, 10, 20, 50]
const totalItems = ref(0)
const paginationLinks = ref({ next: null, previous: null })

function toBirthdayDate(rawDate) {
    if (!rawDate) {
        return null
    }

    const date = new Date(`${rawDate}T12:00:00`)
    return Number.isNaN(date.getTime()) ? null : date
}

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

async function fetchMembers(page = currentPage.value) {
    loading.value = true
    loadError.value = null

    try {
        const storedToken = localStorage.getItem('authToken') || import.meta.env.VITE_API_TOKEN
        const headers = storedToken ? { 'Authorization': `Token ${storedToken}` } : {}
        const res = await fetch(apiUrls.getAllMembers({ page, pageSize: pageSize.value }), { headers })

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`)
        }

        const data = await res.json()
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

function onPageSizeChange(event) {
    const newSize = Number(event.target.value)

    if (!Number.isNaN(newSize) && newSize > 0) {
        pageSize.value = newSize
        fetchMembers(1)
    }
}

onMounted(() => {
    fetchMembers()
})

</script>

<template>
    <section>
        <h2>Todos os membros</h2>
        <p v-if="loading">Carregando...</p>
        <p v-if="!loading && loadError" class="error">{{ loadError }}</p>
        <ul v-if="members.length">
            <li style="list-style:none" v-for="member in members" :key="member.name">
                <MemberItem :name="member.name" :birthday="member.birthday" :is-birthday-today="member.isBirthdayToday"
                    @select="openMember(member)" />
            </li>
        </ul>
        <p v-else-if="!loading && !loadError" class="empty-state">Nenhum membro encontrado.</p>

        <div v-if="!loadError" class="page-size-selector">
            <label for="page-size">Itens por página</label>
            <select id="page-size" :value="pageSize" @change="onPageSizeChange" :disabled="loading">
                <option v-for="option in pageSizeOptions" :key="option" :value="option">{{ option }}</option>
            </select>
        </div>

        <div v-if="!loadError" class="pagination">
            <button type="button" @click="goToPreviousPage" :disabled="loading || !hasPreviousPage">Anterior</button>
            <span class="page-status">Página {{ currentPage }} de {{ totalPages }}</span>
            <button type="button" @click="goToNextPage" :disabled="loading || !hasNextPage">Próxima</button>
        </div>

        <MemberModal v-if="selectedMember" :name="selectedMember.name" :birthday="selectedMember.birthday"
            @close="closeModal" />
    </section>
</template>

<style scoped>
.error {
    color: #b91c1c
}

.pagination {
    margin-top: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
}

.pagination button {
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    border: 1px solid #d1d5db;
    background-color: #f3f4f6;
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.pagination button:hover:enabled {
    background-color: #e5e7eb;
}

.pagination button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.page-status {
    font-weight: 500;
    color: #374151;
}

.page-size-selector {
    margin-top: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.page-size-selector select {
    padding: 0.25rem 0.75rem;
    border-radius: 0.5rem;
    border: 1px solid #d1d5db;
    background-color: #fff;
}

.empty-state {
    margin-top: 1rem;
    color: #4b5563;
}
</style>
