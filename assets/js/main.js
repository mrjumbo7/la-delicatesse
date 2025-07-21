// Main JavaScript file for La Délicatesse

// Global variables
let currentUser = null
let chefs = []
let recipes = []

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  checkAuthStatus()
  loadChefs()
  loadRecipes()
  setupEventListeners()
  initializeAnimations()
})

// Check if user is authenticated
function checkAuthStatus() {
  const token = localStorage.getItem("authToken")
  const userData = localStorage.getItem("userData")

  if (token && userData) {
    currentUser = JSON.parse(userData)
    updateUIForLoggedInUser()
  }
}

// Update UI for logged in user
function updateUIForLoggedInUser() {
  const authButtons = document.getElementById("authButtons")

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
      `
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
      `
    }
  }
}

// Setup event listeners
function setupEventListeners() {
  // Search functionality for chefs
  const searchInput = document.getElementById("searchChefs")
  if (searchInput) {
    searchInput.addEventListener("input", debounce(searchChefs, 300))
  }

  // Filter functionality for chefs
  const filterLocation = document.getElementById("filterLocation")
  if (filterLocation) {
    filterLocation.addEventListener("change", searchChefs)
  }

  // Filter functionality for recipes
  const filterPrice = document.getElementById("filterPrice")
  const filterDifficulty = document.getElementById("filterDifficulty")

  if (filterPrice) {
    filterPrice.addEventListener("change", filterRecipes)
  }

  if (filterDifficulty) {
    filterDifficulty.addEventListener("change", filterRecipes)
  }
}

// Initialize animations
function initializeAnimations() {
  // Reveal animations on scroll
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("active")
      }
    })
  }, observerOptions)

  // Observe elements for reveal animation
  document.querySelectorAll(".chef-card, .recipe-card, .section-header").forEach((el) => {
    el.classList.add("reveal")
    observer.observe(el)
  })
}

// Mobile menu toggle function
function toggleMobileMenu() {
  const navContainer = document.querySelector(".nav-container")
  const overlay = document.getElementById("mobileMenuOverlay")
  const menuIcon = document.getElementById("menuIcon")
  const closeIcon = document.getElementById("closeIcon")

  if (navContainer.classList.contains("active")) {
    // Close menu
    navContainer.classList.remove("active")
    overlay.classList.remove("active")
    menuIcon.style.display = "inline"
    closeIcon.style.display = "none"
    document.body.style.overflow = "auto"
  } else {
    // Open menu
    navContainer.classList.add("active")
    overlay.classList.add("active")
    menuIcon.style.display = "none"
    closeIcon.style.display = "inline"
    document.body.style.overflow = "hidden"
  }
}

// Close mobile menu when overlay is clicked
document.addEventListener("click", (e) => {
  if (e.target.id === "mobileMenuOverlay") {
    toggleMobileMenu()
  }
})

// Debounce function for search
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Modal functions
function openModal(modalId) {
  const modal = document.getElementById(modalId)
  if (modal) {
    modal.classList.remove("hidden")
    document.body.style.overflow = "hidden"
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId)
  if (modal) {
    modal.classList.add("hidden")
    document.body.style.overflow = "auto"
  }
}

// Smooth scroll to section
function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId)
  if (section) {
    section.scrollIntoView({ behavior: "smooth" })
  }
}

// Authentication functions
async function handleLogin(event) {
  event.preventDefault()
  const formData = new FormData(event.target)

  try {
    showLoading()
    const response = await fetch("api/auth/login.php", {
      method: "POST",
      body: formData,
    })

    const result = await response.json()

    if (result.success) {
      localStorage.setItem("authToken", result.token)
      localStorage.setItem("userData", JSON.stringify(result.user))
      currentUser = result.user

      showToast("Inicio de sesión exitoso", "success")
      closeModal("loginModal")

      // Redirect based on user type
      if (currentUser.tipo_usuario === "chef") {
        setTimeout(() => {
          window.location.href = "dashboard.html"
        }, 1000)
      } else if (currentUser.tipo_usuario === "cliente") {
        setTimeout(() => {
          window.location.href = "user-profile.html"
        }, 1000)
      } else {
        updateUIForLoggedInUser()
      }
    } else {
      showToast(result.message || "Error al iniciar sesión", "error")
    }
  } catch (error) {
    console.error("Login error:", error)
    showToast("Error de conexión", "error")
  } finally {
    hideLoading()
  }
}

async function handleRegister(event) {
  event.preventDefault()
  const formData = new FormData(event.target)

  try {
    showLoading()
    const response = await fetch("api/auth/register.php", {
      method: "POST",
      body: formData,
    })

    const result = await response.json()

    if (result.success) {
      showToast("Registro exitoso. Por favor inicia sesión.", "success")
      closeModal("registerModal")
      openModal("loginModal")
    } else {
      showToast(result.message || "Error al registrarse", "error")
    }
  } catch (error) {
    console.error("Register error:", error)
    showToast("Error de conexión", "error")
  } finally {
    hideLoading()
  }
}

function logout() {
  localStorage.removeItem("authToken")
  localStorage.removeItem("userData")
  currentUser = null
  showToast("Sesión cerrada exitosamente", "info")
  window.location.href = "index.html"
}

// Load chefs data
async function loadChefs() {
  try {
    const response = await fetch("api/chefs/list.php")
    const result = await response.json()

    if (result.success) {
      // Ordenar chefs por calificación promedio de mayor a menor
      chefs = result.data.sort((a, b) => b.calificacion_promedio - a.calificacion_promedio)
      // Mostrar solo los primeros 4 chefs
      displayChefs(chefs.slice(0, 4))
    }
  } catch (error) {
    console.error("Error loading chefs:", error)
  }
}

// Display chefs
function displayChefs(chefsToShow) {
  const chefsGrid = document.getElementById("chefsGrid")
  if (!chefsGrid) return

  if (chefsToShow.length === 0) {
    chefsGrid.innerHTML =
      '<p class="text-center col-span-full" style="color: var(--text-light);">No se encontraron chefs.</p>'
    return
  }

  chefsGrid.innerHTML = chefsToShow
    .map(
      (chef) => `
        <div class="chef-card">
            <div class="chef-image">
                <img src="${chef.foto_perfil || "/placeholder.svg?height=350&width=300"}" 
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
                <p class="specialty">${chef.biografia || "Chef profesional con experiencia en alta cocina"}</p>
                
                <div class="chef-meta">
                    <div class="rating">
                        <div class="stars">
                            ${generateStars(chef.calificacion_promedio)}
                        </div>
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
    `,
    )
    .join("")
}

// View chef profile
function viewChefProfile(chefId) {
    window.location.href = `chef-profile.html?id=${chefId}`;
}

// Generate star rating HTML
function generateStars(rating) {
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 !== 0
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

  let starsHTML = ""

  // Full stars
  for (let i = 0; i < fullStars; i++) {
    starsHTML += '<span class="star">★</span>'
  }

  // Half star
  if (hasHalfStar) {
    starsHTML += '<span class="star">☆</span>'
  }

  // Empty stars
  for (let i = 0; i < emptyStars; i++) {
    starsHTML += '<span class="star empty">☆</span>'
  }

  return starsHTML
}

// View chef profile
function viewChefProfile(chefId) {
  window.location.href = `chef-profile.html?id=${chefId}`;
}

// Search chefs
function searchChefs() {
  const searchTerm = document.getElementById("searchChefs")?.value.toLowerCase() || ""
  const locationFilter = document.getElementById("filterLocation")?.value || ""

  const filteredChefs = chefs.filter((chef) => {
    const matchesSearch =
      chef.especialidad.toLowerCase().includes(searchTerm) || chef.nombre.toLowerCase().includes(searchTerm)
    const matchesLocation = !locationFilter || chef.ubicacion === locationFilter

    return matchesSearch && matchesLocation
  })

  // Ordenar por calificación y mostrar solo los 4 mejores
  const topChefs = filteredChefs
    .sort((a, b) => b.calificacion_promedio - a.calificacion_promedio)
    .slice(0, 4)

  displayChefs(topChefs)
}

// Load recipes data
async function loadRecipes() {
  try {
    const response = await fetch("api/recipes/list.php")
    const result = await response.json()

    if (result.success) {
      // Ordenar recetas por calificación promedio de mayor a menor
      recipes = result.data.sort((a, b) => b.calificacion_promedio - a.calificacion_promedio)
      // Mostrar solo las primeras 4 recetas
      displayRecipes(recipes.slice(0, 4))
    }
  } catch (error) {
    console.error("Error loading recipes:", error)
  }
}

// Función para filtrar recetas
function filterRecipes() {
  const priceFilter = document.getElementById("filterPrice")?.value || ""
  const difficultyFilter = document.getElementById("filterDifficulty")?.value || ""

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesPrice = !priceFilter || 
      (priceFilter === "low" && recipe.precio <= 20) ||
      (priceFilter === "medium" && recipe.precio > 20 && recipe.precio <= 50) ||
      (priceFilter === "high" && recipe.precio > 50)

    const matchesDifficulty = !difficultyFilter || recipe.dificultad === difficultyFilter

    return matchesPrice && matchesDifficulty
  })

  // Ordenar por calificación y mostrar solo las 4 mejores
  const topRecipes = filteredRecipes
    .sort((a, b) => b.calificacion_promedio - a.calificacion_promedio)
    .slice(0, 4)

  displayRecipes(topRecipes)
}

// Display recipes
function displayRecipes(recipesToShow) {
  const recetasGrid = document.getElementById("recetasGrid")
  if (!recetasGrid) return

  if (recipesToShow.length === 0) {
    recetasGrid.innerHTML =
      '<p class="text-center col-span-full" style="color: var(--text-light);">No se encontraron recetas.</p>'
    return
  }

  recetasGrid.innerHTML = recipesToShow
    .map(
      (recipe) => `
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
    `,
    )
    .join("")
}

// Chef profile functions
function viewChefProfile(chefId) {
  localStorage.setItem("selectedChefId", chefId)
  window.location.href = "chef-profile.html"
}

function contactChef(chefId) {
  if (!currentUser) {
    showToast("Debes iniciar sesión para contactar un chef", "warning")
    openModal("loginModal")
    return
  }

  localStorage.setItem("selectedChefId", chefId)
  window.location.href = "booking.html"
}

// Recipe functions
function viewRecipe(recipeId) {
  localStorage.setItem("selectedRecipeId", recipeId)
  window.location.href = "recipe-detail.html"
}

// Utility functions
function showToast(message, type = "info") {
  const toast = document.createElement("div")
  toast.className = `toast ${type}`
  toast.textContent = message

  document.body.appendChild(toast)

  setTimeout(() => {
    toast.classList.add("show")
  }, 100)

  setTimeout(() => {
    toast.classList.remove("show")
    setTimeout(() => {
      document.body.removeChild(toast)
    }, 300)
  }, 3000)
}

function showLoading() {
  const loader = document.createElement("div")
  loader.id = "globalLoader"
  loader.className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
  loader.innerHTML = '<div class="loading-spinner"></div>'
  document.body.appendChild(loader)
}

function hideLoading() {
  const loader = document.getElementById("globalLoader")
  if (loader) {
    document.body.removeChild(loader)
  }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("es-SV", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat("es-SV", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(dateString))
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

function validatePhone(phone) {
  const re = /^\d{4}-\d{4}$/
  return re.test(phone)
}
