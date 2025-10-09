<template>
    <div class="modal-backdrop" @click.self="closeModal">
        <div class="modal" role="dialog" aria-modal="true" aria-label="Editar membro">
            <header class="modal-header">
                <h3 class="modal-title">Editar membro</h3>
                <button class="icon-btn" type="button" @click="closeModal" aria-label="Fechar modal">
                    ×
                </button>
            </header>

            <form class="modal-form" @submit.prevent="handleSubmit" novalidate>
                <div class="form-grid">
                    <label class="form-field">
                        <span>Nome completo *</span>
                        <input
                            v-model="form.name"
                            type="text"
                            name="name"
                            autocomplete="name"
                            required
                            :disabled="submitting"
                        />
                        <small v-if="fieldErrors.name" class="field-error" role="alert">{{ fieldErrors.name }}</small>
                    </label>

                    <label class="form-field">
                        <span>Data de nascimento *</span>
                        <input
                            v-model="form.birthDate"
                            type="date"
                            name="birth_date"
                            required
                            :disabled="submitting"
                        />
                        <small v-if="fieldErrors.birthDate" class="field-error" role="alert">{{ fieldErrors.birthDate }}</small>
                    </label>
                </div>

                <p v-if="submitError" class="submit-error" role="alert">{{ submitError }}</p>

                <footer class="modal-footer">
                    <button type="button" class="action-btn action-btn--ghost" @click="closeModal" :disabled="submitting">
                        Cancelar
                    </button>
                    <button type="submit" class="action-btn action-btn--primary" :disabled="isSubmitDisabled">
                        {{ submitting ? 'Salvando...' : 'Salvar alterações' }}
                    </button>
                </footer>
            </form>
        </div>
    </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { apiUrls } from '../api/urls.js'
import { toBirthdayDate } from '../utils.js'

const props = defineProps({
    member: {
        type: Object,
        required: true,
        validator: (value) => value && 'id' in value,
    },
})

const emit = defineEmits(['close', 'updated'])

const router = useRouter()

const form = reactive({
    name: '',
    birthDate: '',
})

const submitting = ref(false)
const submitError = ref(null)
const fieldErrors = reactive({
    name: null,
    birthDate: null,
})

const isSubmitDisabled = computed(() => {
    const hasRequiredFields = form.name.trim() !== '' && form.birthDate !== ''
    return submitting.value || !hasRequiredFields
})

watch(
    () => props.member,
    (member) => {
        if (!member) return

        form.name = member.name ?? ''
        const normalizedDate = normalizeToInputDate(member.birthday)
        form.birthDate = normalizedDate ?? ''
    },
    { immediate: true }
)

function normalizeToInputDate(rawDate) {
    if (!rawDate) return null

    if (typeof rawDate === 'string') {
        if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
            return rawDate
        }
        const parsed = toBirthdayDate(rawDate)
        if (!parsed) return null
        return parsed.toISOString().slice(0, 10)
    }

    if (rawDate instanceof Date) {
        if (Number.isNaN(rawDate.getTime())) return null
        return rawDate.toISOString().slice(0, 10)
    }

    return null
}

function resetFieldErrors() {
    Object.keys(fieldErrors).forEach((key) => {
        fieldErrors[key] = null
    })
}

function populateFieldErrors(payload) {
    if (!payload || typeof payload !== 'object') {
        return
    }

    const fieldMap = {
        name: 'name',
        birth_date: 'birthDate',
    }

    Object.entries(fieldMap).forEach(([apiField, localField]) => {
        const messages = payload[apiField]
        if (Array.isArray(messages) && messages.length) {
            fieldErrors[localField] = messages.join(' ')
        }
    })

    if (Array.isArray(payload.non_field_errors) && payload.non_field_errors.length) {
        submitError.value = payload.non_field_errors.join(' ')
    }
}

function closeModal() {
    emit('close')
}

async function handleSubmit() {
    if (isSubmitDisabled.value) {
        return
    }

    submitting.value = true
    submitError.value = null
    resetFieldErrors()

    const payload = {
        name: form.name.trim(),
        birth_date: form.birthDate || null,
    }

    const headers = {
        'Content-Type': 'application/json',
    }

    const storedToken = localStorage.getItem('authToken')
    if (storedToken) {
        headers.Authorization = `Token ${storedToken}`
    }

    try {
        const response = await fetch(apiUrls.updateMember(props.member.id), {
            method: 'PATCH',
            headers,
            body: JSON.stringify(payload),
        })

        if (response.status === 401) {
            localStorage.removeItem('authToken')
            await router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } })
            return
        }

        if (!response.ok) {
            let errorPayload = null
            try {
                errorPayload = await response.json()
            } catch (error) {
                console.error('Failed to parse error payload', error)
            }

            populateFieldErrors(errorPayload)
            if (!submitError.value) {
                submitError.value = 'Não foi possível atualizar o membro. Verifique os campos e tente novamente.'
            }
            return
        }

        let updatedMember = null
        if (response.status !== 204) {
            try {
                updatedMember = await response.json()
            } catch (error) {
                console.warn('Update succeeded but response body could not be parsed.', error)
            }
        }

        emit('updated', {
            id: props.member.id,
            name: payload.name,
            birthday: payload.birth_date,
            raw: updatedMember,
        })
        closeModal()
    } catch (error) {
        submitError.value = 'Ocorreu um erro inesperado. Tente novamente mais tarde.'
        console.error('Failed to update member', error)
    } finally {
        submitting.value = false
    }
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
    z-index: 70;
}

.modal {
    background: var(--color-background);
    color: var(--color-text);
    border-radius: 16px;
    width: min(640px, 95%);
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.2);
    overflow: hidden;
}

.modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--color-border);
}

.modal-title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
}

.icon-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background: rgba(99, 102, 241, 0.12);
    color: var(--color-heading);
    font-size: 1.5rem;
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

.modal-form {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.form-grid {
    display: grid;
    gap: 1.25rem;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.form-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-field span {
    font-weight: 600;
    color: #374151;
}

.form-field input {
    height: 42px;
    border-radius: 10px;
    border: 1px solid var(--color-border);
    padding: 0 0.75rem;
    background: var(--color-background);
    color: var(--color-text);
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-field input:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25);
}

.field-error {
    color: #b91c1c;
}

.submit-error {
    color: #b91c1c;
    font-weight: 600;
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
}

.action-btn {
    min-width: 140px;
    height: 44px;
    border-radius: 10px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease, background-color 0.2s ease;
}

.action-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}

.action-btn--ghost {
    border: 1px solid var(--color-border);
    background: var(--color-background);
    color: var(--color-text);
}

.action-btn--primary {
    border: none;
    background: linear-gradient(135deg, #6366f1 0%, #4338ca 100%);
    color: #fff;
    box-shadow: 0 15px 30px -20px rgba(79, 70, 229, 0.8);
}

.action-btn--primary:hover:enabled {
    transform: translateY(-1px);
}

@media (max-width: 640px) {
    .modal-form {
        padding: 1.25rem;
    }

    .modal-footer {
        flex-direction: column-reverse;
    }

    .action-btn {
        width: 100%;
    }
}
</style>
