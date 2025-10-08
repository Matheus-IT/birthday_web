<template>
    <div class="modal-backdrop" @click.self="close">
        <div class="modal" role="dialog" aria-modal="true" aria-label="Member details">
            <header class="modal-header">
                <p>Detalhes do membro</p>
                <button class="close-btn" @click="close" aria-label="Close">×</button>
            </header>
            
            <section class="modal-body">
                <p><strong>Nome: </strong>{{ name }}</p>    
                <p><strong>Aniversário: </strong>{{ formattedBirthday }}</p>
                <p v-if="age !== null"><strong>Idade: </strong>{{ age }}</p>
            </section>

            <footer class="modal-footer">
                <button class="close-btn" @click="close">Fechar</button>
                <button class="delete-btn" @click="onDelete">
                    Delete
                </button>
            </footer>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { doFormattingOfBirthday } from '../utils.js'

const props = defineProps({
    id: { type: [String, Number], required: true },
    name: { type: String, required: true },
    birthday: { type: [String, Date], required: true }
})

const emit = defineEmits(['close', 'delete'])

const parsedDate = computed(() => {
    if (props.birthday instanceof Date) return props.birthday
    const d = new Date(props.birthday)
    return isNaN(d.getTime()) ? null : d
})

const formattedBirthday = computed(() => doFormattingOfBirthday(parsedDate.value)
)

const age = computed(() => {
    if (!parsedDate.value) return null
    const now = new Date()
    let a = now.getFullYear() - parsedDate.value.getFullYear()
    const m = now.getMonth() - parsedDate.value.getMonth()
    const d = now.getDate() - parsedDate.value.getDate()
    if (m < 0 || (m === 0 && d < 0)) a--
    return a
})

function close() {
    emit('close')
}
function onDelete() {
    emit('delete', props.id)
}
</script>

<style scoped>
.modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 60;
}

.modal {
    background: var(--color-background);
    color: var(--color-text);
    border-radius: 8px;
    width: min(520px, 95%);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    overflow: hidden;
}

.modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border-bottom: 1px solid var(--color-border);
}

.modal-body {
    padding: 1rem;
}

.modal-footer {
    padding: 1rem;
    text-align: right;
    border-top: 1px solid var(--color-border);
}

.close-btn {

}
</style>
