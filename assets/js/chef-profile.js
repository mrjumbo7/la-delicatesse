// Chef Profile JavaScript

// Global variables
let currentChef = null;
let chefRecipes = [];
let isAuthenticated = false;
let currentUser = null;

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    loadChefData();

    // Add language change listener
    document.getElementById('languageToggle').addEventListener('click', () => {
        loadChefData(); // Reload data when language changes
    });

// Check authentication status
function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');

    if (token && userData) {
        isAuthenticated = true;
        currentUser = JSON.parse(userData);
    }
}

// Load chef data
async function loadChefData() {
    try {
        // Get chef ID from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const chefId = urlParams.get('id');

        if (!chefId) {
            window.location.href = 'index.html';
            return;
        }

        // Get current language
        const currentLang = window.currentLanguage || 'es';

        // Fetch chef data with translations
        const response = await fetch(`api/profile/get_translated.php?chef_id=${chefId}&lang=${currentLang}`);
        const result = await response.json();

        if (result.success) {
            currentChef = result.data;
            displayChefInfo();
            loadChefRecipes();
            updateFavoriteButton();
        } else {
            showToast('Error al cargar la información del chef', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al cargar la información del chef', 'error');
    }
}

// Display chef information
function displayChefInfo() {
    const profile = currentChef.profile;
    document.title = `${profile.nombre} - La Délicatesse`;
    document.getElementById('chefImage').src = profile.foto_perfil || '/placeholder.svg';
    document.getElementById('chefName').textContent = profile.nombre;
    document.getElementById('chefSpecialty').textContent = profile.especialidad;
    document.getElementById('chefBio').textContent = profile.biografia;
    document.getElementById('chefExperience').textContent = `${profile.experiencia_anos} ${window.currentLanguage === 'es' ? 'años de experiencia' : 'years of experience'}`;
    document.getElementById('chefRating').textContent = profile.calificacion_promedio;
    document.getElementById('chefTotalServices').textContent = `${profile.servicios_realizados || 0} ${window.currentLanguage === 'es' ? 'servicios realizados' : 'services completed'}`;

    // Display stars
    const starsContainer = document.getElementById('chefStars');
    starsContainer.innerHTML = generateStars(currentChef.calificacion);

    // Setup buttons
    const bookChefBtn = document.getElementById('bookChefBtn');
    bookChefBtn.onclick = () => bookChef(currentChef.id);

    const favoriteBtn = document.getElementById('favoriteBtn');
    favoriteBtn.onclick = () => toggleFavorite(currentChef.id);
}

// Load chef's recipes
async function loadChefRecipes() {
    try {
        const response = await fetch(`api/recipes/list.php?chef_id=${currentChef.id}`);
        const result = await response.json();

        if (result.success) {
            chefRecipes = result.data;
            displayChefRecipes();
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al cargar las recetas', 'error');
    }
}

// Display chef's recipes
function displayChefRecipes() {
    const recipesContainer = document.getElementById('chefRecipes');

    if (chefRecipes.length === 0) {
        recipesContainer.innerHTML = '<p class="text-center col-span-full" style="color: var(--text-light);">Este chef aún no ha publicado recetas.</p>';
        return;
    }

    recipesContainer.innerHTML = chefRecipes.map(recipe => `
        <div class="recipe-card">
            <div class="recipe-image">
                <img src="${recipe.imagen || '/placeholder.svg?height=200&width=300'}" 
                     alt="${recipe.nombre}">
            </div>
            <div class="recipe-info p-4">
                <h3 class="font-semibold mb-2" style="color: var(--primary-color); font-family: var(--font-heading);">${recipe.nombre}</h3>
                <p class="text-sm mb-3" style="color: var(--text-light);">${recipe.descripcion_corta}</p>
                <div class="flex justify-between items-center">
                    <div class="flex items-center">
                        <span class="text-sm mr-2" style="color: var(--text-light);">Dificultad:</span>
                        <span class="text-sm font-medium" style="color: var(--primary-color);">${recipe.dificultad}</span>
                    </div>
                    <span class="text-sm" style="color: var(--text-light);">${recipe.tiempo_preparacion} min</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Toggle favorite status
async function toggleFavorite(chefId) {
    if (!isAuthenticated) {
        showToast('Debes iniciar sesión para agregar favoritos', 'warning');
        return;
    }

    try {
        const response = await fetch('api/client/favorites.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ chef_id: chefId })
        });

        const result = await response.json();

        if (result.success) {
            updateFavoriteButton();
            showToast(result.message, 'success');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al actualizar favoritos', 'error');
    }
}

// Update favorite button state
async function updateFavoriteButton() {
    if (!isAuthenticated) return;

    try {
        const response = await fetch('api/client/favorites.php', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        const result = await response.json();

        if (result.success) {
            const isFavorite = result.data.some(fav => fav.id === currentChef.id);
            const favoriteBtn = document.getElementById('favoriteBtn');
            
            if (isFavorite) {
                favoriteBtn.classList.add('active');
                favoriteBtn.textContent = '❤️ Quitar de Favoritos';
            } else {
                favoriteBtn.classList.remove('active');
                favoriteBtn.textContent = '❤️ Agregar a Favoritos';
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Book chef function
function bookChef(chefId) {
    if (!isAuthenticated) {
        showToast('Debes iniciar sesión para hacer una reserva', 'warning');
        return;
    }
    window.location.href = `index.html#booking?chef=${chefId}`;
}

// Generate star rating
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = '★'.repeat(fullStars);
    if (hasHalfStar) stars += '½';
    return stars;
}

// Show toast notification
function showToast(message, type = 'info') {
    // Implement your toast notification system here
    alert(message);
}
});