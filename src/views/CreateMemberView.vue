<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { apiUrls } from '../api/urls.js'

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

function goBackToList() {
    router.back()
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
        const response = await fetch(apiUrls.postNewMember(), {
            method: 'POST',
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
                submitError.value = 'Não foi possível criar o membro. Verifique os campos e tente novamente.'
            }
            return
        }

        await router.push({ name: 'home' })
    } catch (error) {
        submitError.value = 'Ocorreu um erro inesperado. Tente novamente mais tarde.'
        console.error('Failed to create member', error)
    } finally {
        submitting.value = false
    }
}
</script>

<template>
    <main class="create-member-wrapper">
        <section class="create-member-card">
            <header>
                <h1>Criar novo membro</h1>
                <p class="subtitle">Preencha os campos abaixo para adicionar alguém à lista de aniversariantes.</p>
            </header>

            <form class="create-member-form" @submit.prevent="handleSubmit" novalidate>
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

                <div class="form-actions">
                    <button type="button" class="secondary" @click="goBackToList" :disabled="submitting">
                        Cancelar
                    </button>
                    <button type="submit" class="primary" :disabled="isSubmitDisabled">
                        {{ submitting ? 'Salvando...' : 'Salvar membro' }}
                    </button>
                </div>
            </form>
        </section>
    </main>
</template>

<style scoped>
.create-member-wrapper {
    display: flex;
    justify-content: center;
    padding: 2rem 1rem;
}

.create-member-card {
    width: min(720px, 100%);
    background: var(--color-background-soft);
    border: 1px solid var(--color-border);
    border-radius: 16px;
    padding: 2rem;
    box-shadow: 0 20px 40px -24px rgba(79, 70, 229, 0.5);
}

.create-member-card header {
    margin-bottom: 2rem;
}

.create-member-card h1 {
    font-size: 1.75rem;
    margin-bottom: 0.5rem;
}

.subtitle {
    color: #6b7280;
}

.create-member-form {
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

.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
}

.form-actions button {
    min-width: 140px;
    height: 44px;
    border-radius: 10px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease, background-color 0.2s ease;
}

.form-actions .primary {
    border: none;
    background: linear-gradient(135deg, #6366f1 0%, #4338ca 100%);
    color: #fff;
    box-shadow: 0 15px 30px -20px rgba(79, 70, 229, 0.8);
}

.form-actions .primary:hover:enabled {
    transform: translateY(-1px);
}

.form-actions .secondary {
    border: 1px solid var(--color-border);
    background: var(--color-background);
    color: var(--color-text);
}

.form-actions button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}

@media (max-width: 640px) {
    .create-member-card {
        padding: 1.5rem;
    }

    .form-actions {
        flex-direction: column-reverse;
    }

    .form-actions button {
        width: 100%;
    }
}
</style>
