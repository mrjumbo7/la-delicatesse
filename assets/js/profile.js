// JavaScript para la página de perfil de usuario

// Variables globales
// currentUser is declared globally in main.js
let userPreferences = []
let favoriteChefs = []
let favoriteRecipes = []
let userReviews = []

// Inicializar la página
document.addEventListener("DOMContentLoaded", async () => {
  await checkAuthStatus()
  setupEventListeners()
  
  // Configurar navegación entre tabs
  document.querySelectorAll('.profile-nav-item').forEach(item => {
    item.addEventListener('click', function() {
      const tabId = this.getAttribute('data-tab')
      showTab(tabId)
    })
  })
  
  // Configurar formularios
  const profileForm = document.getElementById('profileForm')
  if (profileForm) {
    profileForm.addEventListener('submit', updateProfile)
  }
  
  const preferencesForm = document.getElementById('preferencesForm')
  if (preferencesForm) {
    preferencesForm.addEventListener('submit', updatePreferences)
  }
  
  // Configurar botón para añadir preferencias
  const addPrefButton = document.getElementById('addPreferenceBtn')
  if (addPrefButton) {
    addPrefButton.addEventListener('click', addPreference)
  }
})

// Verificar si el usuario está autenticado
async function checkAuthStatus() {
  const token = localStorage.getItem("authToken")
  const userData = localStorage.getItem("userData")

  if (token && userData) {
    try {
      // Validate token with server
      const response = await fetch("api/auth/validate.php", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      const result = await response.json()

      if (!result.success) {
        // Token is invalid, redirect to index
        localStorage.removeItem("authToken")
        localStorage.removeItem("userData")
        window.location.href = "index.html"
        return
      }
    } catch (error) {
      console.error("Error validating token:", error)
      // On network error, continue but user might face issues with API calls
    }
    
    currentUser = JSON.parse(userData)
    
    // Verificar si el usuario es cliente
    if (currentUser.tipo_usuario !== "cliente") {
      // Redirigir a la página principal si no es cliente
      window.location.href = "index.html"
      return
    }
    
    updateUIForLoggedInUser()
    loadUserProfile()
    loadUserPreferences()
    loadFavoriteChefs()
    loadFavoriteRecipes()
    loadUserReviews()
  } else {
    // Redirigir a la página principal si no hay sesión
    window.location.href = "index.html"
  }
}

// Actualizar UI para usuario con sesión
function updateUIForLoggedInUser() {
  const authButtons = document.getElementById("authButtons")
  const userName = document.getElementById("userName")
  const userEmail = document.getElementById("userEmail")

  if (authButtons && currentUser) {
    authButtons.innerHTML = `
      <div class="flex items-center space-x-4">
        <span class="font-medium">Hola, ${currentUser.nombre}</span>
        <a href="user-profile.html" class="btn btn-primary">
          Mi Perfil
        </a>
        <button onclick="logout()" class="btn btn-outline-sm text-red-600 hover:text-red-800">
          Cerrar Sesión
        </button>
      </div>
    `
  }
  
  // Actualizar nombre y email en el sidebar
  if (userName && currentUser) {
    userName.textContent = currentUser.nombre
  }
  
  if (userEmail && currentUser) {
    userEmail.textContent = currentUser.email
  }
}

// Configurar event listeners
function setupEventListeners() {
  // Manejar cambio de foto de perfil
  const fotoPerfilInput = document.getElementById("foto_perfil")
  if (fotoPerfilInput) {
    fotoPerfilInput.addEventListener("change", previewProfileImage)
  }
  
  // Configurar navegación entre tabs
  document.querySelectorAll('.profile-nav-item').forEach(item => {
    item.addEventListener('click', function() {
      const tabId = this.getAttribute('data-tab')
      showTab(tabId)
    })
  })
  
  // Configurar input de nueva preferencia para manejar Enter
  const newPrefInput = document.getElementById("newPreference")
  if (newPrefInput) {
    newPrefInput.addEventListener('keypress', function(event) {
      if (event.key === 'Enter') {
        event.preventDefault()
        addPreference()
      }
    })
  }
}

// Previsualizar imagen de perfil
function previewProfileImage(event) {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = function(e) {
      document.getElementById("profileImage").src = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

// Cargar perfil del usuario
async function loadUserProfile() {
  try {
    // Mostrar indicador de carga
    showLoading()

    const response = await fetch("api/profile/get.php", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    })

    const result = await response.json()

    if (result.success) {
      const profile = result.data
      
      // Actualizar información en la UI
      document.getElementById("userName").textContent = profile.nombre
      document.getElementById("userEmail").textContent = profile.email
      
      // Actualizar foto de perfil si existe
      if (profile.foto_perfil) {
        document.getElementById("profileImage").src = profile.foto_perfil
        
        // También actualizar foto en la barra lateral si existe
        const sidebarProfilePic = document.getElementById("sidebarProfilePic")
        if (sidebarProfilePic) {
          sidebarProfilePic.src = profile.foto_perfil
        }
      }
      
      // Llenar formulario de perfil
      document.getElementById("nombre").value = profile.nombre || ""
      document.getElementById("email").value = profile.email || ""
      document.getElementById("telefono").value = profile.telefono || ""
      document.getElementById("direccion").value = profile.direccion || ""
      
      // Si hay fecha de nacimiento, llenarla también
      if (profile.fecha_nacimiento) {
        const fechaNacInput = document.getElementById("fecha_nacimiento")
        if (fechaNacInput) {
          fechaNacInput.value = profile.fecha_nacimiento
        }
      }
    }
  } catch (error) {
    console.error("Error loading profile:", error)
    showToast("Error al cargar el perfil. Por favor, intenta de nuevo más tarde.", "error")
  } finally {
    hideLoading()
  }
}

// Cargar preferencias del usuario
async function loadUserPreferences() {
  try {
    const response = await fetch("api/client/preferences.php", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    })

    const result = await response.json()

    if (result.success) {
      // Filtrar solo las preferencias personalizadas para mostrar en la lista
      userPreferences = result.data.filter(pref => pref.tipo === 'custom')
      displayUserPreferences()
      
      // Marcar checkboxes de tipos de cocina y restricciones
      if (result.cuisine_types) {
        result.cuisine_types.forEach(type => {
          const checkbox = document.querySelector(`input[name="cuisine_type[]"][value="${type}"]`)
          if (checkbox) checkbox.checked = true
        })
      }
      
      if (result.dietary_restrictions) {
        result.dietary_restrictions.forEach(restriction => {
          const checkbox = document.querySelector(`input[name="dietary_restrictions[]"][value="${restriction}"]`)
          if (checkbox) checkbox.checked = true
        })
      }
    }
  } catch (error) {
    console.error("Error loading preferences:", error)
    showToast("Error al cargar preferencias", "error")
  }
}

// Mostrar preferencias del usuario
function displayUserPreferences() {
  const preferencesContainer = document.getElementById("userPreferences")
  if (!preferencesContainer) return

  if (userPreferences.length === 0) {
    preferencesContainer.innerHTML = '<p class="text-gray-500">No has añadido preferencias aún.</p>'
    return
  }

  preferencesContainer.innerHTML = userPreferences
    .map(
      (pref) => `
        <div class="preference-tag">
            ${pref.preferencia}
            <button type="button" onclick="removePreference('${pref.id}')" class="preference-remove">
                &times;
            </button>
        </div>
      `
    )
    .join("")
}

// Añadir nueva preferencia
async function addPreference() {
  const newPrefInput = document.getElementById("newPreference")
  const preference = newPrefInput.value.trim()
  
  if (!preference) {
    showToast("Por favor ingresa una preferencia", "warning")
    return
  }
  
  // Verificar si la preferencia ya existe
  if (userPreferences.some(pref => pref.preferencia.toLowerCase() === preference.toLowerCase())) {
    showToast("Esta preferencia ya existe", "warning")
    return
  }
  
  try {
    showLoading()
    
    // Crear FormData con todas las preferencias actuales más la nueva
    const formData = new FormData()
    
    // Añadir preferencias existentes
    userPreferences.forEach((pref, index) => {
      formData.append(`preferences[${index}]`, pref.preferencia)
    })
    
    // Añadir nueva preferencia
    formData.append(`preferences[${userPreferences.length}]`, preference)
    
    // Mantener tipos de cocina y restricciones seleccionadas
    const cuisineCheckboxes = document.querySelectorAll('input[name="cuisine_type[]"]:checked')
    cuisineCheckboxes.forEach(checkbox => {
      formData.append('cuisine_type[]', checkbox.value)
    })
    
    const restrictionCheckboxes = document.querySelectorAll('input[name="dietary_restrictions[]"]:checked')
    restrictionCheckboxes.forEach(checkbox => {
      formData.append('dietary_restrictions[]', checkbox.value)
    })
    
    const response = await fetch("api/client/update-preferences.php", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: formData,
    })

    const result = await response.json()

    if (result.success) {
      // Añadir a la lista local
      const tempId = Date.now().toString()
      userPreferences.push({ id: tempId, preferencia: preference, tipo: 'custom' })
      displayUserPreferences()
      
      // Limpiar input
      newPrefInput.value = ""
      
      showToast("Preferencia añadida exitosamente", "success")
    } else {
      showToast(result.message || "Error al añadir preferencia", "error")
    }
  } catch (error) {
    console.error("Add preference error:", error)
    showToast("Error de conexión", "error")
  } finally {
    hideLoading()
  }
}

// Eliminar preferencia
async function removePreference(prefId) {
  try {
    showLoading()
    
    // Filtrar la preferencia a eliminar
    const updatedPreferences = userPreferences.filter(pref => pref.id !== prefId)
    
    // Crear FormData con las preferencias restantes
    const formData = new FormData()
    
    // Añadir preferencias restantes
    updatedPreferences.forEach((pref, index) => {
      formData.append(`preferences[${index}]`, pref.preferencia)
    })
    
    // Mantener tipos de cocina y restricciones seleccionadas
    const cuisineCheckboxes = document.querySelectorAll('input[name="cuisine_type[]"]:checked')
    cuisineCheckboxes.forEach(checkbox => {
      formData.append('cuisine_type[]', checkbox.value)
    })
    
    const restrictionCheckboxes = document.querySelectorAll('input[name="dietary_restrictions[]"]:checked')
    restrictionCheckboxes.forEach(checkbox => {
      formData.append('dietary_restrictions[]', checkbox.value)
    })
    
    const response = await fetch("api/client/update-preferences.php", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: formData,
    })

    const result = await response.json()

    if (result.success) {
      // Actualizar lista local
      userPreferences = updatedPreferences
      displayUserPreferences()
      
      showToast("Preferencia eliminada exitosamente", "success")
    } else {
      showToast(result.message || "Error al eliminar preferencia", "error")
    }
  } catch (error) {
    console.error("Remove preference error:", error)
    showToast("Error de conexión", "error")
  } finally {
    hideLoading()
  }
}

// Cargar chefs favoritos
async function loadFavoriteChefs() {
  try {
    const response = await fetch("api/client/favorites.php", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    })

    const result = await response.json()

    if (result.success) {
      favoriteChefs = result.data
      displayFavoriteChefs()
    }
  } catch (error) {
    console.error("Error loading favorite chefs:", error)
    showToast("Error al cargar chefs favoritos", "error")
  }
}

// Mostrar chefs favoritos
function displayFavoriteChefs() {
  const chefsContainer = document.getElementById("favoriteChefs")
  if (!chefsContainer) return

  if (favoriteChefs.length === 0) {
    chefsContainer.innerHTML = '<p class="text-gray-500 col-span-full text-center">No tienes chefs favoritos.</p>'
    return
  }

  chefsContainer.innerHTML = favoriteChefs
    .map(
      (chef) => `
        <div class="favorite-card">
            <div class="favorite-image">
                <img src="${chef.foto_perfil || "/placeholder.svg?height=100&width=100"}" 
                     alt="Chef ${chef.nombre}">
            </div>
            <div class="favorite-info">
                <h4>${chef.nombre}</h4>
                <p>${chef.especialidad || "Chef Profesional"}</p>
                <div class="favorite-rating">
                    <span class="stars">${generateStars(chef.calificacion_promedio)}</span>
                    <span class="rating-value">${chef.calificacion_promedio || "N/A"}</span>
                </div>
                <div class="favorite-actions">
                    <button onclick="viewChefProfile(${chef.id})" class="btn btn-sm btn-outline">
                        Ver Perfil
                    </button>
                    <button onclick="removeFromFavorites('chef', ${chef.id})" class="btn btn-sm btn-danger">
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
      `
    )
    .join("")
}

// Cargar recetas favoritas
async function loadFavoriteRecipes() {
  try {
    const response = await fetch("api/client/favorite-recipes.php", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    })

    const result = await response.json()

    if (result.success) {
      favoriteRecipes = result.data
      displayFavoriteRecipes()
    }
  } catch (error) {
    console.error("Error loading favorite recipes:", error)
    showToast("Error al cargar recetas favoritas", "error")
  }
}

// Mostrar recetas favoritas
function displayFavoriteRecipes() {
  const recipesContainer = document.getElementById("favoriteRecipes")
  if (!recipesContainer) return

  if (favoriteRecipes.length === 0) {
    recipesContainer.innerHTML = '<p class="text-gray-500 col-span-full text-center">No tienes recetas favoritas.</p>'
    return
  }

  recipesContainer.innerHTML = favoriteRecipes
    .map(
      (recipe) => `
        <div class="favorite-card">
            <div class="favorite-image">
                <img src="${recipe.imagen || "/placeholder.svg?height=100&width=100"}" 
                     alt="${recipe.titulo}">
            </div>
            <div class="favorite-info">
                <h4>${recipe.titulo}</h4>
                <p>Chef: ${recipe.chef_nombre}</p>
                <div class="favorite-price">
                    $${recipe.precio ? parseFloat(recipe.precio).toFixed(2) : "N/A"}
                </div>
                <div class="favorite-actions">
                    <button onclick="viewRecipe(${recipe.id})" class="btn btn-sm btn-outline">
                        Ver Receta
                    </button>
                    <button onclick="removeFromFavorites('recipe', ${recipe.id})" class="btn btn-sm btn-danger">
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
      `
    )
    .join("")
}

// Cargar reseñas del usuario
async function loadUserReviews() {
  try {
    const response = await fetch("api/client/reviews.php", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    })

    const result = await response.json()

    if (result.success) {
      userReviews = result.data
      displayUserReviews()
    }
  } catch (error) {
    console.error("Error loading reviews:", error)
    showToast("Error al cargar reseñas", "error")
  }
}

// Mostrar reseñas del usuario
function displayUserReviews() {
  const reviewsContainer = document.getElementById("userReviews")
  if (!reviewsContainer) return

  if (userReviews.length === 0) {
    reviewsContainer.innerHTML = '<p class="text-gray-500 text-center">No has realizado reseñas aún.</p>'
    return
  }

  reviewsContainer.innerHTML = userReviews
    .map(
      (review) => `
        <div class="review-card">
            <div class="review-header">
                <div>
                    <h4>${review.chef_nombre}</h4>
                    <div class="review-date">${formatDate(review.fecha_calificacion)}</div>
                </div>
                <div class="review-rating">
                    <span class="stars">${generateStars(review.puntuacion)}</span>
                    <span class="rating-value">${review.puntuacion}</span>
                </div>
            </div>
            <div class="review-title">${review.titulo || "Sin título"}</div>
            <div class="review-content">${review.comentario}</div>
            <div class="review-actions">
                <button onclick="editReview(${review.id})" class="btn btn-sm btn-outline">
                    Editar
                </button>
                <button onclick="deleteReview(${review.id})" class="btn btn-sm btn-danger">
                    Eliminar
                </button>
            </div>
        </div>
      `
    )
    .join("")
}

// Actualizar perfil
async function updateProfile(event) {
  event.preventDefault()
  
  try {
    showLoading()
    
    const formData = new FormData(event.target)
    
    const response = await fetch("api/profile/update.php", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: formData,
    })

    const result = await response.json()

    if (result.success) {
      showToast("Perfil actualizado exitosamente", "success")
      
      // Actualizar datos del usuario en localStorage
      const userData = JSON.parse(localStorage.getItem("userData"))
      userData.nombre = formData.get("nombre")
      userData.email = formData.get("email")
      userData.telefono = formData.get("telefono")
      localStorage.setItem("userData", JSON.stringify(userData))
      
      // Actualizar UI
      document.getElementById("userName").textContent = userData.nombre
      document.getElementById("userEmail").textContent = userData.email
      
      // Actualizar en el header si existe
      const headerUserName = document.querySelector(".auth-buttons .font-medium")
      if (headerUserName) {
        headerUserName.textContent = `Hola, ${userData.nombre}`
      }
      
      // Recargar perfil
      loadUserProfile()
    } else {
      showToast(result.message || "Error al actualizar perfil", "error")
    }
  } catch (error) {
    console.error("Update profile error:", error)
    showToast("Error de conexión", "error")
  } finally {
    hideLoading()
  }
}

// Actualizar preferencias
async function updatePreferences(event) {
  event.preventDefault()
  
  try {
    showLoading()
    
    const formData = new FormData(event.target)
    
    // Añadir preferencias personalizadas actuales al formData
    userPreferences.forEach((pref, index) => {
      formData.append(`preferences[${index}]`, pref.preferencia)
    })
    
    const response = await fetch("api/client/update-preferences.php", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: formData,
    })

    const result = await response.json()

    if (result.success) {
      showToast("Preferencias actualizadas exitosamente", "success")
      
      // Recargar preferencias para reflejar los cambios
      await loadUserPreferences()
    } else {
      showToast(result.message || "Error al actualizar preferencias", "error")
    }
  } catch (error) {
    console.error("Update preferences error:", error)
    showToast("Error de conexión", "error")
  } finally {
    hideLoading()
  }
}

// Añadir a favoritos
async function addToFavorites(type, id) {
  try {
    showLoading()
    
    const response = await fetch(`api/client/add-favorite.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: JSON.stringify({ type, id }),
    })

    const result = await response.json()

    if (result.success) {
      showToast("Añadido a favoritos exitosamente", "success")
      
      // Recargar lista de favoritos
      if (type === "chef") {
        loadFavoriteChefs()
      } else if (type === "recipe") {
        loadFavoriteRecipes()
      }
    } else {
      showToast(result.message || "Error al añadir a favoritos", "error")
    }
  } catch (error) {
    console.error("Add to favorites error:", error)
    showToast("Error de conexión", "error")
  } finally {
    hideLoading()
  }
}

// Eliminar de favoritos
async function removeFromFavorites(type, id) {
  try {
    showLoading()
    
    const response = await fetch(`api/client/remove-favorite.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: JSON.stringify({ type, id }),
    })

    const result = await response.json()

    if (result.success) {
      showToast("Eliminado de favoritos exitosamente", "success")
      
      // Actualizar lista de favoritos
      if (type === "chef") {
        favoriteChefs = favoriteChefs.filter(chef => chef.id !== id)
        displayFavoriteChefs()
      } else if (type === "recipe") {
        favoriteRecipes = favoriteRecipes.filter(recipe => recipe.id !== id)
        displayFavoriteRecipes()
      }
    } else {
      showToast(result.message || "Error al eliminar de favoritos", "error")
    }
  } catch (error) {
    console.error("Remove from favorites error:", error)
    showToast("Error de conexión", "error")
  } finally {
    hideLoading()
  }
}

// Ver perfil de chef
function viewChefProfile(chefId) {
  window.location.href = `chef-profile.html?id=${chefId}`
}

// Ver receta
function viewRecipe(recipeId) {
  window.location.href = `recipe-details.html?id=${recipeId}`
}

// Editar reseña
function editReview(reviewId) {
  const review = userReviews.find(r => r.id === reviewId)
  if (!review) return
  
  // Aquí se implementaría la lógica para editar la reseña
  // Por ejemplo, mostrar un modal con un formulario
  alert('Funcionalidad de edición de reseñas en desarrollo')
}

// Eliminar reseña
async function deleteReview(reviewId) {
  if (!confirm('¿Estás seguro de que deseas eliminar esta reseña?')) return
  
  try {
    showLoading()
    
    const response = await fetch(`api/client/reviews.php`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: JSON.stringify({ id: reviewId }),
    })

    const result = await response.json()

    if (result.success) {
      showToast("Reseña eliminada exitosamente", "success")
      
      // Actualizar lista de reseñas
      userReviews = userReviews.filter(review => review.id !== reviewId)
      displayUserReviews()
    } else {
      showToast(result.message || "Error al eliminar reseña", "error")
    }
  } catch (error) {
    console.error("Delete review error:", error)
    showToast("Error de conexión", "error")
  } finally {
    hideLoading()
  }
}

// Cambiar entre tabs
function showTab(tabId) {
  // Ocultar todos los tabs
  document.querySelectorAll(".profile-tab").forEach(tab => {
    tab.classList.remove("active")
  })
  
  // Mostrar el tab seleccionado
  document.getElementById(`tab-${tabId}`).classList.add("active")
  
  // Actualizar estado activo en navegación
  document.querySelectorAll(".profile-nav-item").forEach(item => {
    item.classList.remove("active")
  })
  
  document.querySelector(`.profile-nav-item[data-tab="${tabId}"]`).classList.add("active")
}

// Generar estrellas para calificación
function generateStars(rating) {
  if (!rating) return "☆☆☆☆☆"
  
  const fullStars = Math.floor(rating)
  const halfStar = rating % 1 >= 0.5
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0)
  
  return "★".repeat(fullStars) + (halfStar ? "½" : "") + "☆".repeat(emptyStars)
}

// Formatear fecha
function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric"
  })
}

// Mostrar indicador de carga
function showLoading() {
  const loadingIndicator = document.createElement("div")
  loadingIndicator.className = "loading-indicator"
  loadingIndicator.innerHTML = `
    <div class="spinner"></div>
    <p>Cargando...</p>
  `
  document.body.appendChild(loadingIndicator)
}

// Ocultar indicador de carga
function hideLoading() {
  const loadingIndicator = document.querySelector(".loading-indicator")
  if (loadingIndicator) {
    loadingIndicator.remove()
  }
}

// Mostrar toast de notificación
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
      toast.remove()
    }, 300)
  }, 3000)
}