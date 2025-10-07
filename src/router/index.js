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
            path: '/login',
            name: 'login',
            component: () => import('../views/LoginView.vue'),
        }
    ],
})


router.beforeEach((to, from, next) => {
    const isAuthenticated = !!localStorage.getItem('authToken');
    console.log('Navigation guard: isAuthenticated =', isAuthenticated);
    
    // If the route requires authentication and the user is not authenticated, redirect to the login page
    if (to.meta.requiresAuth && !isAuthenticated) {
        console.log('Navigation guard: redirecting to login');
        // Avoid redirect loop if we're already going to login
        console.log('Navigation guard: current route is', to.name);
        if (to.name === 'login') return next();
        next({ name: 'login', query: { redirect: to.fullPath } });
    } else {
        console.log('Navigation guard: allowing access to', to.fullPath);
        next();
    }
})

export default router
