// Dashboard JavaScript for La Délicatesse

// Global variables
let currentUser = null
let currentSection = "overview"
let services = []
let userRecipes = []
let conversations = []
let currentConversation = null

// Initialize dashboard
document.addEventListener("DOMContentLoaded", () => {
  checkAuthStatus()
  loadDashboardData()
  setupDashboardEventListeners()
  loadProfileData()
})

// Check authentication status
function checkAuthStatus() {
  const token = localStorage.getItem("authToken")
  const userData = localStorage.getItem("userData")

  if (!token || !userData) {
    window.location.href = "index.html"
    return
  }

  currentUser = JSON.parse(userData)

  // Only allow chefs to access dashboard
  if (currentUser.tipo_usuario !== "chef") {
    window.location.href = "index.html"
    return
  }

  document.getElementById("userName").textContent = currentUser.nombre

  // Set user initials for avatar
  const initials = currentUser.nombre
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
  document.getElementById("userInitials").textContent = initials
}

// Setup event listeners
function setupDashboardEventListeners() {
  // Message input enter key
  const messageInput = document.getElementById("messageInput")
  if (messageInput) {
    messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        sendMessage()
      }
    })
  }
}

// Load profile data
async function loadProfileData() {
  try {
    const response = await fetch("api/profile/get.php", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    })

    const result = await response.json()

    if (result.success) {
      const profile = result.data

      // Fill profile form
      document.getElementById("profileNombre").value = profile.nombre || ""
      document.getElementById("profileEmail").value = profile.email || ""
      document.getElementById("profileTelefono").value = profile.telefono || ""
      document.getElementById("profileEspecialidad").value = profile.especialidad || ""
      document.getElementById("profileExperiencia").value = profile.experiencia_anos || ""
      document.getElementById("profileUbicacion").value = profile.ubicacion || ""
      document.getElementById("profilePrecio").value = profile.precio_por_hora || ""
      document.getElementById("profileBiografia").value = profile.biografia || ""
      document.getElementById("profileCertificaciones").value = profile.certificaciones || ""

      // Load profile photo if exists
      if (profile.foto_perfil) {
        const profileImg = document.getElementById("profilePhotoPreview")
        const placeholder = document.getElementById("profilePhotoPlaceholder")
        const userAvatarImg = document.getElementById("userAvatarImg")
        const userAvatarPlaceholder = document.getElementById("userAvatarPlaceholder")

        profileImg.src = profile.foto_perfil
        profileImg.classList.remove("hidden")
        placeholder.classList.add("hidden")

        userAvatarImg.src = profile.foto_perfil
        userAvatarImg.classList.remove("hidden")
        userAvatarPlaceholder.classList.add("hidden")
      }
    }
  } catch (error) {
    console.error("Error loading profile:", error)
  }
}

// Preview profile photo
function previewProfilePhoto(event) {
  const file = event.target.files[0]
  if (file) {
    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      showToast("La imagen debe ser menor a 2MB", "error")
      return
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showToast("Solo se permiten archivos de imagen", "error")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const profileImg = document.getElementById("profilePhotoPreview")
      const placeholder = document.getElementById("profilePhotoPlaceholder")

      profileImg.src = e.target.result
      profileImg.classList.remove("hidden")
      placeholder.classList.add("hidden")
    }
    reader.readAsDataURL(file)
  }
}

// Reset profile form
function resetProfileForm() {
  document.getElementById("profileForm").reset()
  loadProfileData()

  const profileImg = document.getElementById("profilePhotoPreview")
  const placeholder = document.getElementById("profilePhotoPlaceholder")

  profileImg.classList.add("hidden")
  placeholder.classList.remove("hidden")
}

// Load dashboard data
async function loadDashboardData() {
  await Promise.all([loadUserStats(), loadServices(), loadUserRecipes(), loadConversations(), loadRecentActivity()])
}

// Load user statistics
async function loadUserStats() {
  try {
    const response = await fetch("api/dashboard/stats.php", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    })

    const result = await response.json()

    if (result.success) {
      const stats = result.data
      document.getElementById("totalServices").textContent = stats.total_services || 0
      document.getElementById("avgRating").textContent = (stats.avg_rating || 0).toFixed(1)
      document.getElementById("totalEarnings").textContent = formatCurrency(stats.total_earnings || 0)
    }
  } catch (error) {
    console.error("Error loading stats:", error)
  }
}

// Load services
async function loadServices() {
  try {
    const response = await fetch("api/services/user-services.php", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    })

    const result = await response.json()

    if (result.success) {
      services = result.data
      displayServices()
    }
  } catch (error) {
    console.error("Error loading services:", error)
  }
}

// Display services
function displayServices() {
  const servicesList = document.getElementById("servicesList")
  if (!servicesList) return

  if (services.length === 0) {
    servicesList.innerHTML =
      '<p class="text-center" style="color: var(--text-light);">No tienes servicios registrados.</p>'
    return
  }

  servicesList.innerHTML = services
    .map(
      (service) => `
        <div class="p-6 card-hover" style="background-color: var(--light-bg); border: 1px solid var(--border-color); border-radius: var(--border-radius-lg);">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h4 class="text-lg font-semibold mb-2" style="color: var(--primary-color); font-family: var(--font-heading);">${service.cliente_nombre}</h4>
                    <p style="color: var(--text-light);">${formatDate(service.fecha_servicio)} - ${service.hora_servicio}</p>
                    <p style="color: var(--text-light);">${service.ubicacion_servicio}</p>
                </div>
                <div class="text-right">
                    <span class="status-badge status-${service.estado}">${service.estado}</span>
                    <p class="text-lg font-bold mt-2" style="color: var(--accent-color); font-family: var(--font-heading);">${formatCurrency(service.precio_total)}</p>
                </div>
            </div>
            
            <div class="flex gap-2">
                <button onclick="viewServiceDetails(${service.id})" class="btn btn-outline btn-sm">
                    Ver Detalles
                </button>
                ${
                  service.estado === "pendiente"
                    ? `
                    <button onclick="acceptService(${service.id})" class="btn btn-primary btn-sm">
                        Aceptar
                    </button>
                    <button onclick="rejectService(${service.id})" class="btn btn-outline btn-sm" style="color: #dc2626; border-color: #dc2626;">
                        Rechazar
                    </button>
                `
                    : ""
                }
            </div>
        </div>
    `,
    )
    .join("")
}

// Load user recipes
async function loadUserRecipes() {
  try {
    const response = await fetch("api/recipes/user-recipes.php", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    })

    const result = await response.json()

    if (result.success) {
      userRecipes = result.data
      displayUserRecipes()
    }
  } catch (error) {
    console.error("Error loading recipes:", error)
  }
}

// Display user recipes
function displayUserRecipes() {
  const recipesList = document.getElementById("recipesList")
  if (!recipesList) return

  if (userRecipes.length === 0) {
    recipesList.innerHTML =
      '<p class="text-center col-span-full" style="color: var(--text-light);">No tienes recetas publicadas.</p>'
    return
  }

  recipesList.innerHTML = userRecipes
    .map(
      (recipe) => `
        <div class="recipe-card">
            <div class="recipe-image">
                <img src="${recipe.imagen || "/placeholder.svg?height=150&width=200"}" 
                     alt="${recipe.titulo}">
                <div class="recipe-badge">${recipe.dificultad}</div>
            </div>
            <div class="recipe-info">
                <h4 class="font-semibold mb-2" style="color: var(--primary-color); font-family: var(--font-heading);">${recipe.titulo}</h4>
                <p class="text-sm mb-2 line-clamp-2" style="color: var(--text-light);">${recipe.descripcion || ""}</p>
                <div class="flex justify-between items-center mb-3">
                    <span class="font-bold" style="color: var(--accent-color);">${formatCurrency(recipe.precio)}</span>
                    <span class="text-sm" style="color: var(--text-light);">${recipe.ventas || 0} ventas</span>
                </div>
                <div class="flex gap-2">
                    <button onclick="editRecipe(${recipe.id})" class="btn btn-outline btn-sm flex-1">
                        Editar
                    </button>
                    <button onclick="deleteRecipe(${recipe.id})" class="btn btn-outline btn-sm flex-1" style="color: #dc2626; border-color: #dc2626;">
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
    `,
    )
    .join("")
}

// Load conversations
async function loadConversations() {
  try {
    const response = await fetch("api/messages/conversations.php", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    })

    const result = await response.json()

    if (result.success) {
      conversations = result.data
      displayConversations()
    }
  } catch (error) {
    console.error("Error loading conversations:", error)
  }
}

// Display conversations
function displayConversations() {
  const conversationsList = document.getElementById("conversationsList")
  if (!conversationsList) return

  if (conversations.length === 0) {
    conversationsList.innerHTML = '<p class="text-sm" style="color: var(--text-light);">No hay conversaciones.</p>'
    return
  }

  conversationsList.innerHTML = conversations
    .map(
      (conv) => `
        <div onclick="selectConversation(${conv.servicio_id})" 
             class="p-3 rounded-lg cursor-pointer transition ${currentConversation === conv.servicio_id ? "bg-primary" : ""}" 
             style="border: 1px solid var(--border-color); ${currentConversation === conv.servicio_id ? "background-color: var(--secondary-color); border-color: var(--primary-color);" : ""}">
            <h5 class="font-medium text-sm" style="color: var(--primary-color); font-family: var(--font-heading);">${conv.otro_usuario}</h5>
            <p class="text-xs truncate" style="color: var(--text-light);">${conv.ultimo_mensaje}</p>
            <p class="text-xs" style="color: var(--text-light);">${formatDate(conv.fecha_ultimo)}</p>
        </div>
    `,
    )
    .join("")
}

// Load recent activity
async function loadRecentActivity() {
  try {
    const response = await fetch("api/dashboard/recent-activity.php", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    })

    const result = await response.json()

    if (result.success) {
      displayRecentActivity(result.data)
    }
  } catch (error) {
    console.error("Error loading recent activity:", error)
  }
}

// Display recent activity
function displayRecentActivity(activities) {
  const recentActivity = document.getElementById("recentActivity")
  if (!recentActivity) return

  if (activities.length === 0) {
    recentActivity.innerHTML = '<p style="color: var(--text-light);">No hay actividad reciente.</p>'
    return
  }

  recentActivity.innerHTML = activities
    .map(
      (activity) => `
        <div class="flex items-center space-x-3 p-4 rounded-lg" style="background-color: var(--gray-bg);">
            <div class="w-10 h-10 rounded-full flex items-center justify-center" style="background-color: rgba(139, 90, 43, 0.1);">
                <span style="color: var(--primary-color);">${activity.icon || '📋'}</span>
            </div>
            <div class="flex-1">
                <p class="text-sm" style="color: var(--text-color);">${activity.descripcion}</p>
                <p class="text-xs" style="color: var(--text-light);">${formatDate(activity.fecha)}</p>
            </div>
        </div>
    `,
    )
    .join("")
}

// Navigation functions
function showSection(sectionId) {
  // Hide all sections
  document.querySelectorAll(".dashboard-section").forEach((section) => {
    section.classList.add("hidden")
  })

  // Show selected section
  document.getElementById(sectionId).classList.remove("hidden")

  // Update navigation
  document.querySelectorAll(".dashboard-nav-btn").forEach((btn) => {
    btn.classList.remove("active")
  })
  event.target.classList.add("active")

  currentSection = sectionId
}

// Service functions
function viewServiceDetails(serviceId) {
  const service = services.find((s) => s.id === serviceId)
  if (!service) return

  const serviceDetails = document.getElementById("serviceDetails")
  serviceDetails.innerHTML = `
        <div class="space-y-6">
            <div>
                <h4 class="font-semibold text-lg mb-4" style="color: var(--primary-color); font-family: var(--font-heading);">Detalles del Servicio</h4>
                <div class="grid md:grid-cols-2 gap-4">
                    <div class="form-group">
                        <label>Cliente</label>
                        <p class="font-medium" style="color: var(--text-color);">${service.cliente_nombre}</p>
                    </div>
                    <div class="form-group">
                        <label>Fecha</label>
                        <p class="font-medium" style="color: var(--text-color);">${formatDate(service.fecha_servicio)}</p>
                    </div>
                    <div class="form-group">
                        <label>Hora</label>
                        <p class="font-medium" style="color: var(--text-color);">${service.hora_servicio}</p>
                    </div>
                    <div class="form-group">
                        <label>Comensales</label>
                        <p class="font-medium" style="color: var(--text-color);">${service.numero_comensales}</p>
                    </div>
                    <div class="form-group">
                        <label>Precio</label>
                        <p class="font-medium" style="color: var(--accent-color);">${formatCurrency(service.precio_total)}</p>
                    </div>
                    <div class="form-group">
                        <label>Estado</label>
                        <span class="status-badge status-${service.estado}">${service.estado}</span>
                    </div>
                </div>
                <div class="form-group">
                    <label>Ubicación</label>
                    <p class="font-medium" style="color: var(--text-color);">${service.ubicacion_servicio}</p>
                </div>
            </div>
            
            ${
              service.descripcion_evento
                ? `
                <div class="form-group">
                    <label>Descripción del Evento</label>
                    <p class="p-3 rounded-lg" style="color: var(--text-light); background-color: var(--gray-bg);">${service.descripcion_evento}</p>
                </div>
            `
                : ""
            }
            
            <div class="flex gap-4 pt-4">
                <button onclick="closeModal('serviceModal')" class="btn btn-outline">
                    Cerrar
                </button>
                ${
                  service.estado === "aceptado"
                    ? `
                    <button onclick="openChat(${service.id})" class="btn btn-primary">
                        Abrir Chat
                    </button>
                `
                    : ""
                }
            </div>
        </div>
    `

  openModal("serviceModal")
}

async function acceptService(serviceId) {
  try {
    const response = await fetch("api/services/accept.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: JSON.stringify({ service_id: serviceId }),
    })

    const result = await response.json()

    if (result.success) {
      showToast("Servicio aceptado exitosamente", "success")
      loadServices()
    } else {
      showToast(result.message || "Error al aceptar servicio", "error")
    }
  } catch (error) {
    console.error("Error accepting service:", error)
    showToast("Error de conexión", "error")
  }
}

async function rejectService(serviceId) {
  try {
    const response = await fetch("api/services/reject.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: JSON.stringify({ service_id: serviceId }),
    })

    const result = await response.json()

    if (result.success) {
      showToast("Servicio rechazado", "info")
      loadServices()
    } else {
      showToast(result.message || "Error al rechazar servicio", "error")
    }
  } catch (error) {
    console.error("Error rejecting service:", error)
    showToast("Error de conexión", "error")
  }
}

// Recipe functions
function editRecipe(recipeId) {
  // Por ahora mostrar un toast indicando que la funcionalidad está en desarrollo
  showToast("Funcionalidad de edición en desarrollo", "info")
  console.log("Edit recipe:", recipeId)
}

async function deleteRecipe(recipeId) {
  if (!confirm("¿Estás seguro de que quieres eliminar esta receta?")) {
    return
  }

  try {
    showLoading()
    const response = await fetch("api/recipes/delete.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: JSON.stringify({ recipe_id: recipeId }),
    })

    const result = await response.json()

    if (result.success) {
      showToast("Receta eliminada exitosamente", "success")
      loadUserRecipes()
    } else {
      showToast(result.message || "Error al eliminar receta", "error")
    }
  } catch (error) {
    console.error("Error deleting recipe:", error)
    showToast("Error de conexión", "error")
  } finally {
    hideLoading()
  }
}

// Message functions
function selectConversation(servicioId) {
  currentConversation = servicioId
  displayConversations()
  loadMessages(servicioId)
}

async function loadMessages(servicioId) {
  try {
    const response = await fetch(`api/messages/list.php?servicio_id=${servicioId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    })

    const result = await response.json()

    if (result.success) {
      displayMessages(result.data)
    }
  } catch (error) {
    console.error("Error loading messages:", error)
  }
}

function displayMessages(messages) {
  const messagesContainer = document.getElementById("messagesContainer")
  if (!messagesContainer) return

  if (messages.length === 0) {
    messagesContainer.innerHTML =
      '<p class="text-center" style="color: var(--text-light);">No hay mensajes en esta conversación.</p>'
    return
  }

  messagesContainer.innerHTML = messages
    .map(
      (message) => `
        <div class="message ${message.remitente_id === currentUser.id ? "sent" : "received"}">
            <p>${message.mensaje}</p>
            <span class="text-xs opacity-75">${formatDate(message.fecha_envio)}</span>
        </div>
    `,
    )
    .join("")

  messagesContainer.scrollTop = messagesContainer.scrollHeight
}

async function sendMessage() {
  const messageInput = document.getElementById("messageInput")
  const message = messageInput.value.trim()

  if (!message || !currentConversation) return

  try {
    const response = await fetch("api/messages/send.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: JSON.stringify({
        servicio_id: currentConversation,
        mensaje: message,
      }),
    })

    const result = await response.json()

    if (result.success) {
      messageInput.value = ""
      loadMessages(currentConversation)
    } else {
      showToast(result.message || "Error al enviar mensaje", "error")
    }
  } catch (error) {
    console.error("Error sending message:", error)
    showToast("Error de conexión", "error")
  }
}

// Profile functions
async function updateProfile(event) {
  event.preventDefault()
  const formData = new FormData(event.target)

  try {
    showLoading()
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
      currentUser = { ...currentUser, ...result.user }
      localStorage.setItem("userData", JSON.stringify(currentUser))

      // Update header avatar if photo was uploaded
      if (result.user.foto_perfil) {
        const userAvatarImg = document.getElementById("userAvatarImg")
        const userAvatarPlaceholder = document.getElementById("userAvatarPlaceholder")

        userAvatarImg.src = result.user.foto_perfil
        userAvatarImg.classList.remove("hidden")
        userAvatarPlaceholder.classList.add("hidden")
      }
    } else {
      showToast(result.message || "Error al actualizar perfil", "error")
    }
  } catch (error) {
    console.error("Error updating profile:", error)
    showToast("Error de conexión", "error")
  } finally {
    hideLoading()
  }
}

// Recipe form functions
let stepCounter = 1

function addIngredient() {
  const ingredientsList = document.getElementById("ingredientsList")
  const newIngredient = document.createElement("div")
  newIngredient.className = "ingredient-item flex gap-3"
  newIngredient.innerHTML = `
    <input type="text" placeholder="Cantidad" class="w-24" name="ingredient_quantity[]">
    <input type="text" placeholder="Unidad (ej: tazas, gramos)" class="w-32" name="ingredient_unit[]">
    <input type="text" placeholder="Ingrediente" class="flex-1" name="ingredient_name[]">
    <button type="button" onclick="removeIngredient(this)" class="btn btn-outline btn-sm text-red-600 border-red-600">
      Eliminar
    </button>
  `
  ingredientsList.appendChild(newIngredient)
}

function removeIngredient(button) {
  button.parentElement.remove()
}

function addStep() {
  stepCounter++
  const stepsList = document.getElementById("stepsList")
  const newStep = document.createElement("div")
  newStep.className = "step-item p-4 rounded-lg"
  newStep.style.cssText = "border: 1px solid var(--border-color); background-color: var(--gray-bg);"
  newStep.innerHTML = `
    <div class="flex justify-between items-center mb-3">
        <h4 class="font-medium" style="color: var(--primary-color);">Paso ${stepCounter}</h4>
        <button type="button" onclick="removeStep(this)" class="btn btn-outline btn-sm text-red-600 border-red-600">
            Eliminar Paso
        </button>
    </div>
    
    <div class="form-group">
        <label>Descripción del paso</label>
        <textarea name="step_description[]" rows="3" placeholder="Describe detalladamente este paso..." required></textarea>
    </div>
    
    <div class="form-group">
        <label>Foto del paso (opcional)</label>
        <div class="flex items-center gap-4">
            <input type="file" name="step_images[]" accept="image/*" class="hidden" onchange="previewStepImage(this)">
            <button type="button" onclick="this.previousElementSibling.click()" class="btn btn-outline btn-sm">
                Seleccionar Imagen
            </button>
            <div class="step-image-preview hidden">
                <img class="w-20 h-20 object-cover rounded-lg" alt="Preview">
                <button type="button" onclick="removeStepImage(this)" class="text-red-600 text-sm mt-1">Eliminar</button>
            </div>
        </div>
    </div>
  `
  stepsList.appendChild(newStep)
}

function removeStep(button) {
  button.closest('.step-item').remove()
  updateStepNumbers()
}

function updateStepNumbers() {
  const steps = document.querySelectorAll('.step-item h4')
  steps.forEach((step, index) => {
    step.textContent = `Paso ${index + 1}`
  })
  stepCounter = steps.length
}

function previewStepImage(input) {
  const file = input.files[0]
  if (file) {
    if (file.size > 2 * 1024 * 1024) {
      showToast("La imagen debe ser menor a 2MB", "error")
      input.value = ""
      return
    }

    if (!file.type.startsWith("image/")) {
      showToast("Solo se permiten archivos de imagen", "error")
      input.value = ""
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const preview = input.parentElement.querySelector('.step-image-preview')
      const img = preview.querySelector('img')
      
      img.src = e.target.result
      preview.classList.remove('hidden')
    }
    reader.readAsDataURL(file)
  }
}

function removeStepImage(button) {
  const preview = button.parentElement
  const input = preview.parentElement.querySelector('input[type="file"]')
  
  input.value = ""
  preview.classList.add('hidden')
}

function previewFinalImage(input) {
  const file = input.files[0]
  if (file) {
    if (file.size > 2 * 1024 * 1024) {
      showToast("La imagen debe ser menor a 2MB", "error")
      input.value = ""
      return
    }

    if (!file.type.startsWith("image/")) {
      showToast("Solo se permiten archivos de imagen", "error")
      input.value = ""
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const preview = document.getElementById('finalImagePreview')
      const img = preview.querySelector('img')
      
      img.src = e.target.result
      preview.classList.remove('hidden')
    }
    reader.readAsDataURL(file)
  }
}

function removeFinalImage() {
  const input = document.querySelector('input[name="final_image"]')
  const preview = document.getElementById('finalImagePreview')
  
  input.value = ""
  preview.classList.add('hidden')
}

// Update the saveRecipe function to handle the new form structure
async function saveRecipe(event) {
  event.preventDefault()
  const formData = new FormData(event.target)

  // Validate that we have at least one ingredient
  const ingredients = formData.getAll('ingredient_name[]').filter(name => name.trim() !== '')
  if (ingredients.length === 0) {
    showToast("Debes agregar al menos un ingrediente", "error")
    return
  }

  // Validate that we have at least one step
  const steps = formData.getAll('step_description[]').filter(desc => desc.trim() !== '')
  if (steps.length === 0) {
    showToast("Debes agregar al menos un paso", "error")
    return
  }

  // Validate final image
  if (!formData.get('final_image') || formData.get('final_image').size === 0) {
    showToast("Debes agregar una imagen del resultado final", "error")
    return
  }

  try {
    showLoading()
    const response = await fetch("api/recipes/save-enhanced.php", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: formData,
    })

    const result = await response.json()

    if (result.success) {
      showToast("Receta guardada exitosamente", "success")
      closeModal("recipeModal")
      loadUserRecipes()
      resetRecipeForm()
    } else {
      showToast(result.message || "Error al guardar receta", "error")
    }
  } catch (error) {
    console.error("Error saving recipe:", error)
    showToast("Error de conexión al servidor", "error")
  } finally {
    hideLoading()
  }
}

function resetRecipeForm() {
  document.getElementById("recipeForm").reset()
  
  // Reset ingredients to just one
  const ingredientsList = document.getElementById("ingredientsList")
  ingredientsList.innerHTML = `
    <div class="ingredient-item flex gap-3">
        <input type="text" placeholder="Cantidad" class="w-24" name="ingredient_quantity[]">
        <input type="text" placeholder="Unidad (ej: tazas, gramos)" class="w-32" name="ingredient_unit[]">
        <input type="text" placeholder="Ingrediente" class="flex-1" name="ingredient_name[]">
        <button type="button" onclick="removeIngredient(this)" class="btn btn-outline btn-sm text-red-600 border-red-600">
            Eliminar
        </button>
    </div>
  `
  
  // Reset steps to just one
  stepCounter = 1
  const stepsList = document.getElementById("stepsList")
  stepsList.innerHTML = `
    <div class="step-item p-4 rounded-lg" style="border: 1px solid var(--border-color); background-color: var(--gray-bg);">
        <div class="flex justify-between items-center mb-3">
            <h4 class="font-medium" style="color: var(--primary-color);">Paso 1</h4>
            <button type="button" onclick="removeStep(this)" class="btn btn-outline btn-sm text-red-600 border-red-600">
                Eliminar Paso
            </button>
        </div>
        
        <div class="form-group">
            <label>Descripción del paso</label>
            <textarea name="step_description[]" rows="3" placeholder="Describe detalladamente este paso..." required></textarea>
        </div>
        
        <div class="form-group">
            <label>Foto del paso (opcional)</label>
            <div class="flex items-center gap-4">
                <input type="file" name="step_images[]" accept="image/*" class="hidden" onchange="previewStepImage(this)">
                <button type="button" onclick="this.previousElementSibling.click()" class="btn btn-outline btn-sm">
                    Seleccionar Imagen
                </button>
                <div class="step-image-preview hidden">
                    <img class="w-20 h-20 object-cover rounded-lg" alt="Preview">
                    <button type="button" onclick="removeStepImage(this)" class="text-red-600 text-sm mt-1">Eliminar</button>
                </div>
            </div>
        </div>
    </div>
  `
  
  // Hide final image preview
  document.getElementById('finalImagePreview').classList.add('hidden')
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
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString))
}

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

function logout() {
  localStorage.removeItem("authToken")
  localStorage.removeItem("userData")
  window.location.href = "index.html"
}