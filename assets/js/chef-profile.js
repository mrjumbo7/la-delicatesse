// Chef Profile JavaScript

// Global variables
let currentChef = null;
let chefRecipes = [];
let isAuthenticated = false;
// currentUser is declared globally in main.js

// Check authentication status
function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');

    if (token && userData) {
        try {
            isAuthenticated = true;
            currentUser = JSON.parse(userData);
            
            // Actualizar UI para usuario autenticado
            const authButtons = document.getElementById('authButtons');
            if (authButtons) {
                const userInitials = currentUser.nombre.split(' ').map(n => n[0]).join('').toUpperCase();
                const profileImage = currentUser.foto_perfil || null;
                
                authButtons.innerHTML = `
                    <div class="user-profile-section">
                        <div class="user-avatar">
                            ${profileImage ? 
                                `<img src="${profileImage}" alt="${currentUser.nombre}" />` : 
                                `<div class="user-avatar-placeholder">${userInitials}</div>`
                            }
                        </div>
                        <div class="user-menu">
                            <button class="user-menu-button">
                                <div class="user-info">
                                    <span class="user-name">${currentUser.nombre.split(' ')[0]}</span>
                                    <span class="user-role">${currentUser.tipo_usuario === 'chef' ? 'Chef' : 'Cliente'}</span>
                                </div>
                                <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                                </svg>
                            </button>
                            <div class="user-menu-dropdown">
                                <a href="user-profile.html">Mi Perfil</a>
                                ${currentUser.tipo_usuario === 'chef' ? '<a href="dashboard.html">Dashboard</a>' : ''}
                                <a href="#" onclick="handleLogout()">Cerrar Sesión</a>
                            </div>
                        </div>
                    </div>
                `;
            }
            console.log('Usuario autenticado:', currentUser.nombre);
        } catch (error) {
            console.error('Error al procesar datos de usuario:', error);
            isAuthenticated = false;
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
        }
    } else {
        console.log('Usuario no autenticado');
        isAuthenticated = false;
        // No redirigimos, solo mostramos el mensaje de que debe iniciar sesión
        // window.location.href = 'index.html';
    }
}

// Load chef data
async function loadChefData() {
    try {
        // Get chef ID from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const chefId = urlParams.get('id');

        if (!chefId) {
            console.error('Error: No se proporcionó ID del chef en la URL');
            showToast('Error: No se proporcionó ID del chef', 'error');
            window.location.href = 'index.html';
            return;
        }

        console.log('Cargando datos del chef con ID:', chefId);

        // Get current language
        const currentLang = window.currentLanguage || 'es';
        console.log('Idioma actual:', currentLang);

        // Fetch complete chef data with translations
        const apiUrl = `api/chefs/profile-complete.php?chef_id=${chefId}&lang=${currentLang}`;
        console.log('Consultando API:', apiUrl);
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('Respuesta de la API:', result);

        if (result.success) {
            currentChef = result.data;
            console.log('Datos del chef cargados correctamente:', currentChef);
            
            // Verificar que los datos del chef tengan la estructura correcta
            if (!currentChef || !currentChef.profile) {
                console.error('Error: Estructura de datos del chef incompleta:', currentChef);
                showToast('Error: Datos del chef incompletos', 'error');
                return;
            }
            
            // El ID está en currentChef.id, no en currentChef.profile.id
            if (!currentChef.id) {
                console.error('Error: ID del chef no encontrado:', currentChef);
                showToast('Error: ID del chef no encontrado', 'error');
                return;
            }
            
            displayChefInfo();
            displayChefStats();
            displayChefReviews();
            displayChefRecipes();
            displayRecentServices();
            
            // Solo actualizar el botón de favoritos si el usuario está autenticado y los datos están completos
            if (isAuthenticated && currentChef.id) {
                console.log('Actualizando botón de favoritos para chef ID:', currentChef.id);
                updateFavoriteButton();
            }
        } else {
            console.error('Error en la respuesta de la API:', result.message || 'Error desconocido');
            showToast(`Error al cargar la información del chef: ${result.message || 'Error desconocido'}`, 'error');
        }
    } catch (error) {
        console.error('Error al cargar datos del chef:', error);
        showToast(`Error al cargar la información del chef: ${error.message}`, 'error');
    }
}

// Display chef information
function displayChefInfo() {
    if (!currentChef || !currentChef.profile) {
        console.error('Error: currentChef or currentChef.profile is undefined');
        showToast('Error al cargar la información del chef', 'error');
        return;
    }
    
    try {
        const profile = currentChef.profile;
        const stats = currentChef.estadisticas;
        
        document.title = `${profile.nombre} - La Délicatesse`;
        document.getElementById('chefImage').src = profile.foto_perfil || '/placeholder.svg';
        document.getElementById('chefName').textContent = profile.nombre;
        document.getElementById('chefSpecialty').textContent = profile.especialidad;
        document.getElementById('chefBio').textContent = profile.biografia;
        document.getElementById('chefExperience').textContent = `${profile.experiencia_anos} ${window.currentLanguage === 'es' ? 'años de experiencia' : 'years of experience'}`;
        document.getElementById('chefRating').textContent = stats.calificacion_promedio || '0.0';
        document.getElementById('chefTotalServices').textContent = `${stats.servicios_completados || 0} ${window.currentLanguage === 'es' ? 'servicios completados' : 'services completed'}`;

        // Display stars
        const starsContainer = document.getElementById('chefStars');
        starsContainer.innerHTML = generateStars(stats.calificacion_promedio);

        // Setup buttons
        const bookChefBtn = document.getElementById('bookChefBtn');
        bookChefBtn.onclick = () => bookChef(currentChef.id);
        
        // Cambiar el texto del botón de reserva si el usuario no está autenticado
        if (!isAuthenticated) {
            bookChefBtn.textContent = window.currentLanguage === 'es' ? 'Iniciar sesión para reservar' : 'Login to book';
        } else {
            bookChefBtn.textContent = window.currentLanguage === 'es' ? 'Reservar Chef' : 'Book Chef';
        }

        const favoriteBtn = document.getElementById('favoriteBtn');
        if (favoriteBtn) {
            favoriteBtn.onclick = () => {
                console.log('Botón de favoritos clickeado, ID del chef:', currentChef.id);
                toggleFavorite(currentChef.id);
            };
        }
        
        // Cambiar el texto del botón de favoritos si el usuario no está autenticado
        if (!isAuthenticated) {
            favoriteBtn.textContent = '❤️ ' + (window.currentLanguage === 'es' ? 'Iniciar sesión para agregar' : 'Login to add favorite');
        }
    } catch (error) {
        console.error('Error en displayChefInfo:', error);
        showToast('Error al mostrar la información del chef', 'error');
    }
}

// Display chef statistics
function displayChefStats() {
    if (!currentChef || !currentChef.estadisticas) {
        console.error('Error: No hay estadísticas del chef');
        return;
    }
    
    try {
        const stats = currentChef.estadisticas;
        
        // Verificar si ya existe el contenedor de estadísticas y eliminarlo
        const existingStats = document.querySelector('.chef-stats-container');
        if (existingStats) {
            existingStats.remove();
        }
        
        // Obtener traducciones según el idioma actual
        const currentLang = window.currentLanguage || 'es';
        const serviciosTotalesText = currentLang === 'es' ? 'Servicios Totales' : 'Total Services';
        const completadosText = currentLang === 'es' ? 'Completados' : 'Completed';
        const reviewsText = currentLang === 'es' ? 'Reviews' : 'Reviews';
        const tasaExitoText = currentLang === 'es' ? 'Tasa Éxito' : 'Success Rate';
        
        // Actualizar estadísticas en la información del chef
        const statsHtml = `
            <div class="chef-stats-container grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 p-4 rounded-lg" style="background-color: var(--bg-light);">
                <div class="text-center">
                    <div class="text-2xl font-bold" style="color: var(--primary-color);">${stats.total_servicios}</div>
                    <div class="text-sm" style="color: var(--text-light);">${serviciosTotalesText}</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold" style="color: var(--primary-color);">${stats.servicios_completados}</div>
                    <div class="text-sm" style="color: var(--text-light);">${completadosText}</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold" style="color: var(--primary-color);">${stats.total_reviews}</div>
                    <div class="text-sm" style="color: var(--text-light);">${reviewsText}</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold" style="color: var(--primary-color);">${stats.tasa_completacion}%</div>
                    <div class="text-sm" style="color: var(--text-light);">${tasaExitoText}</div>
                </div>
            </div>
        `;
        
        // Insertar después de la biografía
        const bioElement = document.getElementById('chefBio').parentElement;
        bioElement.insertAdjacentHTML('afterend', statsHtml);
        
    } catch (error) {
        console.error('Error al mostrar estadísticas:', error);
    }
}

// Display chef's recipes
function displayChefRecipes() {
    try {
        console.log('Iniciando displayChefRecipes');
        const recipesContainer = document.getElementById('chefRecipes');
        
        if (!recipesContainer) {
            console.error('Error: Contenedor de recetas no encontrado en el DOM');
            return;
        }
        
        // Verificar si el usuario está autenticado
        if (!isAuthenticated) {
            console.log('Usuario no autenticado, no se mostrarán las recetas');
            recipesContainer.innerHTML = `
                <div class="text-center col-span-full py-8">
                    <p class="mb-4" style="color: var(--text-light);">Debes iniciar sesión para ver las recetas de este chef.</p>
                    <button class="btn btn-primary login-to-view-recipes">Iniciar Sesión</button>
                </div>
            `;
            return;
        }
        
        const recipes = currentChef.recetas || [];
        console.log(`Se encontraron ${recipes.length} recetas:`, recipes);

        if (recipes.length === 0) {
            console.log('No hay recetas para mostrar');
            recipesContainer.innerHTML = '<p class="text-center col-span-full" style="color: var(--text-light);">Este chef aún no ha publicado recetas.</p>';
            return;
        }
        
        let recipeHtml = '';
        
        recipes.forEach((recipe, index) => {
            console.log(`Procesando receta ${index+1}/${recipes.length}:`, recipe);
            
            if (!recipe || !recipe.nombre) {
                console.warn(`Receta ${index+1} inválida:`, recipe);
                return;
            }
            
            const recipeCard = `
                <div class="recipe-card bg-white rounded-lg overflow-hidden" style="box-shadow: var(--shadow);">
                    <div class="recipe-image">
                        <img src="${recipe.imagen || '/placeholder.svg?height=200&width=300'}" 
                             alt="${recipe.nombre}" class="w-full h-48 object-cover">
                    </div>
                    <div class="recipe-info p-4">
                        <h3 class="font-semibold mb-2" style="color: var(--primary-color); font-family: var(--font-heading);">${recipe.nombre}</h3>
                        <p class="text-sm mb-3" style="color: var(--text-light);">${recipe.descripcion_corta || 'Sin descripción'}</p>
                        <div class="flex justify-between items-center mb-2">
                            <div class="flex items-center">
                                <span class="text-sm mr-2" style="color: var(--text-light);">Dificultad:</span>
                                <span class="text-sm font-medium" style="color: var(--primary-color);">${recipe.dificultad || 'N/A'}</span>
                            </div>
                            <span class="text-sm" style="color: var(--text-light);">${recipe.tiempo_preparacion || '0'} min</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-lg font-bold" style="color: var(--primary-color);">$${recipe.precio || '0'}</span>
                            <button class="btn btn-sm btn-outline" onclick="viewRecipe(${recipe.id})">Ver Receta</button>
                        </div>
                    </div>
                </div>
            `;
            recipeHtml += recipeCard;
        });
        
        // Actualizar el contenedor con el HTML generado
        recipesContainer.innerHTML = recipeHtml;
        console.log('Recetas mostradas correctamente');
    } catch (error) {
        console.error('Error al mostrar recetas:', error);
        showToast('Error al mostrar las recetas', 'error');
    }
}

// Display chef's reviews
function displayChefReviews() {
    try {
        const reviewsContainer = document.getElementById('chefReviews');
        if (!reviewsContainer) {
            console.log('Contenedor de reseñas no encontrado');
            return;
        }

        const reviews = currentChef.resenas || [];
        console.log('Mostrando reseñas:', reviews);

        if (reviews.length === 0) {
            reviewsContainer.innerHTML = '<p class="text-center" style="color: var(--text-light);">Este chef aún no tiene reseñas.</p>';
            return;
        }

        let reviewsHtml = '';
        reviews.forEach(review => {
            const reviewCard = `
                <div class="review-card bg-white p-4 rounded-lg mb-4" style="box-shadow: var(--shadow);">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <h4 class="font-semibold" style="color: var(--primary-color);">${review.nombre_cliente}</h4>
                            <div class="flex items-center mt-1">
                                ${generateStars(review.calificacion)}
                                <span class="ml-2 text-sm" style="color: var(--text-light);">${review.calificacion}/5</span>
                            </div>
                        </div>
                        <span class="text-sm" style="color: var(--text-light);">${new Date(review.fecha_calificacion).toLocaleDateString()}</span>
                    </div>
                    <p class="text-sm mb-2" style="color: var(--text-dark);">${review.comentario}</p>
                    ${review.aspectos_positivos ? `<p class="text-sm text-green-600"><strong>Aspectos positivos:</strong> ${review.aspectos_positivos}</p>` : ''}
                    ${review.aspectos_mejora ? `<p class="text-sm text-orange-600"><strong>Aspectos a mejorar:</strong> ${review.aspectos_mejora}</p>` : ''}
                </div>
            `;
            reviewsHtml += reviewCard;
        });

        reviewsContainer.innerHTML = reviewsHtml;
        console.log('Reseñas mostradas correctamente');
    } catch (error) {
        console.error('Error al mostrar reseñas:', error);
        showToast('Error al mostrar las reseñas', 'error');
    }
}

// Display recent services
function displayRecentServices() {
    try {
        const servicesContainer = document.getElementById('recentServices');
        if (!servicesContainer) {
            console.log('Contenedor de servicios recientes no encontrado');
            return;
        }

        const services = currentChef.servicios_recientes || [];
        console.log('Mostrando servicios recientes:', services);

        if (services.length === 0) {
            servicesContainer.innerHTML = '<p class="text-center" style="color: var(--text-light);">No hay servicios recientes para mostrar.</p>';
            return;
        }

        let servicesHtml = '';
        services.forEach(service => {
            const serviceCard = `
                <div class="service-card bg-white p-4 rounded-lg mb-4" style="box-shadow: var(--shadow);">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <h4 class="font-semibold" style="color: var(--primary-color);">${service.nombre_cliente}</h4>
                            <p class="text-sm" style="color: var(--text-light);">Servicio: ${service.tipo_servicio}</p>
                        </div>
                        <div class="text-right">
                            <span class="text-sm font-medium" style="color: var(--primary-color);">$${service.precio_total}</span>
                            <p class="text-sm" style="color: var(--text-light);">${new Date(service.fecha_servicio).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <p class="text-sm" style="color: var(--text-dark);">${service.descripcion}</p>
                    <div class="mt-2">
                        <span class="inline-block px-2 py-1 text-xs rounded" style="background-color: var(--accent-color); color: white;">
                            ${service.estado}
                        </span>
                    </div>
                </div>
            `;
            servicesHtml += serviceCard;
        });

        servicesContainer.innerHTML = servicesHtml;
        console.log('Servicios recientes mostrados correctamente');
    } catch (error) {
        console.error('Error al mostrar servicios recientes:', error);
        showToast('Error al mostrar los servicios recientes', 'error');
    }
}

// Toggle favorite status
async function toggleFavorite(chefId) {
    if (!isAuthenticated) {
        showToast('Debes iniciar sesión para agregar favoritos', 'warning');
        openModal('loginModal');
        return;
    }
    
    // Si no se proporciona chefId, intentar obtenerlo de currentChef
    if (!chefId && currentChef && currentChef.id) {
        chefId = currentChef.id;
        console.log('Usando ID del chef desde currentChef:', chefId);
    }
    
    if (!chefId) {
        console.error('Error: ID del chef no proporcionado');
        showToast('Error al actualizar favoritos: ID del chef no válido', 'error');
        return;
    }

    try {
        console.log('Actualizando estado de favorito para chef ID:', chefId);
        const token = localStorage.getItem('authToken');
        
        if (!token) {
            console.error('Error: Token de autenticación no encontrado');
            showToast('Error de autenticación', 'error');
            return;
        }
        
        const response = await fetch('/la-delicatesse/api/client/favorites.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ chef_id: chefId })
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('Respuesta de toggle favorito:', result);

        if (result.success) {
            updateFavoriteButton();
            showToast(result.message, 'success');
        } else {
            console.error('Error en la respuesta de toggle favorito:', result.message || 'Error desconocido');
            showToast(result.message || 'Error al actualizar favoritos', 'error');
        }
    } catch (error) {
        console.error('Error al actualizar favoritos:', error);
        showToast(`Error al actualizar favoritos: ${error.message}`, 'error');
    }
}

// Update favorite button state
async function updateFavoriteButton() {
    if (!isAuthenticated) {
        console.log('Usuario no autenticado, no se actualizará el botón de favoritos');
        return;
    }
    
    // Verificar que currentChef tenga la estructura correcta
    if (!currentChef) {
        console.error('Error: currentChef no está definido');
        return;
    }
    
    if (!currentChef.id) {
        console.error('Error: currentChef.id no está definido');
        return;
    }

    try {
        console.log('Actualizando estado del botón de favoritos');
        const token = localStorage.getItem('authToken');
        
        if (!token) {
            console.error('Error: Token de autenticación no encontrado');
            return;
        }
        
        const response = await fetch('/la-delicatesse/api/client/favorites.php', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('Respuesta de favoritos:', result);

        if (result.success) {
            const favoriteBtn = document.getElementById('favoriteBtn');
            
            if (!favoriteBtn) {
                console.error('Error: Botón de favoritos no encontrado en el DOM');
                return;
            }
            
            const isFavorite = result.data && Array.isArray(result.data) && result.data.some(fav => fav.id === currentChef.id);
            console.log('¿Es favorito?:', isFavorite);
            
            if (isFavorite) {
                favoriteBtn.classList.add('active');
                favoriteBtn.textContent = '❤️ Quitar de Favoritos';
            } else {
                favoriteBtn.classList.remove('active');
                favoriteBtn.textContent = '❤️ Agregar a Favoritos';
            }
        } else {
            console.error('Error en la respuesta de favoritos:', result.message || 'Error desconocido');
        }
    } catch (error) {
        console.error('Error al actualizar favoritos:', error);
    }
}

// Book chef function
function bookChef(chefId) {
    try {
        console.log('Iniciando proceso de reserva de chef');
        
        if (!isAuthenticated) {
            console.log('Usuario no autenticado intentando reservar chef');
            showToast('Debes iniciar sesión para hacer una reserva', 'warning');
            openModal('loginModal');
            return;
        }
        
        if (!chefId) {
            console.error('Error: ID del chef no proporcionado para reserva');
            showToast('Error al intentar reservar: ID del chef no válido', 'error');
            return;
        }
        
        // Verificar que el token de autenticación exista
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.error('Error: Token de autenticación no encontrado');
            showToast('Error de autenticación. Por favor, inicia sesión nuevamente', 'error');
            return;
        }
        
        console.log('Redirigiendo a página de reserva para chef ID:', chefId);
        window.location.href = `index.html#booking?chef=${chefId}`;
    } catch (error) {
        console.error('Error al procesar la reserva:', error);
        showToast('Error al procesar la reserva', 'error');
    }
}

// Generate star rating
function generateStars(rating) {
    if (!rating || isNaN(rating)) {
        console.warn('Calificación inválida:', rating);
        rating = 0;
    }
    
    // Convertir a número si es string
    rating = parseFloat(rating);
    
    // Limitar entre 0 y 5
    rating = Math.max(0, Math.min(5, rating));
    
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = '★'.repeat(fullStars);
    if (hasHalfStar) stars += '½';
    
    // Completar con estrellas vacías hasta 5
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    if (emptyStars > 0) {
        stars += '☆'.repeat(emptyStars);
    }
    
    return stars;
}

// View recipe function
function viewRecipe(recipeId) {
    // Redirect to recipe detail page
    window.location.href = `recipe-detail.html?id=${recipeId}`;
}

// Show toast notification
function showToast(message, type = 'info') {
    console.log(`Toast (${type}): ${message}`);
    
    // Crear elemento toast si no existe
    let toastContainer = document.getElementById('toastContainer');
    
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.style.position = 'fixed';
        toastContainer.style.bottom = '20px';
        toastContainer.style.right = '20px';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }
    
    // Crear toast
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.minWidth = '250px';
    toast.style.margin = '10px';
    toast.style.padding = '15px';
    toast.style.borderRadius = '4px';
    toast.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    toast.style.transition = 'all 0.3s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    
    // Establecer color según el tipo
    if (type === 'error') {
        toast.style.backgroundColor = '#f44336';
        toast.style.color = 'white';
    } else if (type === 'success') {
        toast.style.backgroundColor = '#4CAF50';
        toast.style.color = 'white';
    } else if (type === 'warning') {
        toast.style.backgroundColor = '#ff9800';
        toast.style.color = 'white';
    } else {
        toast.style.backgroundColor = '#2196F3';
        toast.style.color = 'white';
    }
    
    // Agregar mensaje
    toast.textContent = message;
    
    // Agregar al contenedor
    toastContainer.appendChild(toast);
    
    // Mostrar con animación
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    }, 10);
    
    // Ocultar después de 5 segundos
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        
        // Eliminar después de la animación
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 300);
    }, 5000);
}

// Handle logout
function handleLogout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    window.location.href = 'index.html';
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    console.log('Inicializando página de perfil de chef');
    
    // Verificar autenticación
    checkAuthStatus();
    
    // Obtener elementos del DOM
    const authRequiredElement = document.getElementById('authRequired');
    const chefProfileContentElement = document.getElementById('chefProfileContent');
    const authButtons = document.getElementById('authButtons');
    
    if (!authRequiredElement || !chefProfileContentElement) {
        console.error('Error: Elementos del DOM no encontrados');
        return;
    }
    
    // Obtener ID del chef de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const chefId = urlParams.get('id');
    
    if (!chefId) {
        console.error('Error: No se proporcionó ID del chef en la URL');
        showToast('Error: No se proporcionó ID del chef', 'error');
        window.location.href = 'index.html';
        return;
    }
    
    console.log('ID del chef obtenido de la URL:', chefId);
    
    // Siempre mostrar el perfil del chef, pero las recetas solo si está autenticado
    console.log('Mostrando perfil del chef');
    authRequiredElement.classList.add('hidden');
    chefProfileContentElement.classList.remove('hidden');
    loadChefData();
    
    // Si el usuario no está autenticado, mostrar los botones de inicio de sesión
    if (!isAuthenticated && authButtons) {
        authButtons.innerHTML = `
            <button onclick="openModal('loginModal')" class="btn btn-primary" data-translate="iniciar_sesion">
                Iniciar Sesión
            </button>
            <button onclick="openModal('registerModal')" class="btn btn-outline" data-translate="registrarse">
                Registrarse
            </button>
        `;
    }
    
    // Event listener for session changes
    window.addEventListener('storage', function(e) {
        if (e.key === 'authToken' || e.key === 'userType') {
            checkAuthStatus();
            if (chefId) {
                loadChefData();
            }
        }
    });
    
    // Language toggle functionality
    const languageToggle = document.getElementById('languageToggle');
    if (languageToggle) {
        languageToggle.addEventListener('click', function() {
            const currentLang = localStorage.getItem('language') || 'es';
            const newLang = currentLang === 'es' ? 'en' : 'es';
            localStorage.setItem('language', newLang);
            
            // Reload chef data with new language
            if (chefId) {
                loadChefData();
            }
        });
    }
    
    // Event delegation for login button in recipes section
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('login-to-view-recipes')) {
            openModal('loginModal');
        }
    });
});