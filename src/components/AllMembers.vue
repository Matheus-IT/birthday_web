<script setup>
import MemberItem from './MemberItem.vue'
import MemberModal from './MemberModal.vue'
import { apiUrls } from '../api/urls.js'
import { onMounted, ref } from 'vue'


const members = ref([])
const loading = ref(false)
const loadError = ref(null)

onMounted(async () => {
    loading.value = true

    try {
        const storedToken = localStorage.getItem('authToken') || import.meta.env.VITE_API_TOKEN
        const headers = storedToken ? { 'Authorization': `Token ${storedToken}` } : {}
        const res = await fetch(apiUrls.getAllMembers(), { headers })
        console.log('Fetch response:', res);

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`)
        }
        const data = await res.json()
        console.log('Fetched members data:', data);

        const normalized = data.map(member => ({
            id: member.id,
            name: member.name,
            birthday: new Date(member.birth_date + 'T12:00:00'), // the + 12hrs is a simple fix for timezone issues
            phoneNumber: member.phone_number,
            profilePicture: member.profile_picture,
            department: member.department,
            is_birthday_today: member.is_birthday_today,
        }))
        members.value = normalized
    }
    catch (error) {
        loadError.value = 'Erro ao carregar membros'
        console.error(error)
    } finally {
        loading.value = false
    }
})

const selectedMember = ref(null)

function openMember(member) {
    selectedMember.value = member
}

function closeModal() {
    selectedMember.value = null
}

</script>

<template>
    <section>
        <h2>Todos os membros</h2>
        <p v-if="loading">Carregando...</p>
        <p v-if="!loading && loadError" class="error">{{ loadError }}</p>
        <ul>
            <li style="list-style:none" v-for="member in members" :key="member.name">
                <MemberItem :name="member.name" :birthday="member.birthday"
                    :is_birthday_today="member.is_birthday_today" @select="openMember(member)" />
            </li>
        </ul>

        <MemberModal v-if="selectedMember" :name="selectedMember.name" :birthday="selectedMember.birthday"
            @close="closeModal" />
    </section>
</template>

<style scoped>
.error {
    color: #b91c1c
}
</style>
