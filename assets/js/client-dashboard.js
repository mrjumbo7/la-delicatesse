// Client Dashboard JavaScript for La Délicatesse

// Global variables
let currentUser = null
let currentSection = "overview"
let reservations = []
let favorites = []
let paymentHistory = []
let paymentMethods = []
let reviews = []
let notifications = []
let currentFilter = "all"

// Initialize dashboard
document.addEventListener("DOMContentLoaded", () => {
  // Verificar autenticación inmediatamente
  const isAuthenticated = checkAuthStatus()
  
  // Prevenir cualquier carga adicional si no está autenticado
  if (!isAuthenticated) {
    return
  }
  
  // Solo cargar datos si la autenticación es exitosa
  loadDashboardData()
  setupEventListeners()
  loadClientProfile()
})

// Check authentication status
function checkAuthStatus() {
  const token = localStorage.getItem("authToken")
  const userData = localStorage.getItem("userData")

  if (!token || !userData) {
    localStorage.removeItem("authToken")
    localStorage.removeItem("userData")
    window.location.replace("index.html")
    return false
  }

  try {
    currentUser = JSON.parse(userData)

    // Validate user data structure
    if (!currentUser || !currentUser.tipo_usuario) {
      localStorage.removeItem("authToken")
      localStorage.removeItem("userData")
      window.location.replace("index.html")
      return false
    }

    // Only allow clients to access this dashboard
    if (currentUser.tipo_usuario !== "cliente") {
      localStorage.removeItem("authToken")
      localStorage.removeItem("userData")
      const redirectUrl = currentUser.tipo_usuario === "chef" ? "dashboard.html" : "index.html"
      window.location.replace(redirectUrl)
      return false
    }

    document.getElementById("userName").textContent = currentUser.nombre

    // Set user initials for avatar
    const initials = currentUser.nombre
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
    document.getElementById("userInitials").textContent = initials

    return true
  } catch (error) {
    console.error("Error checking auth status:", error)
    localStorage.removeItem("authToken")
    localStorage.removeItem("userData")
    window.location.replace("index.html")
    return false
  }
}

// Setup event listeners
function setupEventListeners() {
  // Add any specific event listeners here
}

// Load client profile data
async function loadClientProfile() {
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
      document.getElementById("clientNombre").value = profile.nombre || ""
      document.getElementById("clientEmail").value = profile.email || ""
      document.getElementById("clientTelefono").value = profile.telefono || ""
      document.getElementById("clientFechaNacimiento").value = profile.fecha_nacimiento || ""
      document.getElementById("clientDireccion").value = profile.direccion || ""

      // Load dietary preferences
      if (profile.preferencias) {
        const preferences = profile.preferencias.split(",")
        preferences.forEach((pref) => {
          const checkbox = document.querySelector(`input[value="${pref.trim()}"]`)
          if (checkbox) checkbox.checked = true
        })
      }
    }
  } catch (error) {
    console.error("Error loading profile:", error)
  }
}

// Ver perfil del chef
async function viewChefProfile(chefId) {
  try {
    const response = await fetch(`api/chefs/list.php?id=${chefId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    })

    const result = await response.json()

    if (result.success) {
      const chef = result.data
      
      // Crear el contenido del modal
      const modalContent = `
        <div class="p-6">
          <div class="flex items-center space-x-4 mb-6">
            <div class="w-24 h-24 rounded-full overflow-hidden" style="border: 2px solid var(--primary-light);">
              <img src="${chef.foto || '/placeholder.svg'}" alt="${chef.nombre}" class="w-full h-full object-cover">
            </div>
            <div>
              <h3 class="text-2xl font-bold" style="color: var(--primary-color); font-family: var(--font-heading);">${chef.nombre}</h3>
              <p class="text-sm" style="color: var(--text-light);">${chef.especialidad}</p>
            </div>
          </div>
          <div class="space-y-4">
            <div>
              <h4 class="font-semibold mb-2" style="color: var(--primary-color);">Sobre mí</h4>
              <p style="color: var(--text-color);">${chef.biografia}</p>
            </div>
            <div>
              <h4 class="font-semibold mb-2" style="color: var(--primary-color);">Experiencia</h4>
              <p style="color: var(--text-color);">${chef.experiencia} años</p>
            </div>
            <div>
              <h4 class="font-semibold mb-2" style="color: var(--primary-color);">Especialidades</h4>
              <p style="color: var(--text-color);">${chef.especialidades}</p>
            </div>
            <div>
              <h4 class="font-semibold mb-2" style="color: var(--primary-color);">Calificación</h4>
              <div class="flex items-center">
                <span class="text-xl font-bold mr-2" style="color: var(--accent-color);">${chef.calificacion}</span>
                <div class="flex text-yellow-400">
                  ${"★".repeat(Math.floor(chef.calificacion))}${chef.calificacion % 1 >= 0.5 ? "½" : ""}
                </div>
              </div>
            </div>
          </div>
          <div class="mt-6 flex justify-end space-x-4">
            <button onclick="closeModal()" class="btn btn-secondary">Cerrar</button>
            <button onclick="window.location.href='index.html#chefs'" class="btn btn-primary">Reservar</button>
          </div>
        </div>
      `

      // Mostrar el modal
      showModal("Perfil del Chef", modalContent)
    }
  } catch (error) {
    console.error("Error loading chef profile:", error)
    showToast("Error al cargar el perfil del chef", "error")
  }
}

// Load dashboard data
async function loadDashboardData() {
  await Promise.all([
    loadClientStats(),
    loadReservations(),
    loadFavorites(),
    loadPaymentHistory(),
    loadPaymentMethods(),
    loadReviews(),
    loadNotifications(),
    loadRecentActivity(),
  ])
}

// Load client statistics
async function loadClientStats() {
  try {
    const response = await fetch("api/client/stats.php", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()

    if (result.success) {
      const stats = result.data
      document.getElementById("totalReservations").textContent = stats.total_reservations || 0
      document.getElementById("totalFavorites").textContent = stats.total_favorites || 0
      document.getElementById("totalSpent").textContent = formatCurrency(stats.total_spent || 0)
    } else {
      throw new Error(result.message || 'Error al cargar las estadísticas')
    }
  } catch (error) {
    console.error("Error loading stats:", error)
    showToast("Error al cargar las estadísticas. Por favor, intente nuevamente.", "error")
  }
}

// Load reservations
async function loadReservations() {
  try {
    const response = await fetch("api/client/user-services.php", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        'Content-Type': 'application/json'
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()

    if (result.success) {
      reservations = result.data
      displayReservations()
      displayNextReservation()
    } else {
      throw new Error(result.message || 'Error al cargar las reservas')
    }
  } catch (error) {
    console.error("Error loading reservations:", error)
    showToast("Error al cargar las reservas. Por favor, intente nuevamente.", "error")
    // Display empty state with error message
    const reservationsList = document.getElementById("reservationsList")
    if (reservationsList) {
      reservationsList.innerHTML = '<p class="text-center text-red-600">No se pudieron cargar las reservas. Por favor, actualice la página.</p>'
    }
  }
}

// Display reservations
function displayReservations() {
  const reservationsList = document.getElementById("reservationsList")
  if (!reservationsList) return

  let filteredReservations = reservations

  // Apply filter
  const now = new Date()
  switch (currentFilter) {
    case "upcoming":
      filteredReservations = reservations.filter((r) => new Date(r.fecha_servicio) > now && r.estado !== "cancelado")
      break
    case "past":
      filteredReservations = reservations.filter((r) => new Date(r.fecha_servicio) < now || r.estado === "completado")
      break
    case "cancelled":
      filteredReservations = reservations.filter((r) => r.estado === "cancelado")
      break
  }

  if (filteredReservations.length === 0) {
    reservationsList.innerHTML =
      '<p class="text-center" style="color: var(--text-light);">No hay reservas para mostrar.</p>'
    return
  }

  reservationsList.innerHTML = filteredReservations
    .map(
      (reservation) => `
        <div class="p-6 card-hover" style="background-color: var(--light-bg); border: 1px solid var(--border-color); border-radius: var(--border-radius-lg);">
            <div class="flex justify-between items-start mb-4">
                <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                        <img src="${reservation.chef_foto || "/placeholder.svg?height=50&width=50"}" 
                             alt="Chef ${reservation.chef_nombre}" 
                             class="w-12 h-12 rounded-full object-cover">
                        <div>
                            <h4 class="text-lg font-semibold" style="color: var(--primary-color); font-family: var(--font-heading);">
                                Chef ${reservation.chef_nombre}
                            </h4>
                            <p class="text-sm" style="color: var(--text-light);">${reservation.especialidad}</p>
                        </div>
                    </div>
                    
                    <div class="grid md:grid-cols-2 gap-4 text-sm" style="color: var(--text-light);">
                        <div>
                            <strong>Fecha:</strong> ${formatDate(reservation.fecha_servicio)}
                        </div>
                        <div>
                            <strong>Hora:</strong> ${reservation.hora_servicio}
                        </div>
                        <div>
                            <strong>Comensales:</strong> ${reservation.numero_comensales}
                        </div>
                        <div>
                            <strong>Ubicación:</strong> ${reservation.ubicacion_servicio}
                        </div>
                    </div>
                    
                    ${
                      reservation.descripcion_evento
                        ? `
                        <div class="mt-3">
                            <strong class="text-sm">Descripción:</strong>
                            <p class="text-sm mt-1" style="color: var(--text-light);">${reservation.descripcion_evento}</p>
                        </div>
                    `
                        : ""
                    }
                </div>
                
                <div class="text-right">
                    <span class="status-badge status-${reservation.estado}">${reservation.estado}</span>
                    <p class="text-lg font-bold mt-2" style="color: var(--accent-color); font-family: var(--font-heading);">
                        ${formatCurrency(reservation.precio_total)}
                    </p>
                </div>
            </div>
            
            <div class="flex gap-2 flex-wrap">
                <button onclick="viewReservationDetails(${reservation.id})" class="btn btn-outline btn-sm">
                    Ver Detalles
                </button>
                
                ${
                  reservation.estado === "pendiente" || reservation.estado === "aceptado"
                    ? `
                    <button onclick="cancelReservation(${reservation.id})" class="btn btn-outline btn-sm text-red-600 border-red-600">
                        Cancelar
                    </button>
                `
                    : ""
                }
                
                ${
                  reservation.estado === "completado" && !reservation.has_review
                    ? `
                    <button onclick="openReviewModal(${reservation.id}, '${reservation.chef_nombre}')" class="btn btn-primary btn-sm">
                        Escribir Reseña
                    </button>
                `
                    : ""
                }
                
                <button onclick="rebookChef(${reservation.chef_id})" class="btn btn-secondary btn-sm">
                    Reservar de Nuevo
                </button>
            </div>
        </div>
    `,
    )
    .join("")
}

// Display next reservation
function displayNextReservation() {
  const nextReservationDiv = document.getElementById("nextReservation")
  if (!nextReservationDiv) return

  const now = new Date()
  const upcomingReservations = reservations
    .filter((r) => new Date(r.fecha_servicio) > now && r.estado !== "cancelado")
    .sort((a, b) => new Date(a.fecha_servicio) - new Date(b.fecha_servicio))

  if (upcomingReservations.length === 0) {
    nextReservationDiv.innerHTML = `
      <div class="text-center py-8">
        <p style="color: var(--text-light);" class="mb-4">No tienes reservas próximas</p>
        <button onclick="window.location.href='index.html#chefs'" class="btn btn-primary">
          Reservar un Chef
        </button>
      </div>
    `
    return
  }

  const nextReservation = upcomingReservations[0]

  nextReservationDiv.innerHTML = `
    <div class="flex items-center gap-4 p-6 rounded-lg" style="background-color: var(--secondary-color); border: 1px solid var(--border-color);">
      <img src="${nextReservation.chef_foto || "/placeholder.svg?height=60&width=60"}" 
           alt="Chef ${nextReservation.chef_nombre}" 
           class="w-16 h-16 rounded-full object-cover">
      
      <div class="flex-1">
        <h4 class="text-lg font-semibold mb-1" style="color: var(--primary-color); font-family: var(--font-heading);">
          Chef ${nextReservation.chef_nombre}
        </h4>
        <p class="text-sm mb-2" style="color: var(--text-light);">${nextReservation.especialidad}</p>
        <div class="flex gap-4 text-sm" style="color: var(--text-color);">
          <span><strong>Fecha:</strong> ${formatDate(nextReservation.fecha_servicio)}</span>
          <span><strong>Hora:</strong> ${nextReservation.hora_servicio}</span>
        </div>
      </div>
      
      <div class="text-right">
        <span class="status-badge status-${nextReservation.estado}">${nextReservation.estado}</span>
        <p class="text-lg font-bold mt-2" style="color: var(--accent-color); font-family: var(--font-heading);">
          ${formatCurrency(nextReservation.precio_total)}
        </p>
      </div>
    </div>
  `
}

// Filter reservations
function filterReservations(filter) {
  currentFilter = filter

  // Update active button
  document.querySelectorAll(".reservation-filter-btn").forEach((btn) => {
    btn.classList.remove("active")
  })
  event.target.classList.add("active")

  displayReservations()
}

// Load favorites
async function loadFavorites() {
  try {
    const response = await fetch("api/client/user-recipes.php", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        'Content-Type': 'application/json'
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()

    if (result.success) {
      favorites = result.data
      displayFavorites()
    } else {
      throw new Error(result.message || 'Error al cargar los favoritos')
    }
  } catch (error) {
    console.error("Error loading favorites:", error)
    showToast("Error al cargar los favoritos. Por favor, intente nuevamente.", "error")
    const favoritesList = document.getElementById("favoritesList")
    if (favoritesList) {
      favoritesList.innerHTML = '<p class="text-center text-red-600">No se pudieron cargar los favoritos. Por favor, actualice la página.</p>'
    }
  }
}

// Display favorites
function displayFavorites() {
  const favoritesList = document.getElementById("favoritesList")
  if (!favoritesList) return

  if (favorites.length === 0) {
    favoritesList.innerHTML =
      '<p class="text-center col-span-full" style="color: var(--text-light);">No tienes chefs favoritos aún.</p>'
    return
  }

  favoritesList.innerHTML = favorites
    .map(
      (chef) => `
        <div class="chef-card">
            <div class="chef-image">
                <img src="${chef.foto_perfil || "/placeholder.svg?height=200&width=300"}" 
                     alt="Chef ${chef.nombre}">
                <div class="chef-overlay">
                    <button onclick="viewChefProfile(${chef.id})" class="btn btn-light">
                        Ver Perfil
                    </button>
                </div>
            </div>
            <div class="chef-info">
                <h4 class="font-semibold mb-2" style="color: var(--primary-color); font-family: var(--font-heading);">${chef.nombre}</h4>
                <p class="text-sm mb-2" style="color: var(--text-light);">${chef.especialidad}</p>
                <div class="flex justify-between items-center mb-3">
                    <div class="rating">
                        <div class="stars">
                            ${generateStars(chef.calificacion_promedio)}
                        </div>
                        <div class="reviews text-xs">(${chef.total_servicios} servicios)</div>
                    </div>
                    <span class="text-sm" style="color: var(--accent-color);">${formatCurrency(chef.precio_por_hora)}/hr</span>
                </div>
                <div class="flex gap-2">
                    <button onclick="rebookChef(${chef.id})" class="btn btn-primary btn-sm flex-1">
                        Reservar
                    </button>
                    <button onclick="removeFavorite(${chef.id})" class="btn btn-outline btn-sm">
                        ❤️
                    </button>
                </div>
            </div>
        </div>
    `,
    )
    .join("")
}

// Load payment history
async function loadPaymentHistory() {
  try {
    const response = await fetch("api/client/payments.php", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        'Content-Type': 'application/json'
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()

    if (result.success) {
      paymentHistory = result.data
      displayPaymentHistory()
    } else {
      throw new Error(result.message || 'Error al cargar el historial de pagos')
    }
  } catch (error) {
    console.error("Error loading payment history:", error)
    showToast("Error al cargar el historial de pagos. Por favor, intente nuevamente.", "error")
    const paymentHistoryDiv = document.getElementById("paymentHistory")
    if (paymentHistoryDiv) {
      paymentHistoryDiv.innerHTML = '<p class="text-center text-red-600">No se pudo cargar el historial de pagos. Por favor, actualice la página.</p>'
    }
  }
}

// Display payment history
function displayPaymentHistory() {
  const paymentHistoryDiv = document.getElementById("paymentHistory")
  if (!paymentHistoryDiv) return

  if (paymentHistory.length === 0) {
    paymentHistoryDiv.innerHTML =
      '<p class="text-center" style="color: var(--text-light);">No hay historial de pagos.</p>'
    return
  }

  paymentHistoryDiv.innerHTML = paymentHistory
    .map(
      (payment) => `
        <div class="flex justify-between items-center p-4 rounded-lg" style="border: 1px solid var(--border-color); background-color: var(--gray-bg);">
            <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                    <div class="w-10 h-10 rounded-full flex items-center justify-center" style="background-color: rgba(139, 90, 43, 0.1);">
                        <svg class="w-5 h-5" style="color: var(--primary-color);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                        </svg>
                    </div>
                    <div>
                        <h5 class="font-medium" style="color: var(--text-color);">Pago a Chef ${payment.chef_nombre}</h5>
                        <p class="text-sm" style="color: var(--text-light);">${formatDate(payment.fecha_pago)}</p>
                    </div>
                </div>
                <div class="text-sm" style="color: var(--text-light);">
                    <span>Método: ${payment.metodo_pago}</span>
                    ${payment.referencia_pago ? ` • Ref: ${payment.referencia_pago}` : ""}
                </div>
            </div>
            
            <div class="text-right">
                <span class="status-badge status-${payment.estado_pago}">${payment.estado_pago}</span>
                <p class="text-lg font-bold mt-1" style="color: var(--accent-color); font-family: var(--font-heading);">
                    ${formatCurrency(payment.monto)}
                </p>
                ${
                  payment.comprobante_url
                    ? `
                    <button onclick="downloadReceipt('${payment.comprobante_url}')" class="btn btn-outline btn-sm mt-2">
                        Descargar
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

// Load payment methods
async function loadPaymentMethods() {
  try {
    const response = await fetch("api/client/payment-methods.php", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        'Content-Type': 'application/json'
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()

    if (result.success) {
      paymentMethods = result.data
      displayPaymentMethods()
    } else {
      throw new Error(result.message || 'Error al cargar los métodos de pago')
    }
  } catch (error) {
    console.error("Error loading payment methods:", error)
    showToast("Error al cargar los métodos de pago. Por favor, intente nuevamente.", "error")
    const paymentMethodsDiv = document.getElementById("paymentMethods")
    if (paymentMethodsDiv) {
      paymentMethodsDiv.innerHTML = '<p class="text-center text-red-600">No se pudieron cargar los métodos de pago. Por favor, actualice la página.</p>'
    }
  }
}

// Display payment methods
function displayPaymentMethods() {
  const paymentMethodsDiv = document.getElementById("paymentMethods")
  if (!paymentMethodsDiv) return

  if (paymentMethods.length === 0) {
    paymentMethodsDiv.innerHTML =
      '<p class="text-center col-span-full" style="color: var(--text-light);">No hay métodos de pago guardados.</p>'
    return
  }

  paymentMethodsDiv.innerHTML = paymentMethods
    .map(
      (method) => `
        <div class="p-4 rounded-lg card-hover" style="border: 1px solid var(--border-color); background-color: var(--gray-bg);">
            <div class="flex justify-between items-start mb-3">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background-color: var(--primary-color); color: var(--light-text);">
                        ${method.tipo.charAt(0)}
                    </div>
                    <div>
                        <h5 class="font-medium" style="color: var(--text-color);">${method.tipo}</h5>
                        <p class="text-sm" style="color: var(--text-light);">**** ${method.ultimos_digitos}</p>
                    </div>
                </div>
                ${method.es_principal ? '<span class="status-badge status-aceptado">Principal</span>' : ""}
            </div>
            
            <div class="text-sm mb-3" style="color: var(--text-light);">
                <p><strong>Titular:</strong> ${method.nombre_titular}</p>
                <p><strong>Expira:</strong> ${method.fecha_expiracion}</p>
            </div>
            
            <div class="flex gap-2">
                ${
                  !method.es_principal
                    ? `
                    <button onclick="setPrimaryPaymentMethod(${method.id})" class="btn btn-outline btn-sm">
                        Hacer Principal
                    </button>
                `
                    : ""
                }
                <button onclick="deletePaymentMethod(${method.id})" class="btn btn-outline btn-sm text-red-600 border-red-600">
                    Eliminar
                </button>
            </div>
        </div>
    `,
    )
    .join("")
}

// Load reviews
async function loadReviews() {
  try {
    const response = await fetch("api/client/reviews.php", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        'Content-Type': 'application/json'
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()

    if (result.success) {
      reviews = result.data
      displayReviews()
    } else {
      throw new Error(result.message || 'Error al cargar las reseñas')
    }
  } catch (error) {
    console.error("Error loading reviews:", error)
    showToast("Error al cargar las reseñas. Por favor, intente nuevamente.", "error")
    const reviewsList = document.getElementById("reviewsList")
    if (reviewsList) {
      reviewsList.innerHTML = '<p class="text-center text-red-600">No se pudieron cargar las reseñas. Por favor, actualice la página.</p>'
    }
  }
}

// Display reviews
function displayReviews() {
  const reviewsList = document.getElementById("reviewsList")
  if (!reviewsList) return

  if (reviews.length === 0) {
    reviewsList.innerHTML = '<p class="text-center" style="color: var(--text-light);">No has escrito reseñas aún.</p>'
    return
  }

  reviewsList.innerHTML = reviews
    .map(
      (review) => `
        <div class="p-6 card-hover" style="background-color: var(--light-bg); border: 1px solid var(--border-color); border-radius: var(--border-radius-lg);">
            <div class="flex justify-between items-start mb-4">
                <div class="flex items-center gap-3">
                    <img src="${review.chef_foto || "/placeholder.svg?height=50&width=50"}" 
                         alt="Chef ${review.chef_nombre}" 
                         class="w-12 h-12 rounded-full object-cover">
                    <div>
                        <h4 class="font-semibold" style="color: var(--primary-color); font-family: var(--font-heading);">
                            Chef ${review.chef_nombre}
                        </h4>
                        <div class="flex items-center gap-2">
                            <div class="stars">
                                ${generateStars(review.puntuacion)}
                            </div>
                            <span class="text-sm" style="color: var(--text-light);">${formatDate(review.fecha_calificacion)}</span>
                        </div>
                    </div>
                </div>
                
                ${review.recomendaria ? '<span class="status-badge status-completado">Recomendado</span>' : ""}
            </div>
            
            ${
              review.titulo
                ? `
                <h5 class="font-medium mb-2" style="color: var(--text-color);">${review.titulo}</h5>
            `
                : ""
            }
            
            <p class="mb-3" style="color: var(--text-light);">${review.comentario}</p>
            
            ${
              review.aspectos_positivos
                ? `
                <div class="mb-2">
                    <strong class="text-sm" style="color: var(--primary-color);">Lo que más me gustó:</strong>
                    <p class="text-sm" style="color: var(--text-light);">${review.aspectos_positivos}</p>
                </div>
            `
                : ""
            }
            
            ${
              review.aspectos_mejora
                ? `
                <div>
                    <strong class="text-sm" style="color: var(--primary-color);">Sugerencias de mejora:</strong>
                    <p class="text-sm" style="color: var(--text-light);">${review.aspectos_mejora}</p>
                </div>
            `
                : ""
            }
        </div>
    `,
    )
    .join("")
}

// Load notifications
async function loadNotifications() {
  try {
    const response = await fetch("api/client/notifications.php", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        'Content-Type': 'application/json'
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()

    if (result.success) {
      notifications = result.data
      displayNotifications()
    } else {
      throw new Error(result.message || 'Error al cargar las notificaciones')
    }
  } catch (error) {
    console.error("Error loading notifications:", error)
    showToast("Error al cargar las notificaciones. Por favor, intente nuevamente.", "error")
    const notificationsList = document.getElementById("notificationsList")
    if (notificationsList) {
      notificationsList.innerHTML = '<p class="text-center text-red-600">No se pudieron cargar las notificaciones. Por favor, actualice la página.</p>'
    }
  }
}

// Display notifications
function displayNotifications() {
  const notificationsList = document.getElementById("notificationsList")
  if (!notificationsList) return

  if (notifications.length === 0) {
    notificationsList.innerHTML = '<p class="text-center" style="color: var(--text-light);">No hay notificaciones.</p>'
    return
  }

  notificationsList.innerHTML = notifications
    .map(
      (notification) => `
        <div class="p-4 rounded-lg card-hover ${!notification.leida ? "border-l-4" : ""}" 
             style="border: 1px solid var(--border-color); background-color: ${!notification.leida ? "var(--secondary-color)" : "var(--gray-bg)"}; ${!notification.leida ? "border-left-color: var(--primary-color);" : ""}">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2">
                        <h5 class="font-medium" style="color: var(--text-color);">${notification.titulo}</h5>
                        ${!notification.leida ? '<span class="w-2 h-2 rounded-full" style="background-color: var(--primary-color);"></span>' : ""}
                    </div>
                    <p class="text-sm mb-2" style="color: var(--text-light);">${notification.mensaje}</p>
                    <span class="text-xs" style="color: var(--text-light);">${formatDate(notification.fecha_creacion)}</span>
                </div>
                
                ${
                  !notification.leida
                    ? `
                    <button onclick="markAsRead(${notification.id})" class="btn btn-outline btn-sm">
                        Marcar como leída
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

// Load recent activity
async function loadRecentActivity() {
  try {
    const response = await fetch("api/client/recent-activity.php", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        'Content-Type': 'application/json'
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()

    if (result.success) {
      displayRecentActivity(result.data)
    } else {
      throw new Error(result.message || 'Error al cargar la actividad reciente')
    }
  } catch (error) {
    console.error("Error loading recent activity:", error)
    showToast("Error al cargar la actividad reciente. Por favor, intente nuevamente.", "error")
    const recentActivity = document.getElementById("recentActivity")
    if (recentActivity) {
      recentActivity.innerHTML = '<p class="text-center text-red-600">No se pudo cargar la actividad reciente. Por favor, actualice la página.</p>'
    }
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
                <span style="color: var(--primary-color);">${activity.icon || "📋"}</span>
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
  
  // Find and activate the button that corresponds to this section
  const activeButton = document.querySelector(`button[onclick*="showSection('${sectionId}')"]`)
  if (activeButton) {
    activeButton.classList.add("active")
  }

  currentSection = sectionId
}

// Reservation functions
function viewReservationDetails(reservationId) {
  // Implementation for viewing reservation details
  console.log("View reservation details:", reservationId)
}

function cancelReservation(reservationId) {
  if (!confirm("¿Estás seguro de que quieres cancelar esta reserva?")) {
    return
  }

  // Implementation for canceling reservation
  console.log("Cancel reservation:", reservationId)
}

function rebookChef(chefId) {
  localStorage.setItem("selectedChefId", chefId)
  window.location.href = "booking.html"
}

// Favorite functions
function removeFavorite(chefId) {
  // Implementation for removing favorite
  console.log("Remove favorite:", chefId)
}

function viewChefProfile(chefId) {
  localStorage.setItem("selectedChefId", chefId)
  window.location.href = "chef-profile.html"
}

// Payment functions
async function savePaymentMethod(event) {
  event.preventDefault()
  const formData = new FormData(event.target)

  // Validate required fields
  const requiredFields = ['tipo', 'numero', 'nombre_titular', 'fecha_expiracion', 'cvv']
  for (const field of requiredFields) {
    if (!formData.get(field)) {
      showToast(`Por favor, complete todos los campos requeridos`, "error")
      return
    }
  }

  try {
    showLoading()
    const response = await fetch("api/client/save-payment-method.php", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(Object.fromEntries(formData)),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()

    if (result.success) {
      showToast("Método de pago guardado exitosamente", "success")
      closeModal("paymentMethodModal")
      loadPaymentMethods()
      event.target.reset()
    } else {
      throw new Error(result.message || "Error al guardar método de pago")
    }
  } catch (error) {
    console.error("Error saving payment method:", error)
    showToast(error.message || "Error al guardar el método de pago. Por favor, intente nuevamente.", "error")
  } finally {
    hideLoading()
  }
}

function setPrimaryPaymentMethod(methodId) {
  // Implementation for setting primary payment method
  console.log("Set primary payment method:", methodId)
}

function deletePaymentMethod(methodId) {
  if (!confirm("¿Estás seguro de que quieres eliminar este método de pago?")) {
    return
  }

  // Implementation for deleting payment method
  console.log("Delete payment method:", methodId)
}

function downloadReceipt(receiptUrl) {
  window.open(receiptUrl, "_blank")
}

// Review functions
function openReviewModal(serviceId, chefName) {
  document.getElementById("reviewServiceId").value = serviceId
  document.querySelector("#reviewModal .auth-header h2").textContent = `Reseña para Chef ${chefName}`
  openModal("reviewModal")
}

function setRating(rating) {
  document.getElementById("selectedRating").value = rating

  // Update visual rating
  document.querySelectorAll(".rating-btn").forEach((btn, index) => {
    if (index < rating) {
      btn.style.color = "var(--accent-color)"
    } else {
      btn.style.color = "var(--border-color)"
    }
  })
}

async function saveReview(event) {
  event.preventDefault()
  const formData = new FormData(event.target)

  try {
    showLoading()
    const response = await fetch("api/client/save-review.php", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: formData,
    })

    const result = await response.json()

    if (result.success) {
      showToast("Reseña publicada exitosamente", "success")
      closeModal("reviewModal")
      loadReviews()
      loadReservations() // Refresh to update review status
      event.target.reset()
    } else {
      showToast(result.message || "Error al publicar reseña", "error")
    }
  } catch (error) {
    console.error("Error saving review:", error)
    showToast("Error de conexión", "error")
  } finally {
    hideLoading()
  }
}

// Profile functions
async function updateClientProfile(event) {
  event.preventDefault()
  const formData = new FormData(event.target)

  try {
    showLoading()
    const response = await fetch("api/client/update-profile.php", {
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

async function changePassword(event) {
  event.preventDefault()
  const formData = new FormData(event.target)

  if (formData.get("new_password") !== formData.get("confirm_password")) {
    showToast("Las contraseñas no coinciden", "error")
    return
  }

  try {
    showLoading()
    const response = await fetch("api/auth/change-password.php", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: formData,
    })

    const result = await response.json()

    if (result.success) {
      showToast("Contraseña cambiada exitosamente", "success")
      closeModal("changePasswordModal")
      event.target.reset()
    } else {
      showToast(result.message || "Error al cambiar contraseña", "error")
    }
  } catch (error) {
    console.error("Error changing password:", error)
    showToast("Error de conexión", "error")
  } finally {
    hideLoading()
  }
}

// Notification functions
function markAsRead(notificationId) {
  // Implementation for marking notification as read
  console.log("Mark as read:", notificationId)
}

function markAllAsRead() {
  // Implementation for marking all notifications as read
  console.log("Mark all as read")
}

// Utility functions
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

// Add CSS for reservation filter buttons
const style = document.createElement("style")
style.textContent = `
  .reservation-filter-btn {
    color: var(--text-light);
    font-family: var(--font-body);
    font-size: 0.9rem;
  }
  
  .reservation-filter-btn.active {
    background-color: var(--light-bg);
    color: var(--primary-color);
    font-weight: 600;
    box-shadow: var(--shadow-sm);
  }
  
  .rating-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--border-color);
    transition: var(--transition);
  }
  
  .rating-btn:hover {
    color: var(--accent-color);
    transform: scale(1.1);
  }
`
document.head.appendChild(style)

// Additional global variables
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
                    <h4 class="text-lg font-semibold mb-2" style="color: var(--primary-color); font-family: var(--font-heading);">${service.cliente_nombre || service.chef_nombre}</h4>
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
                <span style="color: var(--primary-color);">📋</span>
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
async function deleteRecipe(recipeId) {
  if (!confirm("¿Estás seguro de que quieres eliminar esta receta?")) {
    return
  }

  try {
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
  button.closest(".step-item").remove()
  updateStepNumbers()
}

function updateStepNumbers() {
  const steps = document.querySelectorAll(".step-item h4")
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
      const preview = input.parentElement.querySelector(".step-image-preview")
      const img = preview.querySelector("img")

      img.src = e.target.result
      preview.classList.remove("hidden")
    }
    reader.readAsDataURL(file)
  }
}

function removeStepImage(button) {
  const preview = button.parentElement
  const input = preview.parentElement.querySelector('input[type="file"]')

  input.value = ""
  preview.classList.add("hidden")
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
      const preview = document.getElementById("finalImagePreview")
      const img = preview.querySelector("img")

      img.src = e.target.result
      preview.classList.remove("hidden")
    }
    reader.readAsDataURL(file)
  }
}

function removeFinalImage() {
  const input = document.querySelector('input[name="final_image"]')
  const preview = document.getElementById("finalImagePreview")

  input.value = ""
  preview.classList.add("hidden")
}

// Update the saveRecipe function to handle the new form structure
async function saveRecipe(event) {
  event.preventDefault()
  const formData = new FormData(event.target)

  // Validate that we have at least one ingredient
  const ingredients = formData.getAll("ingredient_name[]").filter((name) => name.trim() !== "")
  if (ingredients.length === 0) {
    showToast("Debes agregar al menos un ingrediente", "error")
    return
  }

  // Validate that we have at least one step
  const steps = formData.getAll("step_description[]").filter((desc) => desc.trim() !== "")
  if (steps.length === 0) {
    showToast("Debes agregar al menos un paso", "error")
    return
  }

  // Validate final image
  if (!formData.get("final_image") || formData.get("final_image").size === 0) {
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
    showToast("Error de conexión", "error")
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
  document.getElementById("finalImagePreview").classList.add("hidden")
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
