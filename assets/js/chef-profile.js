// Chef Profile JavaScript

// Global variables
let chefData = null;
let chefRecipes = [];
let chefReviews = [];
let currentUser = null;
let isFavorite = false;

// Initialize the page
document.addEventListener("DOMContentLoaded", async () => {
    try {
        // Verificar autenticación (ahora es asíncrono)
        await checkAuthStatus();
        
        // Cargar datos del chef
        await loadChefData();
        
        // Configurar eventos
        setupEventListeners();
        
        console.log('Chef profile initialized successfully');
    } catch (error) {
        console.error('Error initializing chef profile:', error);
        showToast('Error al inicializar la página. Por favor, recarga.', 'error');
    } finally {
        // No es necesario ocultar el indicador de carga ya que lo eliminamos
    }
});

// Check if user is authenticated
async function checkAuthStatus() {
    const token = localStorage.getItem("authToken");
    const userData = localStorage.getItem("userData");

    // Verificar si hay token y datos de usuario
    if (token && userData) {
        try {
            // Intentar parsear los datos del usuario
            currentUser = JSON.parse(userData);
            
            // Verificar que los datos del usuario sean válidos
            if (!currentUser || !currentUser.id || !currentUser.tipo_usuario) {
                throw new Error("Datos de usuario incompletos o inválidos");
            }
            
            // Verificar que el token sea válido (opcional: hacer una petición al servidor)
            // const tokenValid = await validateToken(token);
            // if (!tokenValid) throw new Error("Token inválido o expirado");
            
            // Actualizar la UI para usuario autenticado
            updateUIForLoggedInUser();
            console.log("Usuario autenticado:", currentUser.tipo_usuario);
            
            // No llamamos a checkIfFavorite() aquí porque se llamará después de cargar los datos del chef
            return true;
        } catch (error) {
            console.error("Error en la autenticación:", error);
            
            // Si hay un error, limpiar el almacenamiento local
            localStorage.removeItem("authToken");
            localStorage.removeItem("userData");
            currentUser = null;
            
            // Mostrar mensaje de error (opcional)
            // showToast("Sesión inválida. Por favor, inicia sesión nuevamente.", "warning");
        }
    }
    
    // Si no hay token, datos inválidos o hubo un error
    currentUser = null;
    
    // Actualizar UI para usuario no autenticado
    const authButtons = document.getElementById("authButtons");
    if (authButtons) {
        authButtons.innerHTML = `
            <button onclick="openModal('loginModal')" class="btn btn-outline">Iniciar Sesión</button>
            <button onclick="openModal('registerModal')" class="btn btn-primary">Registrarse</button>
        `;
    }
    
    return false;
}

// Update UI for logged in user
function updateUIForLoggedInUser() {
    const authButtons = document.getElementById("authButtons");

    if (authButtons && currentUser) {
        if (currentUser.tipo_usuario === "chef") {
            // Show dashboard option for chefs
            authButtons.innerHTML = `
                <div class="flex items-center space-x-4">
                    <span class="font-medium" style="color: var(--text-color); font-family: var(--font-body);">Hola, ${currentUser.nombre}</span>
                    <a href="dashboard.html" class="btn btn-secondary">
                        Dashboard Chef
                    </a>
                    <button onclick="logout()" class="text-red-600 hover:text-red-800 transition font-medium">
                        Cerrar Sesión
                    </button>
                </div>
            `;
        } else {
            // Show client dashboard for clients
            authButtons.innerHTML = `
                <div class="flex items-center space-x-4">
                    <span class="font-medium" style="color: var(--text-color); font-family: var(--font-body);">Hola, ${currentUser.nombre}</span>
                    <a href="user-profile.html" class="btn btn-primary">
                        Mi Dashboard
                    </a>
                    <button onclick="logout()" class="text-red-600 hover:text-red-800 transition font-medium">
                        Cerrar Sesión
                    </button>
                </div>
            `;
        }
    }
    
    // Actualizar visibilidad de botones según tipo de usuario
    const contactBtn = document.getElementById('contactChefBtn');
    if (contactBtn && currentUser) {
        contactBtn.style.display = (currentUser.tipo_usuario === 'cliente') ? 'inline-flex' : 'none';
    }
}

// Setup event listeners
function setupEventListeners() {
    // Tab navigation
    const tabs = document.querySelectorAll('.chef-profile-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            activateTab(tabId);
        });
    });

    // Contact chef button
    const contactBtn = document.getElementById('contactChefBtn');
    if (contactBtn) {
        contactBtn.addEventListener('click', contactChef);
    }
    
    // Nota: El evento para el botón de favoritos se añade en updateFavoriteButton
    // para asegurar que siempre esté actualizado con el estado correcto
    
    // Activar la pestaña de biografía por defecto
    activateTab('bio');
}

// Load chef data
async function loadChefData() {
    try {
        // Get chef ID from URL parameter or localStorage
        const urlParams = new URLSearchParams(window.location.search);
        const chefId = urlParams.get('id') || localStorage.getItem("selectedChefId");
        
        if (!chefId) {
            showToast("No se encontró el ID del chef", "error");
            setTimeout(() => {
                window.location.href = "chefs-catalog.html";
            }, 1500);
            return null;
        }
        
        // Load chef details sin mostrar el indicador de carga
        const response = await fetch(`api/chefs/list.php?id=${chefId}`);
        
        // Verificar si la respuesta es correcta
        if (!response.ok) {
            throw new Error(`Error en la petición: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();

        if (result.success && result.data && result.data.length > 0) {
            chefData = result.data[0];
            
            // Actualizar la UI con los datos del chef inmediatamente
            updateChefUI();
            
            // Cargar recetas y reseñas en paralelo para mejorar rendimiento
            // pero sin mostrar indicadores de carga
            Promise.allSettled([
                loadChefRecipes(chefId, false),
                loadChefReviews(chefId, false)
            ]).then(([recipesResult, reviewsResult]) => {
                // Manejar errores de carga de recetas
                if (recipesResult.status === 'rejected') {
                    console.error('Error cargando recetas:', recipesResult.reason);
                }
                
                // Manejar errores de carga de reseñas
                if (reviewsResult.status === 'rejected') {
                    console.error('Error cargando reseñas:', reviewsResult.reason);
                }
            });
            
            // Check if chef is in favorites if user is logged in
            if (currentUser && currentUser.tipo_usuario === 'cliente') {
                checkIfFavorite();
            } else {
                // Si no es cliente o no está autenticado, actualizar el botón de favoritos
                updateFavoriteButton(false);
            }
            
            return chefData;
        } else {
            showToast("No se encontró información del chef solicitado", "error");
            setTimeout(() => {
                window.location.href = "chefs-catalog.html";
            }, 2000);
            return null;
        }
    } catch (error) {
        console.error("Error loading chef data:", error);
        showToast("Error al cargar los datos del chef: " + (error.message || 'Error desconocido'), "error");
        return null;
    }
}

// Update chef UI with loaded data
function updateChefUI() {
    if (!chefData) return;

    // Update chef profile header
    document.getElementById('chefName').textContent = chefData.nombre;
    document.getElementById('chefSpecialty').textContent = chefData.especialidad;
    document.getElementById('chefLocation').textContent = chefData.ubicacion;
    document.getElementById('chefRating').innerHTML = generateStars(chefData.calificacion_promedio);
    document.getElementById('chefServices').textContent = `(${chefData.total_servicios} servicios)`;
    
    if (chefData.foto_perfil) {
        document.getElementById('chefImage').src = chefData.foto_perfil;
    }

    // Update chef bio tab
    document.getElementById('chefBio').innerHTML = chefData.biografia || "No hay información biográfica disponible.";
    document.getElementById('chefExperience').textContent = `${chefData.experiencia_anos} años de experiencia`;
    document.getElementById('chefCertifications').innerHTML = chefData.certificaciones || "No hay certificaciones registradas.";
    document.getElementById('chefPrice').textContent = `$${chefData.precio_por_hora} por hora`;

    // Update page title
    document.title = `${chefData.nombre} - La Délicatesse`;
}

// Load chef's recipes
async function loadChefRecipes(chefId, showLoading = true) {
    if (!chefId) {
        console.error('ID de chef no proporcionado para cargar recetas');
        return;
    }
    
    try {
        const recipesContainer = document.getElementById('chefRecipes');
        if (!recipesContainer) {
            console.error('Contenedor de recetas no encontrado');
            return;
        }
        
        // Mostrar indicador de carga solo si se solicita
        if (showLoading) {
            recipesContainer.innerHTML = '<div class="loading-container"><div class="spinner-border text-primary" role="status"></div><p>Cargando recetas...</p></div>';
        }
        
        const response = await fetch(`api/recipes/list.php?chef_id=${chefId}`);
        
        // Verificar si la respuesta es correcta
        if (!response.ok) {
            throw new Error(`Error en la petición: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();

        if (result.success && result.data && result.data.length > 0) {
            chefRecipes = result.data;
            displayChefRecipes();
            return result.data;
        } else {
            // No hay recetas o hubo un error
            recipesContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-utensils text-gray-400 text-5xl mb-4"></i>
                    <p class="text-gray-500">Este chef aún no ha publicado recetas.</p>
                </div>
            `;
            return [];
        }
    } catch (error) {
        console.error("Error loading chef recipes:", error);
        const recipesContainer = document.getElementById('chefRecipes');
        if (recipesContainer) {
            recipesContainer.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-circle text-red-500 text-4xl mb-3"></i>
                    <p class="text-gray-700">Error al cargar las recetas.</p>
                    <p class="text-gray-500 text-sm">${error.message || 'Intente nuevamente más tarde.'}</p>
                </div>
            `;
        }
        throw error; // Re-lanzar el error para que pueda ser manejado por el llamador
    }
}

// Display chef's recipes
function displayChefRecipes() {
    const recipesContainer = document.getElementById('chefRecipes');
    if (!recipesContainer) return;

    if (chefRecipes.length === 0) {
        recipesContainer.innerHTML = '<p class="text-gray-500">Este chef aún no ha publicado recetas.</p>';
        return;
    }

    recipesContainer.innerHTML = chefRecipes
        .map(recipe => {
            // Asegurarse de que la descripción no sea demasiado larga
            const descripcion = recipe.descripcion ? 
                (recipe.descripcion.length > 100 ? 
                    recipe.descripcion.substring(0, 97) + '...' : 
                    recipe.descripcion) : 
                "Receta deliciosa y fácil de preparar";
                
            return `
                <div class="recipe-card">
                    <div class="recipe-image">
                        <img src="${recipe.imagen || "/placeholder.svg?height=220&width=300"}" 
                             alt="${recipe.titulo}">
                        <div class="recipe-badge">${recipe.dificultad}</div>
                    </div>
                    <div class="recipe-info">
                        <h3>${recipe.titulo}</h3>
                        <p class="chef">${descripcion}</p>
                        
                        <div class="recipe-meta">
                            <span>⏱️ ${recipe.tiempo_preparacion} min</span>
                            <span class="accent-text font-bold">$${recipe.precio}</span>
                        </div>
                        
                        <button onclick="viewRecipe(${recipe.id})" class="btn btn-primary btn-block">
                            Ver Receta
                        </button>
                    </div>
                </div>
            `;
        })
        .join('');
}

// Load chef's reviews
async function loadChefReviews(chefId, showLoading = true) {
    if (!chefId) {
        console.error('ID de chef no proporcionado para cargar reseñas');
        return;
    }
    
    try {
        const reviewsContainer = document.getElementById('chefReviews');
        if (!reviewsContainer) {
            console.error('Contenedor de reseñas no encontrado');
            return;
        }
        
        // Mostrar indicador de carga solo si se solicita
        if (showLoading) {
            reviewsContainer.innerHTML = '<div class="loading-container"><div class="spinner-border text-primary" role="status"></div><p>Cargando reseñas...</p></div>';
        }
        
        const response = await fetch(`api/chefs/reviews.php?chef_id=${chefId}`);
        
        // Verificar si la respuesta es correcta
        if (!response.ok) {
            throw new Error(`Error en la petición: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();

        if (result.success) {
            chefReviews = result.data || [];
            
            // Mostrar reseñas
            displayChefReviews();
            
            // Actualizar la calificación promedio en la UI si hay reseñas
            if (result.data && result.data.length > 0) {
                updateAverageRating(result.data);
                return result.data;
            } else {
                // No hay reseñas
                reviewsContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-comment-slash text-gray-400 text-5xl mb-4"></i>
                        <p class="text-gray-500">Este chef aún no tiene reseñas.</p>
                        <p class="text-gray-400 text-sm">¡Sé el primero en dejar una reseña después de contratar sus servicios!</p>
                    </div>
                `;
                return [];
            }
        } else {
            // Error en la respuesta del servidor
            reviewsContainer.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle text-yellow-500 text-4xl mb-3"></i>
                    <p class="text-gray-700">No se pudieron cargar las reseñas.</p>
                    <p class="text-gray-500 text-sm">${result.message || 'Intente nuevamente más tarde.'}</p>
                </div>
            `;
            return [];
        }
    } catch (error) {
        console.error("Error loading chef reviews:", error);
        const reviewsContainer = document.getElementById('chefReviews');
        if (reviewsContainer) {
            reviewsContainer.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-circle text-red-500 text-4xl mb-3"></i>
                    <p class="text-gray-700">Error al cargar las reseñas.</p>
                    <p class="text-gray-500 text-sm">${error.message || 'Intente nuevamente más tarde.'}</p>
                </div>
            `;
        }
        throw error; // Re-lanzar el error para que pueda ser manejado por el llamador
    }
}

// Actualizar calificación promedio basada en las reseñas
function updateAverageRating(reviews) {
    if (!reviews || reviews.length === 0) return;
    
    // Calcular el promedio de calificaciones
    const sum = reviews.reduce((total, review) => total + parseFloat(review.calificacion || 0), 0);
    const average = sum / reviews.length;
    
    // Actualizar la UI solo si es necesario
    const chefRating = document.getElementById('chefRating');
    if (chefRating) {
        chefRating.innerHTML = generateStars(average) + ` <span>(${average.toFixed(1)})</span>`;
    }
}

// Display chef's reviews
function displayChefReviews() {
    const reviewsContainer = document.getElementById('chefReviews');
    if (!reviewsContainer) return;

    if (!chefReviews || chefReviews.length === 0) {
        reviewsContainer.innerHTML = '<p class="text-gray-500">Este chef aún no tiene reseñas.</p>';
        return;
    }

    reviewsContainer.innerHTML = chefReviews
        .map(review => {
            // Determinar el título de la reseña basado en la calificación
            let reviewTitle = review.titulo || "Experiencia con el chef";
            if (!review.titulo) {
                const puntuacion = parseFloat(review.calificacion) || 0;
                if (puntuacion >= 4.5) reviewTitle = '¡Experiencia excepcional!';
                else if (puntuacion >= 4) reviewTitle = 'Muy buena experiencia';
                else if (puntuacion >= 3) reviewTitle = 'Experiencia satisfactoria';
                else if (puntuacion >= 2) reviewTitle = 'Experiencia regular';
                else reviewTitle = 'Experiencia decepcionante';
            }
            
            // Crear contenido adicional si existen aspectos positivos o de mejora
            let additionalContent = '';
            if (review.aspectos_positivos || review.aspectos_mejora) {
                additionalContent = `
                    <div class="review-details mt-3">
                        ${review.aspectos_positivos ? `<div class="review-positive"><strong>Lo que me gustó:</strong> ${review.aspectos_positivos}</div>` : ''}
                        ${review.aspectos_mejora ? `<div class="review-improve"><strong>Aspectos a mejorar:</strong> ${review.aspectos_mejora}</div>` : ''}
                    </div>
                `;
            } else {
                // Generar aspectos positivos o de mejora predeterminados basados en la calificación
                const puntuacion = parseFloat(review.calificacion) || 0;
                if (puntuacion >= 3) {
                    additionalContent = `
                        <div class="review-details mt-3">
                            <div class="review-positive"><strong>Lo que me gustó:</strong> Profesionalismo, calidad de la comida y atención al detalle.</div>
                        </div>
                    `;
                } else {
                    additionalContent = `
                        <div class="review-details mt-3">
                            <div class="review-improve"><strong>Aspectos a mejorar:</strong> Puntualidad, comunicación y variedad del menú.</div>
                        </div>
                    `;
                }
            }
            
            // Información del servicio
            const serviceInfo = review.servicio_fecha ? `
                <div class="review-service-info">
                    <small>Servicio realizado el ${formatDate(review.servicio_fecha)}</small>
                    ${review.servicio_ubicacion ? `<small> en ${review.servicio_ubicacion}</small>` : ''}
                </div>
            ` : '';
            
            // Recomendación
            const recommendation = review.recomendaria !== undefined ? `
                <div class="review-recommendation ${review.recomendaria ? 'positive' : 'negative'}">
                    ${review.recomendaria ? '✓ Recomendaría este chef' : '✗ No recomendaría este chef'}
                </div>
            ` : `
                <div class="review-recommendation ${parseFloat(review.calificacion) >= 3.5 ? 'positive' : 'negative'}">
                    ${parseFloat(review.calificacion) >= 3.5 ? '✓ Recomendaría este chef' : '✗ No recomendaría este chef'}
                </div>
            `;
            
            return `
                <div class="review-card">
                    <div class="review-header">
                        <div class="review-user">
                            <div class="review-user-name">${review.cliente_nombre}</div>
                            <div class="review-date">${formatDate(review.fecha)}</div>
                        </div>
                        <div class="review-rating">
                            ${generateStars(review.calificacion)}
                        </div>
                    </div>
                    <div class="review-content">
                        <h3 class="review-title">${reviewTitle}</h3>
                        <p class="review-text">${review.comentario || "Sin comentarios adicionales."}</p>
                        ${additionalContent}
                        ${recommendation}
                        ${serviceInfo}
                    </div>
                </div>
            `;
        })
        .join('');
}

// Check if chef is in user's favorites
async function checkIfFavorite() {
    // Verificar precondiciones
    if (!currentUser) {
        console.log('No hay usuario autenticado para verificar favoritos');
        updateFavoriteButton(false);
        return false;
    }
    
    if (currentUser.tipo_usuario !== 'cliente') {
        console.log('El usuario no es cliente, no puede tener favoritos');
        updateFavoriteButton(false);
        return false;
    }
    
    if (!chefData || !chefData.id) {
        console.log('No hay datos del chef para verificar favoritos');
        updateFavoriteButton(false);
        return false;
    }

    try {
        // Obtener token de autenticación
        const token = localStorage.getItem("authToken");
        if (!token) {
            console.error('Token de autenticación no encontrado');
            updateFavoriteButton(false);
            return false;
        }
        
        // Realizar petición para obtener favoritos
        const response = await fetch("api/client/favorites.php", {
            headers: {
                Authorization: `Bearer ${token}`,
                'Accept': 'application/json'
            },
        });
        
        // Verificar si la respuesta es correcta
        if (!response.ok) {
            throw new Error(`Error en la petición: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();

        if (result.success && Array.isArray(result.data)) {
            const favorites = result.data;
            
            // Verificar si el chef actual está en la lista de favoritos
            // Asegurarse de que ambos IDs sean números para comparación correcta
            const chefId = parseInt(chefData.id);
            isFavorite = favorites.some(chef => parseInt(chef.id) === chefId);
            
            console.log(`Chef ${chefData.nombre} ${isFavorite ? 'está' : 'no está'} en favoritos`);
            updateFavoriteButton(isFavorite);
            return isFavorite;
        } else {
            console.warn('No se pudieron obtener los favoritos:', result.message || 'Error desconocido');
            updateFavoriteButton(false);
            return false;
        }
    } catch (error) {
        console.error("Error checking favorites:", error);
        showToast("No se pudo verificar si el chef está en favoritos", "warning");
        updateFavoriteButton(false);
        return false;
    }
}

// Update favorite button based on favorite status
function updateFavoriteButton(isVisible = true) {
    const favBtn = document.getElementById('addToFavoritesBtn');
    if (!favBtn) {
        console.warn('Botón de favoritos no encontrado en el DOM');
        return;
    }

    // Verificar si el botón debe ser visible
    if (!isVisible || !currentUser || currentUser.tipo_usuario !== 'cliente') {
        // Si no es un cliente o no debe ser visible, ocultar el botón
        favBtn.style.display = 'none';
        return;
    }
    
    // Mostrar el botón para clientes
    favBtn.style.display = 'inline-flex';
    
    // Actualizar el aspecto del botón según el estado de favorito
    if (isFavorite) {
        favBtn.innerHTML = '<i class="fas fa-heart"></i> Quitar de favoritos';
        favBtn.classList.add("is-favorite");
        favBtn.setAttribute('aria-label', 'Quitar este chef de tus favoritos');
        favBtn.setAttribute('title', 'Quitar de favoritos');
    } else {
        favBtn.innerHTML = '<i class="far fa-heart"></i> Añadir a favoritos';
        favBtn.classList.remove("is-favorite");
        favBtn.setAttribute('aria-label', 'Añadir este chef a tus favoritos');
        favBtn.setAttribute('title', 'Añadir a favoritos');
    }
    
    // Asegurarse de que el botón tenga el evento click correcto
    // Primero remover cualquier evento existente para evitar duplicados
    favBtn.removeEventListener('click', toggleFavorite);
    favBtn.addEventListener('click', toggleFavorite);
}

// Toggle favorite status
async function toggleFavorite() {
    // Verificar si el usuario está autenticado
    if (!currentUser) {
        showToast("Debes iniciar sesión para añadir favoritos", "warning");
        openModal("loginModal");
        return;
    }

    // Verificar si el usuario es cliente
    if (currentUser.tipo_usuario !== 'cliente') {
        showToast("Solo los clientes pueden añadir favoritos", "warning");
        return;
    }

    // Verificar si hay datos del chef
    if (!chefData || !chefData.id) {
        showToast("No se puede identificar al chef", "error");
        return;
    }

    try {
        // Cambiar el botón a un estado de carga
        const favoriteBtn = document.getElementById('addToFavoritesBtn');
        const originalBtnContent = favoriteBtn.innerHTML;
        favoriteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';
        favoriteBtn.disabled = true;
        // Obtener token de autenticación
        const token = localStorage.getItem("authToken");
        if (!token) {
            throw new Error("Token de autenticación no encontrado");
        }
        
        // Determinar la acción basada en el estado actual de favorito
        const endpoint = isFavorite ? 'api/client/remove-favorite.php' : 'api/client/add-favorite.php';
        const action = isFavorite ? 'eliminar de' : 'añadir a';
        
        // Realizar la petición para cambiar el estado de favorito
        const toggleResponse = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                type: 'chef',
                id: chefData.id
            })
        });
        
        // Verificar si la respuesta es correcta
        if (!toggleResponse.ok) {
            throw new Error(`Error en la petición: ${toggleResponse.status} ${toggleResponse.statusText}`);
        }
        
        const toggleResult = await toggleResponse.json();
        
        if (toggleResult.success) {
            // Actualizar el estado local de favorito
            isFavorite = !isFavorite;
            
            // Actualizar la interfaz
            updateFavoriteButton();
            
            // Mostrar mensaje de éxito
            showToast(`Chef ${action} favoritos correctamente`, "success");
            
            // Actualizar contador de favoritos si existe
            const favCounter = document.getElementById('favoritesCount');
            if (favCounter) {
                const currentCount = parseInt(favCounter.textContent) || 0;
                favCounter.textContent = isFavorite ? currentCount + 1 : Math.max(0, currentCount - 1);
            }
        } else {
            // Mostrar mensaje de error del servidor
            showToast(toggleResult.message || `Error al ${action} favoritos`, "error");
        }
    } catch (error) {
        console.error("Error toggling favorite:", error);
        showToast(`Error al actualizar favoritos: ${error.message}`, "error");
    } finally {
        hideLoading();
    }
}

// Logout function
function logout() {
    // Limpiar datos de autenticación
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    
    // Limpiar otros datos almacenados que puedan ser sensibles
    localStorage.removeItem('selectedChefId');
    localStorage.removeItem('selectedChefName');
    localStorage.removeItem('selectedChefSpecialty');
    localStorage.removeItem('selectedChefPrice');
    
    // Mostrar mensaje de éxito
    showToast('Sesión cerrada correctamente', 'success');
    
    // Redireccionar a la página principal
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// Contact chef function
function contactChef() {
    if (!currentUser) {
        showToast("Debes iniciar sesión para contactar un chef", "warning");
        openModal("loginModal");
        return;
    }

    if (currentUser.tipo_usuario !== 'cliente') {
        showToast("Solo los clientes pueden contactar chefs", "warning");
        return;
    }

    if (!chefData) return;

    // Guardar datos del chef seleccionado
    localStorage.setItem("selectedChefId", chefData.id);
    localStorage.setItem("selectedChefName", chefData.nombre);
    localStorage.setItem("selectedChefSpecialty", chefData.especialidad);
    localStorage.setItem("selectedChefPrice", chefData.precio_por_hora);
    
    // Redirigir a la página de reserva
    window.location.href = "booking.html";
}

// Open modal function
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) {
        console.error(`Modal with ID ${modalId} not found`);
        return;
    }
    
    // Cerrar cualquier modal abierto primero
    const openModals = document.querySelectorAll('.modal.active');
    openModals.forEach(openModal => {
        openModal.classList.remove('active');
        openModal.style.display = 'none';
    });
    
    // Mostrar el modal solicitado
    modal.classList.add('active');
    modal.style.display = 'flex';
    
    // Añadir evento para cerrar al hacer clic fuera del contenido
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                closeModal(modalId);
            }
        });
    }
    
    // Añadir evento para cerrar con la tecla Escape
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeModal(modalId);
        }
    });
}

// Close modal function
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
        
        // Eliminar eventos para evitar duplicados
        modal.removeEventListener('click', function(event) {
            if (event.target === modal) {
                closeModal(modalId);
            }
        });
        
        document.removeEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                closeModal(modalId);
            }
        });
    }
}

// View recipe function
function viewRecipe(recipeId) {
    if (!recipeId) {
        showToast("Error al seleccionar la receta", "error");
        return;
    }
    
    // Guardar ID de la receta seleccionada
    localStorage.setItem("selectedRecipeId", recipeId);
    
    // Redirigir a la página de detalle de receta
    window.location.href = "recipe-detail.html";
}

// Tab navigation
function activateTab(tabId) {
    // Hide all tab panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    
    // Deactivate all tabs
    document.querySelectorAll('.chef-profile-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Activate selected tab and pane
    document.getElementById(`${tabId}Tab`).classList.add('active');
    document.getElementById(`${tabId}Content`).classList.add('active');
}

// Generate star rating HTML
function generateStars(rating) {
    // Asegurarse de que rating sea un número
    const numRating = parseFloat(rating) || 0;
    
    // Limitar el rating entre 0 y 5
    const clampedRating = Math.max(0, Math.min(5, numRating));
    
    const fullStars = Math.floor(clampedRating);
    const halfStar = clampedRating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    let starsHTML = "";
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<i class="fas fa-star"></i>';
    }
    
    // Half star
    if (halfStar) {
        starsHTML += '<i class="fas fa-star-half-alt"></i>';
    }
    
    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<i class="far fa-star"></i>';
    }
    
    return starsHTML;
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'Fecha no disponible';
    
    try {
        const date = new Date(dateString);
        
        // Verificar si la fecha es válida
        if (isNaN(date.getTime())) {
            return 'Fecha inválida';
        }
        
        return new Intl.DateTimeFormat("es-SV", {
            year: "numeric",
            month: "long",
            day: "numeric",
        }).format(date);
    } catch (error) {
        console.error('Error al formatear fecha:', error);
        return 'Error en formato de fecha';
    }
}

// Show loading indicator
function showLoading(message = 'Cargando...') {
    let loader = document.getElementById('globalLoader');
    
    // Crear el loader si no existe
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'globalLoader';
        loader.className = 'global-loader fixed inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center z-50';
        
        // Usar spinner de Bootstrap para mejor apariencia
        loader.innerHTML = `
            <div class="spinner-container">
                <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
                    <span class="sr-only">Cargando...</span>
                </div>
                <p class="loading-text mt-3 text-white">${message}</p>
            </div>
        `;
        
        document.body.appendChild(loader);
    } else {
        // Actualizar el mensaje si el loader ya existe
        const loadingText = loader.querySelector('.loading-text');
        if (loadingText) {
            loadingText.textContent = message;
        }
    }
    
    // Mostrar el loader
    loader.style.display = 'flex';
    
    // Añadir clase al body para bloquear scroll
    document.body.classList.add('loading');
    
    return loader;
}

// Hide loading indicator
function hideLoading() {
    const loader = document.getElementById('globalLoader');
    if (loader) {
        // Añadir clase para animación de salida
        loader.classList.add('fade-out');
        
        // Ocultar después de la animación
        setTimeout(() => {
            loader.style.display = 'none';
            loader.classList.remove('fade-out');
            document.body.classList.remove('loading');
        }, 300);
    } else {
        // Si no hay loader, solo quitar la clase del body
        document.body.classList.remove('loading');
    }
}

// Show toast notification
function showToast(message, type = 'info', duration = 5000) {
    // Validar parámetros
    if (!message) return;
    if (!['info', 'success', 'error', 'warning'].includes(type)) type = 'info';
    if (isNaN(duration) || duration < 1000) duration = 5000;
    
    // Crear el contenedor de toasts si no existe
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // Crear el toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    
    // Determinar el icono según el tipo
    let icon = 'fa-info-circle';
    let iconColor = 'var(--color-info, #3498db)';
    
    if (type === 'success') {
        icon = 'fa-check-circle';
        iconColor = 'var(--color-success, #2ecc71)';
    } else if (type === 'error') {
        icon = 'fa-exclamation-circle';
        iconColor = 'var(--color-error, #e74c3c)';
    } else if (type === 'warning') {
        icon = 'fa-exclamation-triangle';
        iconColor = 'var(--color-warning, #f39c12)';
    }
    
    toast.innerHTML = `
        <div class="toast-content">
            <div class="toast-icon">
                <i class="fas ${icon}" style="color: ${iconColor}"></i>
            </div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" aria-label="Cerrar notificación">&times;</button>
    `;
    
    // Añadir el toast al contenedor
    toastContainer.appendChild(toast);
    
    // Configurar el botón de cierre
    const closeButton = toast.querySelector('.toast-close');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            closeToast(toast);
        });
    }
    
    // Añadir clase para animación de entrada
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });
    
    // Auto remove after duration
    const timeoutId = setTimeout(() => {
        closeToast(toast);
    }, duration);
    
    // Guardar el ID del timeout para poder cancelarlo si es necesario
    toast.dataset.timeoutId = timeoutId;
    
    // Pausar el timeout al pasar el mouse por encima
    toast.addEventListener('mouseenter', () => {
        clearTimeout(toast.dataset.timeoutId);
    });
    
    // Reanudar el timeout al quitar el mouse
    toast.addEventListener('mouseleave', () => {
        toast.dataset.timeoutId = setTimeout(() => {
            closeToast(toast);
        }, 2000);
    });
    
    return toast;
}

// Función para cerrar un toast con animación
function closeToast(toast) {
    if (!toast) return;
    
    // Limpiar cualquier timeout pendiente
    if (toast.dataset.timeoutId) {
        clearTimeout(parseInt(toast.dataset.timeoutId));
    }
    
    // Añadir clase para animación de salida
    toast.classList.remove('show');
    toast.classList.add('hide');
    
    // Eliminar después de la animación de salida
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
            
            // Eliminar el contenedor si está vacío
            const toastContainer = document.getElementById('toastContainer');
            if (toastContainer && toastContainer.children.length === 0) {
                toastContainer.remove();
            }
        }
    }, 300);
}