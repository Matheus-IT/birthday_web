<template>
    <div class="item" @click="emit('select')" @keydown.enter.space.prevent="emit('select')" role="button" tabindex="0"
        :aria-label="itemAriaLabel">
        <div class="details details-card" :class="{ 'details-card--birthday': isBirthdayToday }">
            <div class="details-primary">
                <h3>{{ name }}</h3>
                <p class="birthday-text">{{ formattedBirthday }}</p>
                <p v-if="isBirthdayToday" class="birthday-today-text">
                    🎉 É o seu aniversário hoje!
                </p>
            </div>
            <div class="details-actions">
                <button type="button" @click.stop="emit('edit')" aria-label="Edit item" class="edit-btn">
                    Editar
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    name: { type: String, required: true },
    birthday: { type: [String, Date], required: true },
    isBirthdayToday: { type: Boolean, required: true },
})

const emit = defineEmits(['edit', 'select'])

const parsedDate = computed(() => {
    if (props.birthday instanceof Date) return props.birthday
    const d = new Date(props.birthday)
    return isNaN(d.getTime()) ? null : d
})

const day = computed(() =>
    parsedDate.value ? String(parsedDate.value.getDate()).padStart(2, '0') : '--'
)

const monthShort = computed(() =>
    parsedDate.value ? parsedDate.value.toLocaleString(undefined, { month: 'short' }) : ''
)

const formattedBirthday = computed(() => {
    // If we have a valid Date, format it as dd/mm/yyyy (zero-padded)
    if (parsedDate.value) {
        const d = parsedDate.value
        const day = String(d.getDate()).padStart(2, '0')
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const year = d.getFullYear()
        return `${day}/${month}/${year}`
    }

    // If the value wasn't parsed, try to reformat known string patterns into dd/mm/yyyy
    if (typeof props.birthday === 'string') {
        // yyyy-mm-dd -> dd/mm/yyyy
        const ymd = props.birthday.match(/^(\d{4})-(\d{2})-(\d{2})$/)
        if (ymd) return `${ymd[3]}/${ymd[2]}/${ymd[1]}`

        // dd/mm/yyyy -> dd/mm/yyyy (already desired)
        const dmy = props.birthday.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
        if (dmy) return `${dmy[1]}/${dmy[2]}/${dmy[3]}`
    }

    // Fallback when the input cannot be parsed
    return '--/--/----'
})

const isBirthdayToday = computed(() => Boolean(props.isBirthdayToday))

const itemAriaLabel = computed(() => {
    const baseLabel = `${props.name}'s birthday`
    return isBirthdayToday.value
        ? `${baseLabel} is today`
        : `${baseLabel} is on ${formattedBirthday.value}`
})
</script>

<style scoped>
.item {
    display: flex;
    position: relative;
    cursor: pointer;
}

.details-card {
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 0.75rem 1rem;
    background: var(--color-background);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    position: relative;
    width: 100%;
    transition:
        border-color 0.3s ease,
        background-color 0.3s ease,
        box-shadow 0.3s ease;
}

.birthday-text {
    margin: 0;
    opacity: 0.8;
}

.birthday-today-text {
    margin: 0;
    font-size: 0.9rem;
    color: rgb(5, 119, 81);
    font-weight: 500;
}

.details-primary {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.details-actions {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.5rem;
}

.details-card--birthday {
    border-color: hsla(160, 100%, 37%, 0.6);
    background: rgba(22, 199, 154, 0.12);
    box-shadow: 0 8px 20px rgba(22, 199, 154, 0.18);
}

.details-card--birthday::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    border-left: 4px solid hsla(160, 100%, 37%, 1);
    pointer-events: none;
}

.birthday-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.25rem 0.75rem;
    border-radius: 999px;
    background: hsla(160, 100%, 37%, 1);
    color: white;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    box-shadow: 0 4px 10px rgba(22, 199, 154, 0.25);
}

.edit-btn {
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text);
    padding: 0.35rem 0.75rem;
    border-radius: 6px;
    cursor: pointer;
}

i {
    display: flex;
    place-items: center;
    place-content: center;
    width: 32px;
    height: 32px;
    color: var(--color-text);
}

h3 {
    font-size: 1.2rem;
    font-weight: 500;
    margin-bottom: 0.4rem;
    color: var(--color-heading);
}

@media (min-width: 1024px) {
    .item {
        margin-top: 0;
    }

    i {
        top: calc(50% - 25px);
        left: -26px;
        position: absolute;
        border: 1px solid var(--color-border);
        background: var(--color-background);
        border-radius: 8px;
        width: 50px;
        height: 50px;
    }

    .item:before {
        content: ' ';
        border-left: 1px solid var(--color-border);
        position: absolute;
        left: 0;
        bottom: calc(50% + 25px);
        height: calc(50% - 25px);
    }

    .item:after {
        content: ' ';
        border-left: 1px solid var(--color-border);
        position: absolute;
        left: 0;
        top: calc(50% + 25px);
        height: calc(50% - 25px);
    }

    .item:first-of-type:before {
        display: none;
    }

    .item:last-of-type:after {
        display: none;
    }
}
</style>
