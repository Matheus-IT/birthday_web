<script setup>
import MemberItem from './MemberItem.vue'
import MemberModal from './MemberModal.vue'
import DocumentationIcon from './icons/IconDocumentation.vue'
import ToolingIcon from './icons/IconTooling.vue'
import EcosystemIcon from './icons/IconEcosystem.vue'
import CommunityIcon from './icons/IconCommunity.vue'
import SupportIcon from './icons/IconSupport.vue'

import { ref } from 'vue'

const members = [
    { name: 'Guilherme', birthday: '1990-01-01' },
    { name: 'Maria', birthday: '1995-05-15' },
    { name: 'João', birthday: '1988-12-30' },
    { name: 'Ana', birthday: '2000-07-22' }
]

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
        <ul>
            <li style="list-style:none" v-for="member in members" :key="member.name">
                <MemberItem :name="member.name" :birthday="member.birthday" @select="openMember(member)" />
            </li>
        </ul>

        <MemberModal v-if="selectedMember" :name="selectedMember.name" :birthday="selectedMember.birthday"
            @close="closeModal" />
    </section>
</template>
