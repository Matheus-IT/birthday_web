<script setup>
import { apiUrls } from '@/api/urls'
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

function redirectAfterLogin() {
    const redirect = typeof route.query.redirect === 'string' && route.query.redirect
        ? route.query.redirect
        : '/'
    router.replace(redirect)
}

onMounted(() => {
    // If already authenticated, go to intended page/home
    const existing = localStorage.getItem('authToken')
    if (existing) {
        redirectAfterLogin()
    }
})

async function onSubmit(e) {
    e.preventDefault()
    error.value = ''


    let token = '';

    const res = await fetch(apiUrls.login(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: email.value,
            password: password.value,
        }),
    })

    try {
        loading.value = true
        console.log('Response login:', res);

        const data = await res.json()
        console.log('Login data:', data);

        if (!res.ok) {
            throw new Error(data.error || `Login failed: ${res.status}`)
        }

        token = data.token
        // Basic client-side login: store the token for the router guard and API calls
        localStorage.setItem('authToken', token)
        redirectAfterLogin()
    } catch (err) {
        console.error(err)
        error.value = err.message || 'Login failed.'
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <main class="login-page">
        <section class="card">
            <h1>Login</h1>
            <p class="hint">Paste your API token to continue.</p>
            <form @submit="onSubmit">
                <label for="email">Email</label>
                <input type="text" v-model="email" placeholder="e.g. user@example.com">

                <label for="password">Password</label>
                <input id="password" name="password" type="password" v-model="password" placeholder="e.g. abc123..."
                    autocomplete="off" required />

                <button type="submit" :disabled="loading">
                    {{ loading ? 'Logging in…' : 'Login' }}
                </button>

                <p v-if="error" class="error">{{ error }}</p>
            </form>
        </section>
    </main>

</template>

<style scoped>
.login-page {
    min-height: 70vh;
    display: grid;
    place-items: center;
    padding: 2rem;
}

.card {
    width: 100%;
    max-width: 420px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 12px;
    padding: 1.5rem;
    background: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

form {
    display: grid;
    gap: 0.75rem;
}

label {
    font-weight: 600;
}

input {
    padding: 0.6rem 0.8rem;
    border: 1px solid #d0d7de;
    border-radius: 8px;
    font-size: 0.95rem;
}

button {
    margin-top: 0.25rem;
    padding: 0.6rem 0.9rem;
    border-radius: 8px;
    border: 1px solid transparent;
    background: #3b82f6;
    color: white;
    font-weight: 600;
    cursor: pointer;
}

button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.hint {
    color: #6b7280;
    margin: 0.25rem 0 1rem 0;
}

.error {
    color: #b91c1c;
}
</style>
