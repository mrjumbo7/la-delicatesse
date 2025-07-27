// Recipe Detail JavaScript

// Global variables
let recipeData = null;
let relatedRecipes = [];
// currentUser is declared globally in main.js
let isFavorite = false;

// Initialize the page
document.addEventListener("DOMContentLoaded", () => {
    checkAuthStatus();
    loadRecipeData();
    setupEventListeners();
});

// Check if user is authenticated
function checkAuthStatus() {
    const token = localStorage.getItem("authToken");
    const userData = localStorage.getItem("userData");

    if (token && userData) {
        currentUser = JSON.parse(userData);
        updateUIForLoggedInUser();
        checkIfFavorite();
    }
}

// Update UI for logged in user
function updateUIForLoggedInUser() {
    const authButtons = document.getElementById("authButtons");
    const mobileActions = document.querySelector(".mobile-actions");

    if (authButtons && currentUser) {
        const userInitials = currentUser.nombre.split(' ').map(n => n[0]).join('').toUpperCase();
        const profileImage = currentUser.foto_perfil || null;
        
        // Desktop dropdown
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
                        ${currentUser.tipo_usuario === 'chef' ? 
                            '<a href="dashboard.html">Mi Dashboard</a>' : 
                            '<a href="user-profile.html">Mi Perfil</a>'
                        }
                        <a href="#" onclick="logout()">Cerrar Sesión</a>
                    </div>
                </div>
            </div>
        `;
        
        // Mobile menu
        if (mobileActions) {
            mobileActions.innerHTML = `
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
                            ${currentUser.tipo_usuario === 'chef' ? 
                                '<a href="dashboard.html">Mi Dashboard</a>' : 
                                '<a href="user-profile.html">Mi Perfil</a>'
                            }
                            <a href="#" onclick="logout()">Cerrar Sesión</a>
                        </div>
                    </div>
                </div>
            `;
        }
    } else if (authButtons) {
        // Show login/register buttons when not logged in
        authButtons.innerHTML = `
            <button class="btn btn-outline" onclick="openModal('loginModal')">Iniciar Sesión</button>
            <button class="btn btn-primary" onclick="openModal('registerModal')">Registrarse</button>
        `;
        
        if (mobileActions) {
            mobileActions.innerHTML = `
                <button class="btn btn-outline btn-block" onclick="openModal('loginModal')">Iniciar Sesión</button>
                <button class="btn btn-primary btn-block" onclick="openModal('registerModal')">Registrarse</button>
            `;
        }
    }
}

// Setup event listeners
function setupEventListeners() {
    // Tab navigation
    const tabs = document.querySelectorAll('.recipe-nav-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            activateTab(tabId);
        });
    });

    // Buy recipe button
    const buyBtn = document.getElementById('buyRecipeBtn');
    if (buyBtn) {
        buyBtn.addEventListener('click', () => buyRecipe());
    }

    // Add to favorites button
    const favBtn = document.getElementById('addToFavoritesBtn');
    if (favBtn) {
        favBtn.addEventListener('click', () => toggleFavorite());
    }
}

// Load recipe data
async function loadRecipeData() {
    try {
        // Get recipe ID from URL parameter or localStorage
        const urlParams = new URLSearchParams(window.location.search);
        const recipeId = urlParams.get('id') || localStorage.getItem("selectedRecipeId");
        
        if (!recipeId) {
            showToast("No se encontró el ID de la receta", "error");
            window.location.href = "recipes-catalog.html";
            return;
        }

        showLoading();
        
        // Load recipe details
        const response = await fetch(`api/recipes/list.php?id=${recipeId}`);
        const result = await response.json();

        if (result.success && result.data.length > 0) {
            recipeData = result.data[0];
            updateRecipeUI();
            
            // Load related recipes
            loadRelatedRecipes(recipeData.chef_id);
        } else {
            showToast("No se pudo cargar la información de la receta", "error");
            setTimeout(() => {
                window.location.href = "recipes-catalog.html";
            }, 2000);
        }
    } catch (error) {
        console.error("Error loading recipe data:", error);
        showToast("Error al cargar los datos de la receta", "error");
    } finally {
        hideLoading();
    }
}

// Update recipe UI with loaded data
function updateRecipeUI() {
    if (!recipeData) return;

    // Update recipe detail header
    document.getElementById('recipeTitle').textContent = recipeData.titulo;
    document.getElementById('recipeCategory').textContent = recipeData.categoria || "Receta";
    document.getElementById('recipeChefLink').textContent = recipeData.chef_nombre;
    document.getElementById('recipeChefLink').onclick = () => viewChefProfile(recipeData.chef_id);
    document.getElementById('recipeDate').textContent = formatDate(recipeData.fecha_publicacion);
    document.getElementById('recipeTime').textContent = `${recipeData.tiempo_preparacion} min`;
    document.getElementById('recipeDifficultyText').textContent = recipeData.dificultad;
    document.getElementById('recipeDifficulty').textContent = recipeData.dificultad;
    document.getElementById('recipePrice').textContent = `$${recipeData.precio}`;
    
    if (recipeData.imagen) {
        document.getElementById('recipeImage').src = recipeData.imagen;
    }

    // Update recipe description tab
    document.getElementById('recipeDescription').textContent = recipeData.descripcion || "No hay descripción disponible.";

    // Update recipe ingredients tab
    const ingredientsList = document.getElementById('recipeIngredients');
    if (recipeData.ingredientes) {
        try {
            // Try to parse as JSON first (for backward compatibility)
            const ingredients = JSON.parse(recipeData.ingredientes);
            ingredientsList.innerHTML = ingredients
                .map(ingredient => `<li>${ingredient}</li>`)
                .join('');
        } catch (e) {
            // If not JSON, treat as plain text with line breaks
            const ingredients = recipeData.ingredientes
                .split('\n')
                .filter(ingredient => ingredient.trim() !== '')
                .map(ingredient => ingredient.trim());
            ingredientsList.innerHTML = ingredients
                .map(ingredient => `<li>${ingredient}</li>`)
                .join('');
        }
    } else {
        ingredientsList.innerHTML = '<li>No hay ingredientes disponibles.</li>';
    }

    // Update recipe instructions tab
    const instructionsList = document.getElementById('recipeInstructions');
    if (recipeData.instrucciones) {
        try {
            // Try to parse as JSON first (for backward compatibility)
            const instructions = JSON.parse(recipeData.instrucciones);
            instructionsList.innerHTML = instructions
                .map(instruction => `<li>${instruction}</li>`)
                .join('');
        } catch (e) {
            // If not JSON, treat as plain text with line breaks
            const instructions = recipeData.instrucciones
                .split('\n')
                .filter(instruction => instruction.trim() !== '')
                .map(instruction => instruction.trim());
            instructionsList.innerHTML = instructions
                .map(instruction => `<li>${instruction}</li>`)
                .join('');
        }
    } else {
        instructionsList.innerHTML = '<li>No hay instrucciones disponibles.</li>';
    }

    // Update page title
    document.title = `${recipeData.titulo} - La Délicatesse`;
}

// Load related recipes
async function loadRelatedRecipes(chefId) {
    try {
        const response = await fetch(`api/recipes/list.php?chef_id=${chefId}`);
        const result = await response.json();

        if (result.success) {
            // Filter out the current recipe
            relatedRecipes = result.data.filter(recipe => recipe.id !== recipeData.id);
            displayRelatedRecipes();
        } else {
            document.getElementById('relatedRecipes').innerHTML = '<p class="text-gray-500">No se pudieron cargar las recetas relacionadas.</p>';
        }
    } catch (error) {
        console.error("Error loading related recipes:", error);
        document.getElementById('relatedRecipes').innerHTML = '<p class="text-gray-500">Error al cargar las recetas relacionadas.</p>';
    }
}

// Display related recipes
function displayRelatedRecipes() {
    const recipesContainer = document.getElementById('relatedRecipes');
    if (!recipesContainer) return;

    if (relatedRecipes.length === 0) {
        recipesContainer.innerHTML = '<p class="text-gray-500">No hay recetas relacionadas disponibles.</p>';
        return;
    }

    // Show at most 4 related recipes
    const recipesToShow = relatedRecipes.slice(0, 4);

    recipesContainer.innerHTML = recipesToShow
        .map(recipe => `
            <div class="recipe-card">
                <div class="recipe-image">
                    <img src="${recipe.imagen || "/placeholder.svg?height=220&width=300"}" 
                         alt="${recipe.titulo}">
                    <div class="recipe-badge">${recipe.dificultad}</div>
                </div>
                <div class="recipe-info">
                    <div class="recipe-category">Por ${recipe.chef_nombre}</div>
                    <h3>${recipe.titulo}</h3>
                    <p class="chef">${recipe.descripcion || "Receta deliciosa y fácil de preparar"}</p>
                    
                    <div class="recipe-meta">
                        <span>⏱️ ${recipe.tiempo_preparacion} min</span>
                        <span class="accent-text font-bold">$${recipe.precio}</span>
                    </div>
                    
                    <button onclick="viewRecipe(${recipe.id})" class="btn btn-primary btn-block">
                        Ver Receta
                    </button>
                </div>
            </div>
        `)
        .join('');
}

// Check if recipe is in user's favorites
async function checkIfFavorite() {
    if (!currentUser || currentUser.tipo_usuario !== 'cliente' || !recipeData) return;

    try {
        const response = await fetch("api/client/favorite-recipes.php", {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
        });
        const result = await response.json();

        if (result.success) {
            const favorites = result.data;
            isFavorite = favorites.some(recipe => recipe.id === recipeData.id);
            updateFavoriteButton();
        }
    } catch (error) {
        console.error("Error checking favorites:", error);
    }
}

// Update favorite button based on favorite status
function updateFavoriteButton() {
    const favBtn = document.getElementById('addToFavoritesBtn');
    if (!favBtn) return;

    if (isFavorite) {
        favBtn.innerHTML = '<i class="fas fa-heart"></i> Quitar de Favoritos';
        favBtn.classList.add("active");
    } else {
        favBtn.innerHTML = '<i class="far fa-heart"></i> Añadir a Favoritos';
        favBtn.classList.remove("active");
    }
}

// Toggle favorite status
async function toggleFavorite() {
    if (!currentUser) {
        showToast("Debes iniciar sesión para añadir a favoritos", "warning");
        openModal("loginModal");
        return;
    }

    if (currentUser.tipo_usuario !== 'cliente') {
        showToast("Solo los clientes pueden añadir recetas a favoritos", "warning");
        return;
    }

    if (!recipeData) return;

    try {
        showLoading();
        
        if (isFavorite) {
            // Remove from favorites
            const response = await fetch("api/client/remove-favorite.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                },
                body: JSON.stringify({ type: "recipe", id: recipeData.id }),
            });
            
            const result = await response.json();
            
            if (result.success) {
                isFavorite = false;
                showToast("Receta eliminada de favoritos", "success");
            } else {
                showToast(result.message || "Error al eliminar de favoritos", "error");
            }
        } else {
            // Add to favorites
            const response = await fetch("api/client/add-favorite.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                },
                body: JSON.stringify({ type: "recipe", id: recipeData.id }),
            });
            
            const result = await response.json();
            
            if (result.success) {
                isFavorite = true;
                showToast("Receta añadida a favoritos", "success");
            } else {
                showToast(result.message || "Error al añadir a favoritos", "error");
            }
        }
        
        updateFavoriteButton();
    } catch (error) {
        console.error("Error toggling favorite:", error);
        showToast("Error al actualizar favoritos", "error");
    } finally {
        hideLoading();
    }
}

// Buy recipe function
function buyRecipe() {
    if (!currentUser) {
        showToast("Debes iniciar sesión para comprar una receta", "warning");
        openModal("loginModal");
        return;
    }

    if (currentUser.tipo_usuario !== 'cliente') {
        showToast("Solo los clientes pueden comprar recetas", "warning");
        return;
    }

    if (!recipeData) return;

    // This is a placeholder - you'll need to implement the purchase functionality
    showToast("Funcionalidad de compra en desarrollo", "info");
}

// View chef profile function
function viewChefProfile(chefId) {
    localStorage.setItem("selectedChefId", chefId);
    window.location.href = "chef-profile.html";
}

// View recipe function
function viewRecipe(recipeId) {
    localStorage.setItem("selectedRecipeId", recipeId);
    window.location.href = "recipe-detail.html";
}

// Tab navigation
function activateTab(tabId) {
    // Hide all tab panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    
    // Deactivate all tab buttons
    document.querySelectorAll('.recipe-nav-btn').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Activate selected tab button and panel
    document.getElementById(`${tabId}Content`).classList.add('active');
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
}

// Format date
function formatDate(dateString) {
    return new Intl.DateTimeFormat("es-SV", {
        year: "numeric",
        month: "long",
        day: "numeric",
    }).format(new Date(dateString));
}

// Show loading indicator
function showLoading() {
    const loader = document.createElement("div");
    loader.id = "globalLoader";
    loader.className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
    loader.innerHTML = '<div class="loading-spinner"></div>';
    document.body.appendChild(loader);
}

// Hide loading indicator
function hideLoading() {
    const loader = document.getElementById("globalLoader");
    if (loader) {
        document.body.removeChild(loader);
    }
}

// Show toast notification
function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("show");
    }, 100);

    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}