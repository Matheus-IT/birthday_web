<template>
    <div class="modal-backdrop" @click.self="close">
        <div class="modal" role="dialog" aria-modal="true" aria-label="Detalhes do membro">
            <header class="modal-header">
                <h3 class="modal-title">Detalhes do membro</h3>
                <button class="icon-btn" type="button" @click="close" aria-label="Fechar modal">
                    ×
                </button>
            </header>

            <section class="modal-body">
                <template v-if="!isConfirmingDeletion">
                    <ul class="detail-list">
                        <li>
                            <span class="detail-label">Nome</span>
                            <span class="detail-value">{{ name }}</span>
                        </li>
                        <li>
                            <span class="detail-label">Nascimento</span>
                            <span class="detail-value">{{ formattedBirthday }}</span>
                        </li>
                        <li v-if="age !== null">
                            <span class="detail-label">Idade</span>
                            <span class="detail-value">{{ age }}</span>
                        </li>
                    </ul>
                </template>
                <div v-else class="confirm-delete">
                    <h4 class="confirm-title">Confirmar exclusão</h4>
                    <p class="confirm-text">
                        Tem certeza de que deseja excluir <strong>{{ name }}</strong>? Esta ação não pode ser desfeita.
                    </p>
                </div>
            </section>

            <footer class="modal-footer" v-if="!isConfirmingDeletion">
                <button class="action-btn action-btn--ghost" type="button" @click="close">
                    Fechar
                </button>
                <button class="action-btn action-btn--danger" type="button" @click="startDeleteConfirmation">
                    Excluir
                </button>
            </footer>
            <footer class="modal-footer" v-else>
                <button class="action-btn action-btn--ghost" type="button" @click="cancelDelete">
                    Cancelar
                </button>
                <button class="action-btn action-btn--danger action-btn--danger-solid" type="button" @click="confirmDelete">
                    Confirmar exclusão
                </button>
            </footer>
        </div>
    </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { doFormattingOfBirthday } from '../utils.js'

const props = defineProps({
    id: { type: [String, Number], required: true },
    name: { type: String, required: true },
    birthday: { type: [String, Date], required: true }
})

const emit = defineEmits(['close', 'delete'])

const isConfirmingDeletion = ref(false)

const parsedDate = computed(() => {
    if (props.birthday instanceof Date) return props.birthday
    const d = new Date(props.birthday)
    return isNaN(d.getTime()) ? null : d
})

const formattedBirthday = computed(() => doFormattingOfBirthday(parsedDate.value))

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
    isConfirmingDeletion.value = false
    emit('close')
}
function startDeleteConfirmation() {
    isConfirmingDeletion.value = true
}
function cancelDelete() {
    isConfirmingDeletion.value = false
}
function confirmDelete() {
    emit('delete', props.id)
    isConfirmingDeletion.value = false
}

watch(
    () => props.id,
    () => {
        isConfirmingDeletion.value = false
    }
)
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
    padding: 1rem 1.25rem;
    border-bottom: 1px solid var(--color-border);
}

.modal-body {
    padding: 1.25rem;
}

.modal-footer {
    padding: 1rem 1.25rem 1.25rem;
    border-top: 1px solid var(--color-border);
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
}

.modal-title {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
}

.icon-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: none;
    background: rgba(99, 102, 241, 0.12);
    color: var(--color-heading);
    font-size: 1.25rem;
    line-height: 1;
    cursor: pointer;
    transition: background-color 0.2s ease, transform 0.2s ease;
}

.icon-btn:hover,
.icon-btn:focus-visible {
    background: rgba(99, 102, 241, 0.22);
    transform: scale(1.05);
    outline: none;
}

.detail-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
}

.detail-list li {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding-bottom: 0.85rem;
    border-bottom: 1px solid var(--color-border);
}

.detail-list li:last-of-type {
    border-bottom: none;
    padding-bottom: 0;
}

.detail-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #9ca3af;
    font-weight: 600;
}

.detail-value {
    font-size: 0.98rem;
    font-weight: 500;
}

.action-btn {
    border-radius: 8px;
    padding: 0.55rem 1.1rem;
    font-weight: 600;
    border: 1px solid transparent;
    cursor: pointer;
    transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}

.action-btn:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25);
}

.action-btn--ghost {
    background: transparent;
    color: var(--color-text);
    border-color: var(--color-border);
}

.action-btn--ghost:hover {
    background: var(--color-background-soft);
}

.action-btn--danger {
    background: #dc2626;
    color: #fff;
}

.action-btn--danger:hover {
    background: #b91c1c;
}

.action-btn--danger-solid {
    border-color: #dc2626;
}

.confirm-delete {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.5rem 0;
}

.confirm-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #dc2626;
}

.confirm-text {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.5;
}
</style>
