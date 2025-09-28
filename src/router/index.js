import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView,
            meta: { requiresAuth: true },
        },
        {
            path: '/about',
            name: 'about',
            // route level code-splitting
            // this generates a separate chunk (About.[hash].js) for this route
            // which is lazy-loaded when the route is visited.
            component: () => import('../views/AboutView.vue'),
        },
        {
            path: '/login',
            name: 'login',
            component: () => import('../views/LoginView.vue'),
        }
    ],
})


router.beforeEach((to, from, next) => {
    const isAuthenticated = !!localStorage.getItem('authToken');
    // If the route requires authentication and the user is not authenticated, redirect to the login page
    if (to.meta.requiresAuth && !isAuthenticated) {
        // Avoid redirect loop if we're already going to login
        if (to.name === 'login') return next();
        next({ name: 'login', query: { redirect: to.fullPath } });
    } else {
        next();
    }
})

export default router
