<template>
    <div class="item" @click="emit('select')" @keydown.enter.space.prevent="emit('select')" role="button" tabindex="0">
        <div class="details details-card">
            <div>
                <h3>{{ name }}</h3>
                <p class="birthday-text">{{ formattedBirthday }}</p>
            </div>
            <button type="button" @click.stop="emit('edit')" aria-label="Edit item" class="edit-btn">
                Edit
            </button>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    name: { type: String, required: true },
    birthday: { type: [String, Date], required: true }
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

const formattedBirthday = computed(() =>
    parsedDate.value
        ? parsedDate.value.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        : String(props.birthday)
)
</script>

<style scoped>
.item {
    margin-top: 2rem;
    display: flex;
    position: relative;
    cursor: pointer;
}

.details {
    flex: 1;
    margin-left: 1rem;
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
}

.birthday-text {
    margin: 0;
    opacity: 0.8;
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
        padding: 0.4rem 0 1rem calc(var(--section-gap) / 2);
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
