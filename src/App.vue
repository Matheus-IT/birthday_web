<script setup>
import { RouterView } from 'vue-router'

</script>

<template>
    <header>
        <img alt="Logo" class="logo" src="@/assets/birthday_reminder_logo.png" width="125" height="125" />
    </header>

    <RouterView />
</template>

<style scoped>
header {
    line-height: 1.5;
    max-height: 100vh;
}

.logo {
    display: block;
    margin: 0 auto 1rem;
}

@media (min-width: 1024px) {
    /* Keep the logo centered on desktop for a tighter connection with page content */
    .logo {
        margin: 0 auto 1rem;
    }
}
</style>
