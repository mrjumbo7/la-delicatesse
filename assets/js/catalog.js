// Catalog JavaScript file for La Délicatesse

// Initialize the catalog page
document.addEventListener("DOMContentLoaded", () => {
    checkAuthStatus()
    initializeCatalog()
    setupCatalogEventListeners()
})

// Initialize catalog based on current page
function initializeCatalog() {
    const path = window.location.pathname
    if (path.includes('chefs-catalog')) {
        loadAllChefs()
    } else if (path.includes('recipes-catalog')) {
        loadAllRecipes()
    }
}

// Setup catalog specific event listeners
function setupCatalogEventListeners() {
    // Search functionality for recipes
    const searchRecipes = document.getElementById("searchRecipes")
    if (searchRecipes) {
        searchRecipes.addEventListener("input", debounce(filterRecipes, 300))
    }

    // Search functionality for chefs
    const searchChefs = document.getElementById("searchChefs")
    if (searchChefs) {
        searchChefs.addEventListener("input", debounce(searchChefsCatalog, 300))
    }

    // Filter event listeners for recipes
    const filterPrice = document.getElementById("filterPrice")
    const filterDifficulty = document.getElementById("filterDifficulty")
    const filterTime = document.getElementById("filterTime")

    if (filterPrice) filterPrice.addEventListener("change", filterRecipes)
    if (filterDifficulty) filterDifficulty.addEventListener("change", filterRecipes)
    if (filterTime) filterTime.addEventListener("change", filterRecipes)

    // Filter event listeners for chefs
    const filterLocation = document.getElementById("filterLocation")
    const filterSpecialty = document.getElementById("filterSpecialty")

    if (filterLocation) filterLocation.addEventListener("change", searchChefsCatalog)
    if (filterSpecialty) filterSpecialty.addEventListener("change", searchChefsCatalog)
}

// Load all chefs for catalog
async function loadAllChefs() {
    try {
        const response = await fetch("api/chefs/list.php")
        const result = await response.json()

        if (result.success) {
            chefs = result.data
            displayChefsCatalog(chefs)
        }
    } catch (error) {
        console.error("Error loading chefs:", error)
        showToast("Error al cargar los chefs", "error")
    }
}

// View chef profile
function viewChefProfile(chefId) {
    window.location.href = `chef-profile.html?id=${chefId}`;
}

// Display chefs in catalog
function displayChefsCatalog(chefsToShow) {
    const chefsGrid = document.getElementById("chefsGrid")
    if (!chefsGrid) return

    if (chefsToShow.length === 0) {
        chefsGrid.innerHTML = '<p class="text-center col-span-full" style="color: var(--text-light);">No se encontraron chefs.</p>'
        return
    }

    // Ordenar chefs por calificación
    const sortedChefs = chefsToShow.sort((a, b) => b.calificacion_promedio - a.calificacion_promedio)

    chefsGrid.innerHTML = sortedChefs.map(chef => `
        <div class="chef-card">
            <div class="chef-image">
                <img src="${chef.foto_perfil || '/placeholder.svg?height=350&width=300'}" 
                     alt="Chef ${chef.nombre}">
                <div class="chef-overlay">
                    <button onclick="viewChefProfile(${chef.id})" class="btn btn-light">
                        Ver Perfil
                    </button>
                </div>
            </div>
            <div class="chef-info">
                <h3>${chef.nombre}</h3>
                <div class="chef-title">${chef.especialidad}</div>
                <p class="specialty">${chef.biografia || 'Chef profesional con experiencia en alta cocina'}</p>
                
                <div class="chef-meta">
                    <div class="rating">
                        <div class="stars">${generateStars(chef.calificacion_promedio)}</div>
                        <div class="reviews">(${chef.total_servicios} servicios)</div>
                    </div>
                    <div class="chef-location">${chef.ubicacion}</div>
                </div>
                
                <div class="mt-4 flex gap-2">
                    <button onclick="viewChefProfile(${chef.id})" class="btn btn-primary flex-1">
                        Ver Perfil
                    </button>
                    <button onclick="contactChef(${chef.id})" class="btn btn-outline flex-1">
                        Contactar
                    </button>
                </div>
            </div>
        </div>
    `).join('')
}

// Search chefs in catalog
function searchChefsCatalog() {
    const searchTerm = document.getElementById("searchChefs")?.value.toLowerCase() || ""
    const locationFilter = document.getElementById("filterLocation")?.value || ""
    const specialtyFilter = document.getElementById("filterSpecialty")?.value || ""

    const filteredChefs = chefs.filter(chef => {
        const matchesSearch = chef.nombre.toLowerCase().includes(searchTerm) || 
                            chef.especialidad.toLowerCase().includes(searchTerm)
        const matchesLocation = !locationFilter || chef.ubicacion === locationFilter
        const matchesSpecialty = !specialtyFilter || chef.especialidad === specialtyFilter

        return matchesSearch && matchesLocation && matchesSpecialty
    })

    displayChefsCatalog(filteredChefs)
}

// Load all recipes for catalog
async function loadAllRecipes() {
    try {
        const response = await fetch("api/recipes/list.php")
        const result = await response.json()

        if (result.success) {
            recipes = result.data
            displayRecipesCatalog(recipes)
        }
    } catch (error) {
        console.error("Error loading recipes:", error)
        showToast("Error al cargar las recetas", "error")
    }
}

// Display recipes in catalog
function displayRecipesCatalog(recipesToShow) {
    const recetasGrid = document.getElementById("recetasGrid")
    if (!recetasGrid) return

    if (recipesToShow.length === 0) {
        recetasGrid.innerHTML = '<p class="text-center col-span-full" style="color: var(--text-light);">No se encontraron recetas.</p>'
        return
    }

    // Ordenar recetas por calificación
    const sortedRecipes = recipesToShow.sort((a, b) => b.calificacion_promedio - a.calificacion_promedio)

    recetasGrid.innerHTML = sortedRecipes.map(recipe => `
        <div class="recipe-card">
            <div class="recipe-image">
                <img src="${recipe.imagen || '/placeholder.svg?height=220&width=300'}" 
                     alt="${recipe.titulo}">
                <div class="recipe-badge">${recipe.dificultad}</div>
            </div>
            <div class="recipe-info">
                <div class="recipe-category">Por ${recipe.chef_nombre}</div>
                <h3>${recipe.titulo}</h3>
                <p class="chef">${recipe.descripcion || 'Receta deliciosa y fácil de preparar'}</p>
                
                <div class="recipe-meta">
                    <span>⏱️ ${recipe.tiempo_preparacion} min</span>
                    <span class="accent-text font-bold">$${recipe.precio}</span>
                </div>
                
                <div class="recipe-rating">
                    <div class="stars">${generateStars(recipe.calificacion_promedio)}</div>
                    <span class="reviews">(${recipe.total_compras || 0} compras)</span>
                </div>
                
                <button onclick="viewRecipe(${recipe.id})" class="btn btn-primary btn-block">
                    Ver Receta
                </button>
            </div>
        </div>
    `).join('')
}

// View recipe function - opens modal instead of redirecting
function viewRecipe(recipeId) {
    // Check if user is authenticated
    const user = JSON.parse(localStorage.getItem('user') || 'null')
    
    if (!user) {
        showToast('Debes iniciar sesión para ver los detalles de las recetas', 'warning')
        openModal('loginModal')
        return
    }
    
    // Load recipe data and open modal
    loadRecipeModal(recipeId)
}

// Load recipe data for modal
async function loadRecipeModal(recipeId) {
    try {
        showLoading()
        
        const response = await fetch(`api/recipes/list.php?id=${recipeId}`)
        const result = await response.json()
        
        if (result.success && result.data.length > 0) {
            const recipe = result.data[0]
            populateRecipeModal(recipe)
            openModal('recipeModal')
        } else {
            showToast('No se pudo cargar la información de la receta', 'error')
        }
    } catch (error) {
        console.error('Error loading recipe:', error)
        showToast('Error al cargar la receta', 'error')
    } finally {
        hideLoading()
    }
}

// Populate recipe modal with data
function populateRecipeModal(recipe) {
    // Update modal content
    document.getElementById('modalRecipeTitle').textContent = recipe.titulo
    document.getElementById('modalRecipeChef').textContent = `Por Chef ${recipe.chef_nombre}`
    document.getElementById('modalRecipeTime').textContent = `${recipe.tiempo_preparacion} min`
    document.getElementById('modalRecipeDifficulty').textContent = recipe.dificultad
    document.getElementById('modalRecipePrice').textContent = formatCurrency(recipe.precio)
    document.getElementById('modalRecipeDescription').textContent = recipe.descripcion
    
    // Update image
    const modalImage = document.getElementById('modalRecipeImage')
    modalImage.src = recipe.imagen || '/placeholder.svg?height=300&width=400'
    modalImage.alt = recipe.titulo
    
    // Update ingredients
    const ingredientsList = document.getElementById('modalRecipeIngredients')
    if (recipe.ingredientes) {
        const ingredients = recipe.ingredientes.split('\n').filter(ing => ing.trim())
        if (ingredients.length > 0) {
            ingredientsList.innerHTML = ingredients.map(ingredient => 
                `<li>${ingredient.trim()}</li>`
            ).join('')
        } else {
            ingredientsList.innerHTML = '<li>No hay ingredientes disponibles</li>'
        }
    } else {
        ingredientsList.innerHTML = '<li>No hay ingredientes disponibles</li>'
    }
    
    // Update instructions
    const instructionsList = document.getElementById('modalRecipeInstructions')
    if (recipe.instrucciones) {
        const instructions = recipe.instrucciones.split('\n').filter(inst => inst.trim())
        if (instructions.length > 0) {
            instructionsList.innerHTML = instructions.map((instruction, index) => 
                `<li>${instruction.trim()}</li>`
            ).join('')
        } else {
            instructionsList.innerHTML = '<li>No hay instrucciones disponibles</li>'
        }
    } else {
        instructionsList.innerHTML = '<li>No hay instrucciones disponibles</li>'
    }
    
    // Setup buy button
    const buyBtn = document.getElementById('modalBuyRecipeBtn')
    buyBtn.onclick = () => buyRecipe(recipe.id)
    
    // Setup favorites button
    const favBtn = document.getElementById('modalAddToFavoritesBtn')
    favBtn.onclick = () => addToFavorites(recipe.id)
}

// Buy recipe function
function buyRecipe(recipeId) {
    const user = JSON.parse(localStorage.getItem('user') || 'null')
    
    if (!user) {
        showToast('Debes iniciar sesión para comprar recetas', 'warning')
        closeModal('recipeModal')
        openModal('loginModal')
        return
    }
    
    // Here you would implement the actual purchase logic
    showToast('Funcionalidad de compra en desarrollo', 'info')
}

// Add to favorites function
function addToFavorites(recipeId) {
    const user = JSON.parse(localStorage.getItem('user') || 'null')
    
    if (!user) {
        showToast('Debes iniciar sesión para añadir a favoritos', 'warning')
        closeModal('recipeModal')
        openModal('loginModal')
        return
    }
    
    // Here you would implement the actual favorites logic
    showToast('Receta añadida a favoritos', 'success')
}

// Filter recipes in catalog
function filterRecipes() {
    const searchTerm = document.getElementById("searchRecipes")?.value.toLowerCase() || ""
    const priceFilter = document.getElementById("filterPrice")?.value || ""
    const difficultyFilter = document.getElementById("filterDifficulty")?.value || ""
    const timeFilter = parseInt(document.getElementById("filterTime")?.value) || 0

    const filteredRecipes = recipes.filter(recipe => {
        const matchesSearch = recipe.titulo.toLowerCase().includes(searchTerm) || 
                             recipe.ingredientes.toLowerCase().includes(searchTerm)

        const matchesPrice = !priceFilter || 
            (priceFilter === "low" && recipe.precio <= 20) ||
            (priceFilter === "medium" && recipe.precio > 20 && recipe.precio <= 50) ||
            (priceFilter === "high" && recipe.precio > 50)

        const matchesDifficulty = !difficultyFilter || recipe.dificultad === difficultyFilter

        const matchesTime = !timeFilter || 
            (timeFilter === 30 && recipe.tiempo_preparacion <= 30) ||
            (timeFilter === 60 && recipe.tiempo_preparacion <= 60) ||
            (timeFilter === 120 && recipe.tiempo_preparacion <= 120) ||
            (timeFilter === 121 && recipe.tiempo_preparacion > 120)

        return matchesSearch && matchesPrice && matchesDifficulty && matchesTime
    })

    displayRecipesCatalog(filteredRecipes)
}