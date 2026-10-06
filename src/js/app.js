/**
 * CLINOVA - Master Application Controller & Router
 * SPA Engine handling views, role routing guards, interactive components, modals, toasts, and AI chat.
 * Complete Multi-Role Execution (Patient Dashboard, Doctor Workspace, Admin Control Center, AI Assistant).
 */

document.addEventListener('DOMContentLoaded', () => {
  ClinovaApp.init();
});

const ClinovaApp = {
  currentRoute: 'landing',
  activeRole: 'GUEST',
  
  init() {
    this.bindEvents();
    this.setupAuthListener();
    this.renderNavigation();
    this.navigate(window.location.hash.replace('#', '') || 'landing');
    this.initTheme();
    this.initAIChat();
  },

  initTheme() {
    const isDark = localStorage.getItem('clinova_dark_mode') === 'true';
    if (isDark) {
      document.documentElement.classList.add('dark-theme');
    }
  },

  toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark-theme');
    localStorage.setItem('clinova_dark_mode', isDark);
    this.showToast(`Switched to ${isDark ? 'Dark' : 'Light'} Mode`, 'info');
  },

  setupAuthListener() {
    window.addEventListener('clinova-auth-change', (e) => {
      this.renderNavigation();
      const user = window.clinovaAuth.getCurrentUser();
      if (user) {
        this.showToast(`Welcome back, ${user.fullName}`, 'success');
        if (user.role === 'PATIENT') this.navigate('patient-dashboard');
        else if (user.role === 'DOCTOR') this.navigate('doctor-dashboard');
        else if (user.role === 'ADMIN') this.navigate('admin-dashboard');
      } else {
        this.showToast('Signed out of CLINOVA session', 'info');
        this.navigate('landing');
      }
    });
  },

  bindEvents() {
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) themeBtn.addEventListener('click', () => this.toggleTheme());

    window.addEventListener('hashchange', () => {
      const route = window.location.hash.replace('#', '');
      if (route) this.navigate(route);
    });
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'info';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'alert-circle';
    if (type === 'warning') icon = 'alert-triangle';

    toast.innerHTML = `<i data-lucide="${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);
    
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, 4000);
  },

  renderUnauthorized(title = 'Access Restricted') {
    const container = document.getElementById('main-content');
    if (!container) return;

    container.innerHTML = `
      <div class="max-w-2xl mx-auto py-16 px-4 text-center space-y-4">
        <div class="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto mb-2">
          <i data-lucide="shield-alert" class="w-8 h-8"></i>
        </div>
        <h2 class="text-3xl font-extrabold text-slate-100">403 — ${title}</h2>
        <p class="text-xs text-slate-400 max-w-md mx-auto">You do not have permission to access this protected healthcare route. Please sign in with an authorized account.</p>
        <div class="pt-4 flex justify-center gap-3">
          <a href="#login" class="btn btn-primary py-2.5 px-6 text-xs">Patient Login</a>
          <a href="#doctor-login" class="btn btn-secondary py-2.5 px-6 text-xs">Doctor Portal</a>
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  },

  renderErrorState(message = 'An unexpected error occurred', retryCallback = null) {
    const container = document.getElementById('main-content');
    if (!container) return;

    container.innerHTML = `
      <div class="max-w-2xl mx-auto py-16 px-4 text-center space-y-4">
        <div class="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto mb-2">
          <i data-lucide="alert-triangle" class="w-8 h-8"></i>
        </div>
        <h2 class="text-2xl font-bold text-slate-100">${message}</h2>
        <p class="text-xs text-slate-400 max-w-md mx-auto">Please check your network connection or try refreshing the view.</p>
        <div class="pt-4 flex justify-center gap-3">
          <button id="err-retry-btn" class="btn btn-primary py-2.5 px-6 text-xs">
            <i data-lucide="refresh-cw" class="w-4 h-4"></i> Retry Loading
          </button>
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();

    const retryBtn = document.getElementById('err-retry-btn');
    if (retryBtn && retryCallback) {
      retryBtn.addEventListener('click', retryCallback);
    }
  },

  navigate(route) {
    const currentUser = window.clinovaAuth.getCurrentUser();
    this.activeRole = currentUser ? currentUser.role : 'GUEST';

    if (route.startsWith('patient-') && this.activeRole !== 'PATIENT' && this.activeRole !== 'ADMIN') {
      return this.renderUnauthorized('Patient Access Restricted');
    }
    if (route.startsWith('doctor-') && route !== 'doctor-login' && this.activeRole !== 'DOCTOR' && this.activeRole !== 'ADMIN') {
      return this.renderUnauthorized('Doctor Workspace Restricted');
    }
    if (route.startsWith('admin-') && route !== 'admin-login' && this.activeRole !== 'ADMIN') {
      return this.renderUnauthorized('Admin Control Center Restricted');
    }

    this.currentRoute = route;
    window.location.hash = route;
    this.renderNavigation();
    
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div class="skeleton h-12 w-64"></div>
        <div class="skeleton h-40 w-full rounded-2xl"></div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="skeleton h-28 w-full rounded-xl"></div>
          <div class="skeleton h-28 w-full rounded-xl"></div>
          <div class="skeleton h-28 w-full rounded-xl"></div>
          <div class="skeleton h-28 w-full rounded-xl"></div>
        </div>
      </div>
    `;

    setTimeout(async () => {
      try {
        switch (route) {
          case 'landing':
            this.renderLandingPage();
            break;
          case 'login':
            this.renderLoginView('PATIENT');
            break;
          case 'doctor-login':
            this.renderLoginView('DOCTOR');
            break;
          case 'admin-login':
            this.renderLoginView('ADMIN');
            break;
          case 'register':
            this.renderRegisterView();
            break;
          case 'patient-dashboard':
            await this.renderPatientDashboard();
            break;
          case 'patient-doctors':
            await this.renderDoctorDiscoveryView();
            break;
          case 'patient-book':
            await this.renderBookingWizard();
            break;
          case 'patient-appointments':
            await this.renderPatientAppointments();
            break;
          case 'patient-records':
            await this.renderPatientRecords();
            break;
          case 'patient-profile':
            await this.renderPatientProfile();
            break;
          case 'doctor-dashboard':
            await this.renderDoctorDashboard();
            break;
          case 'doctor-appointments':
            await this.renderDoctorDashboard();
            break;
          case 'doctor-patients':
            await this.renderDoctorPatients();
            break;
          case 'doctor-schedule':
            this.openDoctorScheduleModal();
            break;
          case 'doctor-profile':
            await this.renderDoctorProfile();
            break;
          case 'admin-dashboard':
            await this.renderAdminDashboard();
            break;
          case 'admin-patients':
            await this.renderAdminPatients();
            break;
          case 'admin-doctors':
            await this.renderAdminDoctors();
            break;
          case 'admin-appointments':
            await this.renderAdminAppointments();
            break;
          case 'admin-analytics':
            await this.renderAdminDashboard();
            break;
          case 'admin-audit':
            await this.renderAdminAuditLogs();
            break;
          default:
            this.renderLandingPage();
        }
      } catch (err) {
        console.error('Route render error:', err);
        this.renderErrorState('Unable to load view', () => this.navigate(route));
      }
      if (window.lucide) window.lucide.createIcons();
    }, 150);
  },

  renderNavigation() {
    const navContainer = document.getElementById('navbar-links');
    const user = window.clinovaAuth.getCurrentUser();
    
    let linksHtml = '';
    if (!user) {
      linksHtml = `
        <a href="#landing" class="hover:text-cyan-400 px-3 py-2 text-sm font-medium transition">Home</a>
        <a href="#login" class="hover:text-cyan-400 px-3 py-2 text-sm font-medium transition">Patient Portal</a>
        <a href="#doctor-login" class="hover:text-cyan-400 px-3 py-2 text-sm font-medium transition">Doctor Portal</a>
        <a href="#admin-login" class="hover:text-cyan-400 px-3 py-2 text-sm font-medium transition">Admin Portal</a>
      `;
    } else if (user.role === 'PATIENT') {
      linksHtml = `
        <a href="#patient-dashboard" class="hover:text-cyan-400 px-3 py-2 text-sm font-medium transition">Dashboard</a>
        <a href="#patient-doctors" class="hover:text-cyan-400 px-3 py-2 text-sm font-medium transition">Discover Doctors</a>
        <a href="#patient-book" class="hover:text-cyan-400 px-3 py-2 text-sm font-medium transition">Book Appointment</a>
        <a href="#patient-appointments" class="hover:text-cyan-400 px-3 py-2 text-sm font-medium transition">Appointments</a>
        <a href="#patient-records" class="hover:text-cyan-400 px-3 py-2 text-sm font-medium transition">Medical Records</a>
        <a href="#patient-profile" class="hover:text-cyan-400 px-3 py-2 text-sm font-medium transition">Profile</a>
      `;
    } else if (user.role === 'DOCTOR') {
      linksHtml = `
        <a href="#doctor-dashboard" class="hover:text-cyan-400 px-3 py-2 text-sm font-medium transition">Doctor Workspace</a>
        <a href="#doctor-patients" class="hover:text-cyan-400 px-3 py-2 text-sm font-medium transition">Assigned Patients</a>
        <a href="#doctor-profile" class="hover:text-cyan-400 px-3 py-2 text-sm font-medium transition">Doctor Profile</a>
      `;
    } else if (user.role === 'ADMIN') {
      linksHtml = `
        <a href="#admin-dashboard" class="hover:text-cyan-400 px-3 py-2 text-sm font-medium transition">Control Center</a>
        <a href="#admin-patients" class="hover:text-cyan-400 px-3 py-2 text-sm font-medium transition">Patients</a>
        <a href="#admin-doctors" class="hover:text-cyan-400 px-3 py-2 text-sm font-medium transition">Doctors</a>
        <a href="#admin-appointments" class="hover:text-cyan-400 px-3 py-2 text-sm font-medium transition">Appointments</a>
        <a href="#admin-analytics" class="hover:text-cyan-400 px-3 py-2 text-sm font-medium transition">Analytics</a>
        <a href="#admin-audit" class="hover:text-cyan-400 px-3 py-2 text-sm font-medium transition">Audit Logs</a>
      `;
    }

    if (navContainer) navContainer.innerHTML = linksHtml;

    const userArea = document.getElementById('navbar-user-area');
    if (userArea) {
      if (user) {
        userArea.innerHTML = `
          <div class="flex items-center gap-3">
            ${user.role === 'PATIENT' ? `
              <div class="relative">
                <button onclick="ClinovaApp.toggleNotificationDropdown()" class="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-400 transition relative">
                  <i data-lucide="bell" class="w-4 h-4"></i>
                  <span class="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400"></span>
                </button>
                <div id="notif-dropdown" class="hidden absolute right-0 mt-2 w-80 glass-card p-4 border border-slate-800 shadow-2xl z-50">
                  <h4 class="font-bold text-xs text-slate-200 mb-2 border-b border-slate-800 pb-2">Patient Notifications</h4>
                  <div id="notif-dropdown-list" class="space-y-2 text-xs">
                    <div class="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <p class="font-semibold text-cyan-400">Appointment Confirmed</p>
                      <p class="text-slate-400 text-[10px]">Your visit with Dr. Sarah Mitchell is confirmed.</p>
                    </div>
                    <div class="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <p class="font-semibold text-teal-400">Synthetic Medical Record Updated</p>
                      <p class="text-slate-400 text-[10px]">New consultation summary has been added to your timeline.</p>
                    </div>
                  </div>
                </div>
              </div>
            ` : ''}
            <span class="badge badge-demo">${user.role}</span>
            <span class="text-sm font-semibold hidden md:inline">${user.fullName}</span>
            <button onclick="window.clinovaAuth.clearSession()" class="btn btn-sm btn-secondary">
              <i data-lucide="log-out" class="w-4 h-4"></i> Sign Out
            </button>
          </div>
        `;
      } else {
        userArea.innerHTML = `
          <div class="flex items-center gap-2">
            <a href="#login" class="btn btn-sm btn-secondary">Sign In</a>
            <a href="#register" class="btn btn-sm btn-primary">Get Started</a>
          </div>
        `;
      }
    }
  },

  formatDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const year = parts[0];
      const month = months[parseInt(parts[1], 10) - 1];
      const day = parseInt(parts[2], 10);
      if (month) return `${month} ${day}, ${year}`;
    }
    return dateStr;
  },

  getNotificationsForPatient(user, appts = [], records = []) {
    const notifs = [];
    const upcomingAppts = appts.filter(a => a.status === 'CONFIRMED' || a.status === 'WAITING' || a.status === 'PENDING');
    if (upcomingAppts.length > 0) {
      const next = upcomingAppts[0];
      notifs.push({
        title: 'Appointment Confirmed',
        message: `Your visit with ${next.doctorName} is confirmed for ${this.formatDate(next.date)} at ${next.time}.`,
        time: 'Just now',
        type: 'confirmed'
      });
      notifs.push({
        title: 'Appointment Reminder',
        message: `Upcoming consultation at ${next.location}.`,
        time: 'Today',
        type: 'reminder'
      });
    }
    if (records.length > 0) {
      const latestRec = records[0];
      notifs.push({
        title: 'Medical Record Updated',
        message: `New diagnosis logged by ${latestRec.doctorName}: "${latestRec.diagnosis}".`,
        time: latestRec.date,
        type: 'record'
      });
    }
    const cancelledAppt = appts.find(a => a.status === 'CANCELLED');
    if (cancelledAppt) {
      notifs.push({
        title: 'Appointment Cancelled',
        message: `Visit with ${cancelledAppt.doctorName} on ${this.formatDate(cancelledAppt.date)} was cancelled.`,
        time: 'Recent',
        type: 'cancelled'
      });
    }
    if (notifs.length === 0) {
      notifs.push({
        title: 'Welcome to CLINOVA',
        message: 'Your patient portal is active. Book an appointment to get started.',
        time: 'System',
        type: 'info'
      });
    }
    return notifs;
  },

  async toggleNotificationDropdown() {
    const dropdown = document.getElementById('notif-dropdown');
    if (!dropdown) return;
    const isHidden = dropdown.classList.contains('hidden');
    dropdown.classList.toggle('hidden');
    if (isHidden) {
      const user = window.clinovaAuth.getCurrentUser();
      if (user && user.role === 'PATIENT') {
        const apptsRes = await window.clinovaAPI.getAppointments(user);
        const recordsRes = await window.clinovaAPI.getMedicalRecords(user);
        const appts = apptsRes.success ? apptsRes.data : [];
        const records = recordsRes.success ? recordsRes.data : [];
        const notifs = this.getNotificationsForPatient(user, appts, records);

        const listContainer = document.getElementById('notif-dropdown-list');
        if (listContainer) {
          listContainer.innerHTML = notifs.map(n => `
            <div class="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 transition">
              <div class="flex items-center justify-between mb-1">
                <span class="font-bold text-xs ${n.type === 'confirmed' ? 'text-cyan-400' : n.type === 'record' ? 'text-teal-400' : n.type === 'cancelled' ? 'text-red-400' : 'text-slate-200'}">${n.title}</span>
                <span class="text-[10px] text-slate-500 font-mono">${n.time}</span>
              </div>
              <p class="text-slate-300 text-[11px] leading-snug">${n.message}</p>
            </div>
          `).join('');
        }
      }
    }
  },

  renderErrorState(title = 'Unable to load your dashboard', retryCallback = null) {
    const container = document.getElementById('main-content');
    container.innerHTML = `
      <div class="max-w-md mx-auto py-20 px-4 text-center">
        <div class="glass-card p-8 border border-red-500/40">
          <i data-lucide="alert-circle" class="w-16 h-16 text-red-500 mx-auto mb-4"></i>
          <h2 class="text-2xl font-bold text-slate-100">${title}</h2>
          <p class="text-xs text-slate-400 mt-2 mb-6">A temporary network or data error occurred while fetching your information.</p>
          <button onclick="ClinovaApp.navigate('${this.currentRoute}')" class="btn btn-primary py-2.5 px-6">
            <i data-lucide="refresh-cw" class="w-4 h-4"></i> Try Again
          </button>
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  },

  // --- DYNAMIC PATIENT DASHBOARD (`/#patient-dashboard`) ---

  async renderPatientDashboard() {
    const user = window.clinovaAuth.getCurrentUser();
    const container = document.getElementById('main-content');

    if (!user || user.role !== 'PATIENT') return this.renderUnauthorized('Patient Access Restricted');

    try {
      const apptsRes = await window.clinovaAPI.getAppointments(user);
      const profileRes = await window.clinovaAPI.getPatientProfile(user);
      const recordsRes = await window.clinovaAPI.getMedicalRecords(user);

      if (!apptsRes.success || !profileRes.success || !recordsRes.success) {
        return this.renderErrorState('Unable to load your dashboard');
      }

      const appts = apptsRes.data || [];
      const patient = profileRes.data || {};
      const records = recordsRes.data || [];

      // Dynamic Greeting Name
      const firstName = user.fullName ? user.fullName.split(' ')[0] : 'Patient';
      const hour = new Date().getHours();
      const greetingTime = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

      // Calculate Appointment Summary Metrics dynamically
      const upcomingAppts = appts.filter(a => a.status === 'CONFIRMED' || a.status === 'WAITING' || a.status === 'PENDING');
      const upcomingCount = upcomingAppts.length;
      const completedCount = appts.filter(a => a.status === 'COMPLETED').length;
      const cancelledCount = appts.filter(a => a.status === 'CANCELLED').length;

      // Find next upcoming appointment (soonest date/time)
      const nextAppt = upcomingAppts.length > 0 ? upcomingAppts[0] : null;

      // Get latest 3 medical records
      const recentRecords = records.slice(0, 3);

      // Dynamic notifications
      const notifications = this.getNotificationsForPatient(user, appts, records);

      container.innerHTML = `
        <div class="max-w-7xl mx-auto px-4 py-8">
          <!-- Dynamic Greeting Header -->
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 class="text-3xl font-extrabold">${greetingTime}, ${firstName}</h1>
              <p class="text-xs text-slate-400 mt-1">Patient ID: <span class="font-mono text-cyan-400 font-bold">${user.patientId}</span> • Connected Care Workspace</p>
            </div>
            
            <!-- Quick Actions -->
            <div class="flex flex-wrap items-center gap-2">
              <a href="#patient-book" class="btn btn-primary"><i data-lucide="plus" class="w-4 h-4"></i> Book Appointment</a>
              <a href="#patient-doctors" class="btn btn-secondary"><i data-lucide="search" class="w-4 h-4"></i> Discover Doctors</a>
              <a href="#patient-appointments" class="btn btn-secondary"><i data-lucide="calendar" class="w-4 h-4"></i> View Appointments</a>
              <a href="#patient-records" class="btn btn-secondary"><i data-lucide="file-text" class="w-4 h-4"></i> Medical Records</a>
            </div>
          </div>

          <!-- Dynamic Upcoming Appointment Card -->
          <div class="mb-8">
            ${nextAppt ? `
              <div class="glass-card p-6 border-l-4 border-l-cyan-400 shadow-xl">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div class="space-y-1">
                    <span class="badge badge-demo mb-1">Next Upcoming Appointment</span>
                    <h3 class="text-xl font-bold text-slate-100">${nextAppt.doctorName}</h3>
                    <p class="text-xs font-semibold text-cyan-400">${nextAppt.specialization}</p>
                    <div class="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
                      <span><i data-lucide="calendar" class="inline w-3.5 h-3.5 text-cyan-400"></i> ${this.formatDate(nextAppt.date)}</span>
                      <span><i data-lucide="clock" class="inline w-3.5 h-3.5 text-cyan-400"></i> ${nextAppt.time}</span>
                      <span><i data-lucide="map-pin" class="inline w-3.5 h-3.5 text-cyan-400"></i> ${nextAppt.location}</span>
                    </div>
                    <p class="text-xs text-slate-400 font-mono pt-1">ID: ${nextAppt.appointmentId} • Reason: "${nextAppt.reason}"</p>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="badge badge-${nextAppt.status.toLowerCase()}">${nextAppt.status}</span>
                    <button onclick="ClinovaApp.openRescheduleModal('${nextAppt.appointmentId}')" class="btn btn-sm btn-secondary">Reschedule</button>
                    <button onclick="ClinovaApp.cancelAppointment('${nextAppt.appointmentId}')" class="btn btn-sm btn-danger">Cancel</button>
                  </div>
                </div>
              </div>
            ` : `
              <div class="glass-card p-8 text-center border border-slate-800">
                <i data-lucide="calendar-off" class="w-12 h-12 text-slate-500 mx-auto mb-3"></i>
                <h3 class="text-lg font-bold text-slate-200">No upcoming appointments</h3>
                <p class="text-xs text-slate-400 mt-1 mb-4">You have no scheduled visits at this time.</p>
                <a href="#patient-book" class="btn btn-primary py-2.5 px-6">Book an Appointment</a>
              </div>
            `}
          </div>

          <!-- Dynamic Calculated Appointment Summary -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div class="glass-card p-5 flex items-center justify-between">
              <div>
                <span class="text-xs text-slate-400">Upcoming Appointments</span>
                <h3 class="text-3xl font-extrabold text-cyan-400 mt-1">${upcomingCount}</h3>
              </div>
              <div class="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold"><i data-lucide="calendar" class="w-5 h-5"></i></div>
            </div>

            <div class="glass-card p-5 flex items-center justify-between">
              <div>
                <span class="text-xs text-slate-400">Completed Visits</span>
                <h3 class="text-3xl font-extrabold text-emerald-400 mt-1">${completedCount}</h3>
              </div>
              <div class="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold"><i data-lucide="check-circle-2" class="w-5 h-5"></i></div>
            </div>

            <div class="glass-card p-5 flex items-center justify-between">
              <div>
                <span class="text-xs text-slate-400">Cancelled Visits</span>
                <h3 class="text-3xl font-extrabold text-red-400 mt-1">${cancelledCount}</h3>
              </div>
              <div class="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center font-bold"><i data-lucide="x-circle" class="w-5 h-5"></i></div>
            </div>
          </div>

          <!-- Synthetic Health Snapshot -->
          <div class="mb-8">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-bold">Health Snapshot</h3>
              <span class="badge badge-demo font-bold tracking-widest text-cyan-400">DEMO MEDICAL DATA</span>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="glass-card p-4">
                <span class="text-xs text-slate-400">Blood Pressure</span>
                <h4 class="text-xl font-bold text-cyan-400 mt-1">${patient.healthSnapshot?.bloodPressure || '120/80 mmHg'}</h4>
                <span class="text-[10px] text-emerald-400">Optimal Range</span>
              </div>
              <div class="glass-card p-4">
                <span class="text-xs text-slate-400">Heart Rate</span>
                <h4 class="text-xl font-bold text-teal-400 mt-1">${patient.healthSnapshot?.heartRate || '72 bpm'}</h4>
                <span class="text-[10px] text-emerald-400">Resting Normal</span>
              </div>
              <div class="glass-card p-4">
                <span class="text-xs text-slate-400">BMI</span>
                <h4 class="text-xl font-bold text-blue-400 mt-1">${patient.healthSnapshot?.bmi || '22.4 kg/m²'}</h4>
                <span class="text-[10px] text-emerald-400">Healthy</span>
              </div>
              <div class="glass-card p-4">
                <span class="text-xs text-slate-400">Temperature</span>
                <h4 class="text-xl font-bold text-purple-400 mt-1">${patient.healthSnapshot?.temperature || '98.6 °F'}</h4>
                <span class="text-[10px] text-emerald-400">Normal</span>
              </div>
            </div>
          </div>

          <!-- Grid: Recent Records & Synthetic Notifications -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Recent Synthetic Medical Records (Latest 3) -->
            <div class="lg:col-span-2 glass-card p-6 border border-slate-800">
              <div class="flex justify-between items-center mb-6">
                <h3 class="text-lg font-bold">Recent Medical Records</h3>
                <a href="#patient-records" class="text-xs text-cyan-400 font-semibold hover:underline">View All Records →</a>
              </div>

              ${recentRecords.length > 0 ? `
                <div class="space-y-4">
                  ${recentRecords.map(r => `
                    <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                      <div>
                        <span class="font-mono text-cyan-400 font-bold">${r.recordId} • ${this.formatDate(r.date)}</span>
                        <h4 class="font-bold text-sm text-slate-100 mt-0.5">${r.diagnosis}</h4>
                        <p class="text-slate-400 text-[11px]">Doctor: ${r.doctorName} • Visit Reason: "${r.visitReason}"</p>
                      </div>
                      <div class="text-right">
                        <span class="text-teal-300 font-mono block text-xs font-semibold">Rx: ${r.prescription}</span>
                      </div>
                    </div>
                  `).join('')}
                </div>
              ` : `
                <div class="p-8 text-center text-xs text-slate-400">
                  <i data-lucide="file-x" class="w-10 h-10 text-slate-500 mx-auto mb-2"></i>
                  No synthetic medical records logged yet.
                </div>
              `}
            </div>

            <!-- Dynamic Patient Notifications Panel -->
            <div class="glass-card p-6 border border-slate-800">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-bold">Notifications</h3>
                <span class="badge badge-demo">Real-time</span>
              </div>
              <div class="space-y-3">
                ${notifications.map(n => `
                  <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div class="flex items-center justify-between mb-1">
                      <span class="font-bold text-xs ${n.type === 'confirmed' ? 'text-cyan-400' : n.type === 'record' ? 'text-teal-400' : n.type === 'cancelled' ? 'text-red-400' : 'text-slate-200'}">${n.title}</span>
                      <span class="text-[10px] text-slate-500 font-mono">${n.time}</span>
                    </div>
                    <p class="text-slate-300 text-xs leading-snug">${n.message}</p>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      this.renderErrorState('Unable to load your dashboard');
    }
  },

  // --- LANDING & AUTH VIEWS ---

  renderLandingPage() {
    const container = document.getElementById('main-content');
    container.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 py-12">
        <div class="mb-8 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between text-xs text-cyan-400">
          <span class="flex items-center gap-2"><i data-lucide="shield-check" class="w-4 h-4"></i> Built for Privacy • Synthetic Demo Data Sandbox Only</span>
          <span class="font-mono">BUILD SECURE 24 — PS-04</span>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-6">
              <span class="pulse-dot"></span> Next-Gen Healthcare SaaS
            </div>
            <h1 class="text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
              Healthcare, Connected. <br/><span class="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500">Care, Simplified.</span>
            </h1>
            <p class="text-lg text-slate-400 mb-8 max-w-xl">
              A secure clinic management platform connecting patients, doctors, and administrators through one intelligent healthcare workspace.
            </p>
            <div class="flex flex-wrap gap-4">
              <a href="#register" class="btn btn-primary text-base py-3 px-8">Get Started Free</a>
              <button onclick="ClinovaApp.loginAsDemoRole('PATIENT')" class="btn btn-secondary text-base py-3 px-8">Explore Interactive Demo</button>
            </div>
          </div>

          <div class="relative">
            <div class="glass-card p-6 border border-cyan-500/30 shadow-2xl relative z-10">
              <div class="flex items-center justify-between pb-4 mb-4 border-b border-slate-700/50">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full bg-red-500"></div>
                  <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div class="w-3 h-3 rounded-full bg-green-500"></div>
                  <span class="text-xs font-mono text-slate-400 ml-2">clinova.app/workspace</span>
                </div>
                <span class="badge badge-confirmed">System Live</span>
              </div>
              
              <div class="space-y-4">
                <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span class="text-xs text-slate-400">Next Appointment</span>
                    <h4 class="font-bold text-slate-200">Dr. Sarah Mitchell (General Medicine)</h4>
                    <span class="text-xs text-cyan-400">Oct 14, 2026 • 10:30 AM</span>
                  </div>
                  <span class="badge badge-confirmed">Confirmed</span>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span class="text-xs text-slate-400">Blood Pressure</span>
                    <h3 class="text-xl font-bold text-cyan-400 mt-1">120/80 <span class="text-xs font-normal text-slate-400">mmHg</span></h3>
                    <span class="text-[10px] text-emerald-400">Optimal Range</span>
                  </div>
                  <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span class="text-xs text-slate-400">Heart Rate</span>
                    <h3 class="text-xl font-bold text-teal-400 mt-1">72 <span class="text-xs font-normal text-slate-400">bpm</span></h3>
                    <span class="text-[10px] text-emerald-400">Resting Normal</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="glass-card p-8 text-center bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-cyan-500/30">
          <h2 class="text-3xl font-bold mb-4">Launch Interactive Hackathon Demo</h2>
          <p class="text-slate-400 mb-8 max-w-lg mx-auto">One-click sign in as pre-configured Patient, Doctor, or Admin account to test every feature instantly.</p>
          <div class="flex flex-wrap justify-center gap-4">
            <button onclick="ClinovaApp.loginAsDemoRole('PATIENT')" class="btn btn-primary py-3 px-6">
              <i data-lucide="user" class="w-4 h-4"></i> Patient Demo
            </button>
            <button onclick="ClinovaApp.loginAsDemoRole('DOCTOR')" class="btn btn-secondary py-3 px-6">
              <i data-lucide="stethoscope" class="w-4 h-4"></i> Doctor Demo
            </button>
            <button onclick="ClinovaApp.loginAsDemoRole('ADMIN')" class="btn btn-secondary py-3 px-6">
              <i data-lucide="shield" class="w-4 h-4"></i> Admin Demo
            </button>
          </div>
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  },

  renderLoginView(role = 'PATIENT') {
    const container = document.getElementById('main-content');
    let title = role === 'DOCTOR' ? 'Doctor Portal Login' : role === 'ADMIN' ? 'Admin Control Center' : 'Patient Login';
    let demoEmail = role === 'DOCTOR' ? 'doctor@clinova.demo' : role === 'ADMIN' ? 'admin@clinova.demo' : 'patient@clinova.demo';
    let demoPass = role === 'DOCTOR' ? 'Doctor@123' : role === 'ADMIN' ? 'Admin@123' : 'Patient@123';

    container.innerHTML = `
      <div class="max-w-md mx-auto py-12 px-4">
        <div class="glass-card p-8 border border-slate-800">
          <div class="text-center mb-6">
            <h2 class="text-2xl font-bold">${title}</h2>
          </div>

          <div class="p-3 mb-6 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-xs">
            <div class="flex items-center justify-between mb-1">
              <span class="font-bold text-cyan-400">Judge / Demo Account:</span>
              <button onclick="ClinovaApp.fillDemoCredentials('${demoEmail}', '${demoPass}')" class="text-[10px] text-slate-300 hover:underline">Auto-fill</button>
            </div>
            <p class="text-slate-300 font-mono">Email: ${demoEmail}</p>
            <p class="text-slate-300 font-mono">Pass: ${demoPass}</p>
          </div>

          <form id="login-form" onsubmit="ClinovaApp.handleLoginSubmit(event)">
            <div class="mb-4">
              <label class="block text-xs font-semibold text-slate-400 mb-2">Email Address</label>
              <input type="email" id="login-email" required class="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-100 text-sm focus:border-cyan-500 outline-none" placeholder="name@clinova.demo">
            </div>

            <div class="mb-6">
              <label class="block text-xs font-semibold text-slate-400 mb-2">Password</label>
              <input type="password" id="login-password" required class="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-100 text-sm focus:border-cyan-500 outline-none" placeholder="••••••••">
            </div>

            <button type="submit" class="w-full btn btn-primary py-3 mb-4">Sign In to Dashboard</button>
          </form>

          <!-- Google OAuth SSO Integration -->
          <div class="relative my-6 text-center">
            <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-800"></div></div>
            <span class="relative px-3 bg-slate-950 text-[10px] text-slate-400 uppercase font-mono tracking-wider">Or Sign In with Google</span>
          </div>

          <div class="flex justify-center min-h-[44px]" id="google-login-container"></div>
        </div>
      </div>
    `;
    setTimeout(() => this.initGoogleSignIn('google-login-container'), 100);
  },

  initGoogleSignIn(containerId = 'google-login-container') {
    const container = document.getElementById(containerId);
    if (!container) return;

    window.handleGoogleCredentialResponse = async (response) => {
      if (response && response.credential) {
        ClinovaApp.showToast('Authenticating with Google OAuth 2.0...', 'info');
        const res = await window.clinovaAPI.loginWithGoogle(response.credential);
        if (res.success) {
          window.clinovaAuth.setSession(res.data.session);
        } else {
          ClinovaApp.showToast(`Google Sign-In error: ${res.message}`, 'error');
        }
      }
    };

    if (window.google && window.google.accounts && window.google.accounts.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: '312513267131-hepjiprnt8mmf2gjt9ulcvbbbtbstct6.apps.googleusercontent.com',
          callback: window.handleGoogleCredentialResponse
        });
        window.google.accounts.id.renderButton(
          container,
          { theme: 'filled_blue', size: 'large', width: 280, text: 'signin_with', shape: 'pill' }
        );
      } catch (e) {
        console.warn('Google Identity initialization deferred:', e);
      }
    }
  },

  renderRegisterView() {
    const container = document.getElementById('main-content');
    container.innerHTML = `
      <div class="max-w-lg mx-auto py-12 px-4">
        <div class="glass-card p-8 border border-slate-800">
          <h2 class="text-2xl font-bold text-center mb-6">Create Patient Account</h2>
          <form id="register-form" onsubmit="ClinovaApp.handleRegisterSubmit(event)" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-400 mb-1">Full Name</label>
              <input type="text" id="reg-name" required class="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-100 text-sm focus:border-cyan-500 outline-none" placeholder="Alex Johnson">
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-400 mb-1">Email</label>
                <input type="email" id="reg-email" required class="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-100 text-sm focus:border-cyan-500 outline-none" placeholder="alex@demo.com">
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-400 mb-1">Phone</label>
                <input type="text" id="reg-phone" required class="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-100 text-sm focus:border-cyan-500 outline-none" placeholder="+1 (555) 000-0000">
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-400 mb-1">Password</label>
                <input type="password" id="reg-pass" required class="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-100 text-sm focus:border-cyan-500 outline-none">
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-400 mb-1">Confirm Password</label>
                <input type="password" id="reg-confirm" required class="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-100 text-sm focus:border-cyan-500 outline-none">
              </div>
            </div>
            <button type="submit" class="w-full btn btn-primary py-3">Complete Registration</button>
          </form>

          <!-- Google OAuth SSO Integration -->
          <div class="relative my-6 text-center">
            <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-800"></div></div>
            <span class="relative px-3 bg-slate-950 text-[10px] text-slate-400 uppercase font-mono tracking-wider">Or Register with Google</span>
          </div>

          <div class="flex justify-center min-h-[44px]" id="google-register-container"></div>
        </div>
      </div>
    `;
    setTimeout(() => this.initGoogleSignIn('google-register-container'), 100);
  },

  async renderDoctorDiscoveryView() {
    const container = document.getElementById('main-content');
    
    // Skeleton Loading State
    container.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div class="skeleton h-10 w-72"></div>
        <div class="skeleton h-20 w-full rounded-2xl"></div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="skeleton h-64 w-full rounded-2xl"></div>
          <div class="skeleton h-64 w-full rounded-2xl"></div>
          <div class="skeleton h-64 w-full rounded-2xl"></div>
        </div>
      </div>
    `;

    const res = await window.clinovaAPI.getDoctors();
    const doctors = res.success ? res.data : [];

    container.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 py-8">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 class="text-3xl font-extrabold mb-1">Discover Authorized Doctors</h1>
            <p class="text-xs text-slate-400">Search board-certified clinical specialists, filter by experience & rating, and view real-time availability.</p>
          </div>
          <span class="badge badge-demo">Dynamic Verification</span>
        </div>

        <!-- Filter & Search Toolbar -->
        <div class="glass-card p-5 mb-8 border border-slate-800 space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <!-- Search Bar -->
            <div class="md:col-span-2 relative">
              <i data-lucide="search" class="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400"></i>
              <input type="text" id="doc-search-input" oninput="ClinovaApp.filterDoctorsList()" placeholder="Search doctor by name or specialization..." class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-100 outline-none focus:border-cyan-500">
            </div>

            <!-- Specialization Filter -->
            <div>
              <select id="doc-spec-filter" onchange="ClinovaApp.filterDoctorsList()" class="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-100 outline-none focus:border-cyan-500">
                <option value="ALL">All Specializations</option>
                <option value="General Medicine">General Medicine</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Dermatology">Dermatology</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="Neurology">Neurology</option>
              </select>
            </div>

            <!-- Sort By Dropdown -->
            <div>
              <select id="doc-sort-select" onchange="ClinovaApp.filterDoctorsList()" class="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-100 outline-none focus:border-cyan-500">
                <option value="rating_desc">Highest Rated ⭐</option>
                <option value="experience_desc">Most Experienced</option>
                <option value="available_first">Available Now</option>
                <option value="name_asc">Name A - Z</option>
              </select>
            </div>
          </div>

          <!-- Secondary Filters Row (Experience, Availability, Rating) -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800 text-xs">
            <div>
              <label class="block text-slate-400 mb-1">Experience</label>
              <select id="doc-exp-filter" onchange="ClinovaApp.filterDoctorsList()" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 outline-none focus:border-cyan-500">
                <option value="ALL">Any Experience</option>
                <option value="1-5">1 - 5 Years</option>
                <option value="5-10">5 - 10 Years</option>
                <option value="10+">10+ Years</option>
              </select>
            </div>

            <div>
              <label class="block text-slate-400 mb-1">Availability</label>
              <select id="doc-avail-filter" onchange="ClinovaApp.filterDoctorsList()" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 outline-none focus:border-cyan-500">
                <option value="ALL">All Statuses</option>
                <option value="Available">Available</option>
                <option value="Busy">Busy</option>
                <option value="Unavailable">Unavailable</option>
              </select>
            </div>

            <div>
              <label class="block text-slate-400 mb-1">Minimum Rating</label>
              <select id="doc-rating-filter" onchange="ClinovaApp.filterDoctorsList()" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 outline-none focus:border-cyan-500">
                <option value="ALL">Any Rating</option>
                <option value="4.5">⭐ 4.5+ Stars</option>
                <option value="4.8">⭐ 4.8+ Stars</option>
                <option value="4.9">⭐ 4.9+ Stars</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Doctors Grid Container -->
        <div id="doctors-grid">
          ${this.renderDoctorsGridHtml(doctors)}
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  },

  renderDoctorsGridHtml(doctors = []) {
    if (!doctors || doctors.length === 0) {
      return `
        <div class="glass-card p-12 text-center border border-slate-800 my-8">
          <i data-lucide="user-x" class="w-16 h-16 text-slate-500 mx-auto mb-4"></i>
          <h3 class="text-xl font-bold text-slate-100 mb-1">No doctors found</h3>
          <p class="text-xs text-slate-400 mb-6 max-w-sm mx-auto">No clinical specialists match your search keywords and selected filters.</p>
          <button onclick="ClinovaApp.clearDoctorFilters()" class="btn btn-primary py-2.5 px-6">
            <i data-lucide="rotate-ccw" class="w-4 h-4"></i> Clear Filters
          </button>
        </div>
      `;
    }

    return `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${doctors.map(d => {
          const availStatus = d.availability || (d.availabilityStatus && d.availabilityStatus.includes('Today') ? 'Available' : 'Busy');
          const isAvailable = availStatus === 'Available' && d.status === 'Active';
          const isBusy = availStatus === 'Busy';
          
          let availBadge = '<span class="badge badge-confirmed"><i data-lucide="check-circle" class="w-3 h-3 inline"></i> Available</span>';
          if (isBusy) {
            availBadge = '<span class="badge badge-pending"><i data-lucide="clock" class="w-3 h-3 inline"></i> Busy</span>';
          } else if (!isAvailable) {
            availBadge = '<span class="badge badge-cancelled"><i data-lucide="x-circle" class="w-3 h-3 inline"></i> Unavailable</span>';
          }

          return `
            <div class="glass-card p-6 flex flex-col justify-between border border-slate-800 hover:border-cyan-500/50 transition shadow-xl">
              <div>
                <div class="flex items-start justify-between gap-3 mb-4">
                  <div class="flex items-center gap-3">
                    <img src="${d.profileImage}" class="w-14 h-14 rounded-full object-cover border-2 border-cyan-400 shadow-md">
                    <div>
                      <h3 class="text-base font-bold text-slate-100">${d.fullName}</h3>
                      <p class="text-xs font-semibold text-cyan-400">${d.specialization}</p>
                      <div class="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span class="text-amber-400 font-bold">⭐ ${d.rating}</span>
                        <span>•</span>
                        <span>${d.experience}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="flex items-center justify-between mb-3 text-xs">
                  <span class="text-slate-400">Status:</span>
                  ${availBadge}
                </div>

                <p class="text-xs text-slate-400 mb-6 line-clamp-2 leading-relaxed">${d.bio}</p>
              </div>

              <div class="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/80">
                <button onclick="ClinovaApp.openDoctorProfileModal('${d.doctorId}')" class="btn btn-secondary py-2 text-xs">
                  View Profile
                </button>
                <button onclick="ClinovaApp.bookWithDoctor('${d.doctorId}')" ${!isAvailable && !isBusy ? 'disabled title="Doctor Unavailable"' : ''} class="btn btn-primary py-2 text-xs ${!isAvailable && !isBusy ? 'opacity-50 cursor-not-allowed' : ''}">
                  Book Visit
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  async filterDoctorsList() {
    const search = document.getElementById('doc-search-input')?.value || '';
    const spec = document.getElementById('doc-spec-filter')?.value || 'ALL';
    const exp = document.getElementById('doc-exp-filter')?.value || 'ALL';
    const avail = document.getElementById('doc-avail-filter')?.value || 'ALL';
    const minRating = document.getElementById('doc-rating-filter')?.value || 'ALL';
    const sortBy = document.getElementById('doc-sort-select')?.value || 'rating_desc';

    const res = await window.clinovaAPI.getDoctors({
      search,
      specialization: spec,
      experience: exp,
      availability: avail,
      minRating,
      sortBy
    });

    const doctors = res.success ? res.data : [];
    const grid = document.getElementById('doctors-grid');
    if (grid) {
      grid.innerHTML = this.renderDoctorsGridHtml(doctors);
      if (window.lucide) window.lucide.createIcons();
    }
  },

  clearDoctorFilters() {
    if (document.getElementById('doc-search-input')) document.getElementById('doc-search-input').value = '';
    if (document.getElementById('doc-spec-filter')) document.getElementById('doc-spec-filter').value = 'ALL';
    if (document.getElementById('doc-exp-filter')) document.getElementById('doc-exp-filter').value = 'ALL';
    if (document.getElementById('doc-avail-filter')) document.getElementById('doc-avail-filter').value = 'ALL';
    if (document.getElementById('doc-rating-filter')) document.getElementById('doc-rating-filter').value = 'ALL';
    if (document.getElementById('doc-sort-select')) document.getElementById('doc-sort-select').value = 'rating_desc';
    this.filterDoctorsList();
  },

  async openDoctorProfileModal(doctorId) {
    const doctor = window.clinovaDB.findOne('doctors', d => d.doctorId === doctorId);
    if (!doctor) return this.showToast('Doctor profile not found', 'error');

    const slots = doctor.availableSlots && doctor.availableSlots.length > 0 
      ? doctor.availableSlots 
      : ['09:00 AM', '10:30 AM', '02:00 PM', '04:00 PM'];

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto';
    modal.innerHTML = `
      <div class="glass-card max-w-lg w-full p-6 border border-cyan-500/40 my-8 shadow-2xl">
        <div class="flex justify-between items-start mb-4 border-b border-slate-800 pb-4">
          <div class="flex items-center gap-4">
            <img src="${doctor.profileImage}" class="w-16 h-16 rounded-full object-cover border-2 border-cyan-400 shadow-md">
            <div>
              <h3 class="text-xl font-bold text-slate-100">${doctor.fullName}</h3>
              <p class="text-xs font-semibold text-cyan-400">${doctor.specialization} • ${doctor.doctorId}</p>
              <div class="flex items-center gap-2 text-xs text-slate-400 mt-1">
                <span class="text-amber-400 font-bold">⭐ ${doctor.rating}</span>
                <span>•</span>
                <span>${doctor.experience} Experience</span>
              </div>
            </div>
          </div>
          <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-slate-100 text-lg font-bold">&times;</button>
        </div>

        <div class="space-y-4 mb-6 text-xs">
          <div>
            <h4 class="font-bold text-slate-300 mb-1">Clinical Biography</h4>
            <p class="text-slate-400 leading-relaxed">${doctor.bio}</p>
          </div>

          <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
            <span class="text-slate-400">Current Availability:</span>
            <span class="badge badge-${(doctor.availability || 'Available').toLowerCase() === 'available' ? 'confirmed' : 'pending'}">
              ${doctor.availabilityStatus || doctor.availability || 'Available Today'}
            </span>
          </div>

          <div>
            <h4 class="font-bold text-slate-300 mb-2">Available Consultation Slots</h4>
            <div class="flex flex-wrap gap-2">
              ${slots.map(s => `<span class="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-cyan-400 font-mono text-[11px]">${s}</span>`).join('')}
            </div>
          </div>
        </div>

        <div class="flex gap-3 pt-2 border-t border-slate-800">
          <button onclick="this.closest('.fixed').remove()" class="w-1/2 btn btn-secondary py-2.5">Close</button>
          <button onclick="this.closest('.fixed').remove(); ClinovaApp.bookWithDoctor('${doctor.doctorId}');" class="w-1/2 btn btn-primary py-2.5">
            Book Appointment
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
  },

  bookWithDoctor(doctorId) {
    const doctor = window.clinovaDB.findOne('doctors', d => d.doctorId === doctorId);
    if (doctor && (doctor.availability === 'Unavailable' || doctor.status !== 'Active')) {
      return this.showToast('This doctor is currently unavailable for booking.', 'warning');
    }
    const user = window.clinovaAuth.getCurrentUser();
    if (!user || user.role !== 'PATIENT') {
      this.showToast('Please sign in to book an appointment.', 'info');
      return this.navigate('login');
    }
    this.selectedBookingDoctorId = doctorId;
    this.navigate('patient-book');
  },

  async renderBookingWizard() {
    const user = window.clinovaAuth.getCurrentUser();
    if (!user || user.role !== 'PATIENT') {
      this.showToast('Please sign in as a patient to book an appointment.', 'info');
      return this.navigate('login');
    }

    const container = document.getElementById('main-content');
    
    // Skeleton loading state
    container.innerHTML = `
      <div class="max-w-3xl mx-auto py-8 px-4 space-y-6">
        <div class="skeleton h-10 w-64"></div>
        <div class="skeleton h-96 w-full rounded-2xl"></div>
      </div>
    `;

    const docsRes = await window.clinovaAPI.getDoctors();
    const doctors = docsRes.success ? docsRes.data : [];

    const targetDoctorId = this.selectedBookingDoctorId || (doctors[0] ? doctors[0].doctorId : '');
    this.selectedBookingDoctorId = null; // reset after consumption

    const todayStr = new Date().toISOString().split('T')[0];

    container.innerHTML = `
      <div class="max-w-3xl mx-auto py-8 px-4">
        <div class="glass-card p-8 border border-slate-800 shadow-2xl">
          <div class="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
            <div>
              <h2 class="text-2xl font-bold text-slate-100">Book an Appointment</h2>
              <p class="text-xs text-slate-400">Step-by-Step Healthcare Booking & Slot Reservation</p>
            </div>
            <span class="badge badge-demo">Secure Booking Guard</span>
          </div>

          <form id="booking-form" onsubmit="ClinovaApp.handleBookingSubmit(event)" class="space-y-6">
            
            <!-- STEP 1: SELECT DOCTOR -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="block text-xs font-bold uppercase tracking-wider text-cyan-400">Step 1 — Select Doctor</label>
                <span class="text-[11px] text-slate-400 font-mono" id="selected-doc-spec-badge"></span>
              </div>
              <div id="doctor-cards-grid" class="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto pr-1">
                ${doctors.map(d => {
                  const isSelected = d.doctorId === targetDoctorId;
                  const isAvailable = (d.availability || 'Available') === 'Available' && d.status === 'Active';
                  return `
                    <div onclick="${isAvailable ? `ClinovaApp.selectDoctorCard('${d.doctorId}', this)` : ''}" class="doctor-card-item p-4 rounded-xl border border-slate-800 bg-slate-900/60 ${isAvailable ? 'cursor-pointer hover:border-cyan-500' : 'opacity-50 cursor-not-allowed'} transition ${isSelected ? 'border-cyan-500 bg-cyan-500/10' : ''}">
                      <div class="flex items-center gap-3">
                        <img src="${d.profileImage}" class="w-12 h-12 rounded-full object-cover border border-cyan-500/40">
                        <div>
                          <h4 class="font-bold text-sm text-slate-100">${d.fullName}</h4>
                          <p class="text-xs font-semibold text-cyan-400">${d.specialization}</p>
                          <div class="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            <span class="text-amber-400 font-bold">⭐ ${d.rating}</span>
                            <span>•</span>
                            <span>${d.experience} exp</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
              <input type="hidden" id="book-doctor-id" value="${targetDoctorId}">
            </div>

            <!-- STEP 2: SELECT DATE -->
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2">Step 2 — Select Appointment Date</label>
              <input type="date" id="book-date" required value="${todayStr}" min="${todayStr}" onchange="ClinovaApp.loadBookingTimeSlots()" class="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:border-cyan-500 outline-none font-mono">
            </div>

            <!-- STEP 3: SELECT AVAILABLE TIME SLOT -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="block text-xs font-bold uppercase tracking-wider text-cyan-400">Step 3 — Select Available Time Slot</label>
                <span class="text-[10px] text-slate-400" id="slot-loading-status">Live Availability</span>
              </div>
              <div id="booking-slots-container" class="grid grid-cols-3 sm:grid-cols-4 gap-2">
                <div class="col-span-full py-4 text-center text-xs text-slate-500">Select a date to fetch available slots...</div>
              </div>
              <input type="hidden" id="book-time" value="">
            </div>

            <!-- STEP 4: VISIT REASON & TYPE -->
            <div class="space-y-4">
              <label class="block text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1">Step 4 — Visit Reason & Consultation Type</label>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button type="button" onclick="ClinovaApp.setVisitType('General Consultation', this)" class="visit-type-btn p-2.5 rounded-xl bg-slate-900 border border-cyan-500 bg-cyan-500/10 text-cyan-400 text-xs font-semibold">General</button>
                <button type="button" onclick="ClinovaApp.setVisitType('Follow-up', this)" class="visit-type-btn p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold hover:border-cyan-500">Follow-up</button>
                <button type="button" onclick="ClinovaApp.setVisitType('Routine Checkup', this)" class="visit-type-btn p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold hover:border-cyan-500">Checkup</button>
                <button type="button" onclick="ClinovaApp.setVisitType('Other', this)" class="visit-type-btn p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold hover:border-cyan-500">Other</button>
              </div>
              <input type="hidden" id="book-visit-type" value="General Consultation">

              <textarea id="book-reason" required rows="2" class="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs outline-none focus:border-cyan-500" placeholder="Provide details regarding symptoms or consultation purpose..."></textarea>
            </div>

            <!-- STEP 5: CONFIRMATION SUMMARY CARD -->
            <div class="p-4 rounded-xl bg-slate-900/80 border border-cyan-500/30 text-xs space-y-2 font-mono">
              <div class="flex items-center justify-between text-cyan-400 font-bold border-b border-slate-800 pb-2">
                <span>Step 5 — Booking Summary</span>
                <span>CLINOVA Hub</span>
              </div>
              <div class="flex justify-between"><span class="text-slate-400">Doctor:</span><span id="summary-doc-name" class="text-slate-100 font-bold">Select doctor...</span></div>
              <div class="flex justify-between"><span class="text-slate-400">Date & Time:</span><span id="summary-date-time" class="text-slate-100 font-bold">Select slot...</span></div>
              <div class="flex justify-between"><span class="text-slate-400">Location:</span><span class="text-slate-300">CLINOVA Main Hub - Suite 302</span></div>
            </div>

            <button type="submit" id="book-submit-btn" class="w-full btn btn-primary py-3.5 text-sm font-bold shadow-lg">
              <i data-lucide="check-circle" class="w-4 h-4"></i> Confirm & Reserve Appointment
            </button>
          </form>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
    this.loadBookingTimeSlots();
  },

  selectDoctorCard(doctorId, element) {
    document.querySelectorAll('.doctor-card-item').forEach(el => {
      el.classList.remove('border-cyan-500', 'bg-cyan-500/10');
    });
    element.classList.add('border-cyan-500', 'bg-cyan-500/10');
    document.getElementById('book-doctor-id').value = doctorId;
    this.loadBookingTimeSlots();
  },

  setVisitType(type, element) {
    document.querySelectorAll('.visit-type-btn').forEach(btn => {
      btn.classList.remove('border-cyan-500', 'bg-cyan-500/10', 'text-cyan-400');
      btn.classList.add('border-slate-800', 'text-slate-300');
    });
    element.classList.remove('border-slate-800', 'text-slate-300');
    element.classList.add('border-cyan-500', 'bg-cyan-500/10', 'text-cyan-400');
    document.getElementById('book-visit-type').value = type;
  },

  async loadBookingTimeSlots() {
    const doctorId = document.getElementById('book-doctor-id')?.value;
    const date = document.getElementById('book-date')?.value;
    const slotsContainer = document.getElementById('booking-slots-container');
    const timeInput = document.getElementById('book-time');
    if (!doctorId || !date || !slotsContainer) return;

    slotsContainer.innerHTML = `<div class="col-span-full py-2 text-center text-xs text-cyan-400"><i data-lucide="loader" class="w-4 h-4 inline animate-spin"></i> Checking slot availability...</div>`;
    if (window.lucide) window.lucide.createIcons();

    const doctor = window.clinovaDB.findOne('doctors', d => d.doctorId === doctorId);
    if (document.getElementById('summary-doc-name') && doctor) {
      document.getElementById('summary-doc-name').textContent = `${doctor.fullName} (${doctor.specialization})`;
    }

    const res = await window.clinovaAPI.getDoctorAvailableSlots(doctorId, date);
    const slots = res.success ? res.data : [];

    if (slots.length === 0) {
      slotsContainer.innerHTML = `<div class="col-span-full py-3 text-center text-xs text-red-400 font-semibold">No available slots for this date. Please select another date.</div>`;
      if (timeInput) timeInput.value = '';
      return;
    }

    // Auto select first available slot
    const firstFreeSlot = slots.find(s => s.isAvailable);
    if (timeInput) timeInput.value = firstFreeSlot ? firstFreeSlot.time : '';

    slotsContainer.innerHTML = slots.map(s => {
      const isSelected = firstFreeSlot && s.time === firstFreeSlot.time;
      if (!s.isAvailable) {
        return `
          <button type="button" disabled class="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800 text-slate-600 text-xs font-mono opacity-50 cursor-not-allowed relative" title="Slot Booked">
            ${s.time}
            <span class="block text-[9px] text-red-400/80 font-bold">Booked</span>
          </button>
        `;
      }
      return `
        <button type="button" onclick="ClinovaApp.selectTimeSlot('${s.time}', this)" class="time-slot-btn p-2.5 rounded-xl bg-slate-900 border ${isSelected ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400 font-bold shadow-md' : 'border-slate-700 text-slate-200 hover:border-cyan-400'} text-xs font-mono transition">
          ${s.time}
        </button>
      `;
    }).join('');

    this.updateBookingSummaryText();
  },

  selectTimeSlot(time, element) {
    document.querySelectorAll('.time-slot-btn').forEach(btn => {
      btn.classList.remove('border-cyan-500', 'bg-cyan-500/10', 'text-cyan-400', 'font-bold', 'shadow-md');
      btn.classList.add('border-slate-700', 'text-slate-200');
    });
    element.classList.remove('border-slate-700', 'text-slate-200');
    element.classList.add('border-cyan-500', 'bg-cyan-500/10', 'text-cyan-400', 'font-bold', 'shadow-md');

    const timeInput = document.getElementById('book-time');
    if (timeInput) timeInput.value = time;
    this.updateBookingSummaryText();
  },

  updateBookingSummaryText() {
    const date = document.getElementById('book-date')?.value;
    const time = document.getElementById('book-time')?.value;
    const summarySpan = document.getElementById('summary-date-time');
    if (summarySpan) {
      summarySpan.textContent = date && time ? `${this.formatDate(date)} at ${time}` : 'Select date and time slot';
    }
  },

  async handleBookingSubmit(e) {
    e.preventDefault();
    const user = window.clinovaAuth.getCurrentUser();
    const doctorId = document.getElementById('book-doctor-id').value;
    const date = document.getElementById('book-date').value;
    const time = document.getElementById('book-time').value;
    const visitType = document.getElementById('book-visit-type').value;
    const reason = document.getElementById('book-reason').value;

    if (!time) {
      return this.showToast('Please select an available time slot.', 'warning');
    }

    const submitBtn = document.getElementById('book-submit-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i data-lucide="loader" class="w-4 h-4 inline animate-spin"></i> Reserving Slot & Verifying...`;
    }

    const res = await window.clinovaAPI.bookAppointment(user, { doctorId, date, time, reason, visitType });
    
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<i data-lucide="check-circle" class="w-4 h-4"></i> Confirm & Reserve Appointment`;
    }

    if (res.success) {
      this.showToast('Appointment successfully booked!', 'success');
      this.renderBookingConfirmationModal(res.data);
    } else {
      // Double Booking Protection Error or Validation Error
      this.showToast(res.message, 'error');
      // Reload slots so user sees updated slot state
      this.loadBookingTimeSlots();
    }
  },

  renderBookingConfirmationModal(appointment) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto';
    modal.innerHTML = `
      <div class="glass-card max-w-md w-full p-6 border border-cyan-500/50 shadow-2xl my-8">
        <div class="text-center mb-6">
          <div class="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <i data-lucide="check-circle-2" class="w-8 h-8"></i>
          </div>
          <h2 class="text-2xl font-extrabold text-slate-100">Appointment Confirmed</h2>
          <p class="text-xs text-slate-400 mt-1">Digital Receipt & Verified Booking Confirmation</p>
        </div>

        <div class="space-y-3 p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs mb-6 font-mono">
          <div class="flex justify-between border-b border-slate-800 pb-2">
            <span class="text-slate-400">Appointment ID:</span>
            <span class="text-cyan-400 font-bold">${appointment.appointmentId}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Doctor:</span>
            <span class="text-slate-100 font-semibold">${appointment.doctorName}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Specialization:</span>
            <span class="text-cyan-400">${appointment.specialization}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Date & Time:</span>
            <span class="text-slate-100">${this.formatDate(appointment.date)} at ${appointment.time}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Location:</span>
            <span class="text-slate-300">${appointment.location}</span>
          </div>
          <div class="flex justify-between border-t border-slate-800 pt-2">
            <span class="text-slate-400">Status:</span>
            <span class="text-emerald-400 font-bold">${appointment.status}</span>
          </div>
        </div>

        <div class="space-y-2">
          <button onclick="ClinovaApp.downloadCalendarEvent('${appointment.appointmentId}')" class="w-full btn btn-secondary py-2.5 text-xs">
            <i data-lucide="calendar-plus" class="w-4 h-4"></i> Add to Calendar (.ics Download)
          </button>

          <div class="grid grid-cols-2 gap-2 pt-1">
            <button onclick="this.closest('.fixed').remove(); ClinovaApp.navigate('patient-appointments');" class="btn btn-secondary py-2.5 text-xs">
              View Appointments
            </button>
            <button onclick="this.closest('.fixed').remove(); ClinovaApp.navigate('patient-dashboard');" class="btn btn-primary py-2.5 text-xs">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
  },

  downloadCalendarEvent(appointmentId) {
    const appt = window.clinovaDB.findOne('appointments', a => a.appointmentId === appointmentId);
    if (!appt) return this.showToast('Appointment not found', 'error');

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//CLINOVA Healthcare Platform//Appointment Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${appt.appointmentId}@clinova.demo
SUMMARY:CLINOVA Appointment with ${appt.doctorName}
DESCRIPTION:Specialization: ${appt.specialization}\\nReason: ${appt.reason}\\nLocation: ${appt.location}
LOCATION:${appt.location}
STATUS:CONFIRMED
DTSTART:${appt.date.replace(/-/g, '')}T090000Z
DTEND:${appt.date.replace(/-/g, '')}T100000Z
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `CLINOVA-Appointment-${appt.appointmentId}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.showToast('Calendar event downloaded (.ics file)', 'success');
  },

  async renderPatientAppointments() {
    const user = window.clinovaAuth.getCurrentUser();
    if (!user || user.role !== 'PATIENT') {
      return this.renderUnauthorized('Patient Access Restricted');
    }

    const container = document.getElementById('main-content');
    
    // Skeleton loader
    container.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div class="skeleton h-10 w-64"></div>
        <div class="skeleton h-14 w-full rounded-2xl"></div>
        <div class="space-y-4">
          <div class="skeleton h-32 w-full rounded-2xl"></div>
          <div class="skeleton h-32 w-full rounded-2xl"></div>
        </div>
      </div>
    `;

    const res = await window.clinovaAPI.getAppointments(user);
    const allAppts = res.success ? res.data : [];

    this.activeAppointmentsTab = this.activeAppointmentsTab || 'upcoming';

    // Counts for tabs
    const upcomingCount = allAppts.filter(a => a.status === 'CONFIRMED' || a.status === 'WAITING' || a.status === 'PENDING').length;
    const completedCount = allAppts.filter(a => a.status === 'COMPLETED').length;
    const cancelledCount = allAppts.filter(a => a.status === 'CANCELLED').length;

    // Get doctor list for doctor filter dropdown
    const docsRes = await window.clinovaAPI.getDoctors();
    const doctors = docsRes.success ? docsRes.data : [];

    container.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 py-8">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 class="text-3xl font-extrabold mb-1">My Appointments</h1>
            <p class="text-xs text-slate-400">View scheduled visits, reschedule appointments, cancel bookings, and inspect medical records.</p>
          </div>
          <a href="#patient-book" class="btn btn-primary"><i data-lucide="plus" class="w-4 h-4"></i> Book New Visit</a>
        </div>

        <!-- TABS (Upcoming, Completed, Cancelled, All) -->
        <div class="flex items-center gap-2 border-b border-slate-800 mb-6 font-semibold text-xs overflow-x-auto pb-1">
          <button onclick="ClinovaApp.switchAppointmentTab('upcoming')" class="appt-tab-btn py-3 px-5 border-b-2 font-bold transition flex items-center gap-2 ${this.activeAppointmentsTab === 'upcoming' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'}">
            <i data-lucide="calendar" class="w-4 h-4"></i> Upcoming
            <span class="px-2 py-0.5 rounded-full ${this.activeAppointmentsTab === 'upcoming' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'} text-[10px]">${upcomingCount}</span>
          </button>
          <button onclick="ClinovaApp.switchAppointmentTab('completed')" class="appt-tab-btn py-3 px-5 border-b-2 font-bold transition flex items-center gap-2 ${this.activeAppointmentsTab === 'completed' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'}">
            <i data-lucide="check-circle-2" class="w-4 h-4"></i> Completed
            <span class="px-2 py-0.5 rounded-full ${this.activeAppointmentsTab === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'} text-[10px]">${completedCount}</span>
          </button>
          <button onclick="ClinovaApp.switchAppointmentTab('cancelled')" class="appt-tab-btn py-3 px-5 border-b-2 font-bold transition flex items-center gap-2 ${this.activeAppointmentsTab === 'cancelled' ? 'border-red-400 text-red-400' : 'border-transparent text-slate-400 hover:text-slate-200'}">
            <i data-lucide="x-circle" class="w-4 h-4"></i> Cancelled
            <span class="px-2 py-0.5 rounded-full ${this.activeAppointmentsTab === 'cancelled' ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-400'} text-[10px]">${cancelledCount}</span>
          </button>
          <button onclick="ClinovaApp.switchAppointmentTab('all')" class="appt-tab-btn py-3 px-5 border-b-2 font-bold transition flex items-center gap-2 ${this.activeAppointmentsTab === 'all' ? 'border-purple-400 text-purple-400' : 'border-transparent text-slate-400 hover:text-slate-200'}">
            <i data-lucide="list" class="w-4 h-4"></i> All Visits
            <span class="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">${allAppts.length}</span>
          </button>
        </div>

        <!-- SEARCH & FILTERS TOOLBAR -->
        <div class="glass-card p-4 mb-8 border border-slate-800 space-y-3">
          <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div class="md:col-span-2 relative">
              <i data-lucide="search" class="w-4 h-4 absolute left-3.5 top-3 text-slate-400"></i>
              <input type="text" id="appt-search-input" oninput="ClinovaApp.filterAppointmentsList()" placeholder="Search by doctor, ID (e.g. APT-1001), or reason..." class="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 outline-none focus:border-cyan-500">
            </div>

            <div>
              <select id="appt-doc-filter" onchange="ClinovaApp.filterAppointmentsList()" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 outline-none focus:border-cyan-500">
                <option value="ALL">All Doctors</option>
                ${doctors.map(d => `<option value="${d.doctorId}">${d.fullName}</option>`).join('')}
              </select>
            </div>

            <div>
              <select id="appt-spec-filter" onchange="ClinovaApp.filterAppointmentsList()" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 outline-none focus:border-cyan-500">
                <option value="ALL">All Specializations</option>
                <option value="General Medicine">General Medicine</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Dermatology">Dermatology</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="Neurology">Neurology</option>
              </select>
            </div>

            <div>
              <input type="date" id="appt-date-filter" onchange="ClinovaApp.filterAppointmentsList()" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 outline-none focus:border-cyan-500 font-mono" title="Filter by Date">
            </div>
          </div>
        </div>

        <!-- APPOINTMENTS LIST CONTAINER -->
        <div id="appointments-list-container">
          ${this.renderAppointmentsListHtml(allAppts, this.activeAppointmentsTab)}
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  switchAppointmentTab(tabName) {
    this.activeAppointmentsTab = tabName;
    this.filterAppointmentsList();

    // Update tab styles
    document.querySelectorAll('.appt-tab-btn').forEach(btn => {
      btn.classList.remove('border-cyan-400', 'text-cyan-400', 'border-emerald-400', 'text-emerald-400', 'border-red-400', 'text-red-400', 'border-purple-400', 'text-purple-400');
      btn.classList.add('border-transparent', 'text-slate-400');
    });

    const activeBtn = document.querySelector(`.appt-tab-btn[onclick*="${tabName}"]`);
    if (activeBtn) {
      activeBtn.classList.remove('border-transparent', 'text-slate-400');
      if (tabName === 'upcoming') activeBtn.classList.add('border-cyan-400', 'text-cyan-400');
      else if (tabName === 'completed') activeBtn.classList.add('border-emerald-400', 'text-emerald-400');
      else if (tabName === 'cancelled') activeBtn.classList.add('border-red-400', 'text-red-400');
      else activeBtn.classList.add('border-purple-400', 'text-purple-400');
    }
  },

  async filterAppointmentsList() {
    const user = window.clinovaAuth.getCurrentUser();
    const search = document.getElementById('appt-search-input')?.value || '';
    const docId = document.getElementById('appt-doc-filter')?.value || 'ALL';
    const spec = document.getElementById('appt-spec-filter')?.value || 'ALL';
    const date = document.getElementById('appt-date-filter')?.value || '';
    const tab = this.activeAppointmentsTab || 'upcoming';

    const res = await window.clinovaAPI.getAppointments(user, {
      tab,
      search,
      doctorId: docId,
      specialization: spec,
      date
    });

    const appts = res.success ? res.data : [];
    const container = document.getElementById('appointments-list-container');
    if (container) {
      container.innerHTML = this.renderAppointmentsListHtml(appts, tab);
      if (window.lucide) window.lucide.createIcons();
    }
  },

  renderAppointmentsListHtml(appts = [], tab = 'upcoming') {
    if (!appts || appts.length === 0) {
      let emptyMsg = 'You have no upcoming appointments.';
      if (tab === 'completed') emptyMsg = 'No completed appointments yet.';
      if (tab === 'cancelled') emptyMsg = 'No cancelled appointments.';

      return `
        <div class="glass-card p-12 text-center border border-slate-800 my-6">
          <i data-lucide="calendar-off" class="w-16 h-16 text-slate-500 mx-auto mb-4"></i>
          <h3 class="text-xl font-bold text-slate-200 mb-1">${emptyMsg}</h3>
          <p class="text-xs text-slate-400 mb-6">Check back later or schedule a new visit with your specialist.</p>
          <a href="#patient-book" class="btn btn-primary py-2.5 px-6">
            <i data-lucide="plus" class="w-4 h-4"></i> Book an Appointment
          </a>
        </div>
      `;
    }

    return `
      <div class="space-y-4">
        ${appts.map(a => `
          <div class="glass-card p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 border border-slate-800 hover:border-cyan-500/40 transition shadow-xl">
            <div class="space-y-2">
              <div class="flex items-center gap-3">
                <span class="badge badge-demo">${a.specialization}</span>
                <span class="text-xs font-mono text-cyan-400 font-bold">ID: ${a.appointmentId}</span>
                <span class="badge badge-${a.status.toLowerCase()}">${a.status}</span>
              </div>

              <h3 class="text-xl font-extrabold text-slate-100">${a.doctorName}</h3>
              
              <div class="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                <span><i data-lucide="calendar" class="inline w-3.5 h-3.5 text-cyan-400"></i> ${this.formatDate(a.date)}</span>
                <span><i data-lucide="clock" class="inline w-3.5 h-3.5 text-cyan-400"></i> ${a.time}</span>
                <span><i data-lucide="map-pin" class="inline w-3.5 h-3.5 text-cyan-400"></i> ${a.location}</span>
              </div>

              <p class="text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 max-w-xl">
                <span class="font-bold text-slate-300">Reason:</span> "${a.reason}"
              </p>
            </div>

            <!-- Action Buttons -->
            <div class="flex flex-wrap items-center gap-2 lg:flex-col lg:items-end lg:justify-center">
              <button onclick="ClinovaApp.openAppointmentDetailsModal('${a.appointmentId}')" class="btn btn-sm btn-secondary text-xs">
                <i data-lucide="eye" class="w-3.5 h-3.5"></i> View Details
              </button>

              ${a.status !== 'CANCELLED' && a.status !== 'COMPLETED' ? `
                <button onclick="ClinovaApp.openRescheduleModal('${a.appointmentId}')" class="btn btn-sm btn-secondary text-xs">
                  <i data-lucide="calendar-range" class="w-3.5 h-3.5"></i> Reschedule
                </button>
                <button onclick="ClinovaApp.openCancelConfirmationModal('${a.appointmentId}')" class="btn btn-sm btn-danger text-xs">
                  <i data-lucide="x-circle" class="w-3.5 h-3.5"></i> Cancel
                </button>
              ` : ''}

              ${a.status === 'COMPLETED' ? (() => {
                const rec = window.clinovaDB.findOne('medicalRecords', r => r.appointmentId === a.appointmentId || (r.patientId === a.patientId && r.doctorName === a.doctorName));
                if (rec) {
                  return `
                    <button onclick="ClinovaApp.openMedicalRecordModal('${a.appointmentId}', '${a.patientId}')" class="btn btn-sm btn-primary text-xs">
                      <i data-lucide="file-text" class="w-3.5 h-3.5"></i> View Medical Record
                    </button>
                  `;
                }
                return '';
              })() : ''}

              ${a.status === 'CANCELLED' ? `
                <button onclick="ClinovaApp.bookWithDoctor('${a.doctorId}')" class="btn btn-sm btn-primary text-xs">
                  <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i> Book Again
                </button>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  openAppointmentDetailsModal(appointmentId) {
    const appt = window.clinovaDB.findOne('appointments', a => a.appointmentId === appointmentId);
    if (!appt) return this.showToast('Appointment details not found', 'error');

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto';
    modal.innerHTML = `
      <div class="glass-card max-w-md w-full p-6 border border-cyan-500/40 shadow-2xl my-8">
        <div class="flex justify-between items-start mb-4 border-b border-slate-800 pb-3">
          <div>
            <span class="badge badge-demo mb-1">${appt.specialization}</span>
            <h3 class="text-xl font-bold text-slate-100">${appt.doctorName}</h3>
            <p class="text-xs font-mono text-cyan-400">${appt.appointmentId}</p>
          </div>
          <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-slate-100 text-lg font-bold">&times;</button>
        </div>

        <div class="space-y-3 text-xs mb-6 font-mono">
          <div class="flex justify-between"><span class="text-slate-400">Date:</span><span class="text-slate-100">${this.formatDate(appt.date)}</span></div>
          <div class="flex justify-between"><span class="text-slate-400">Time:</span><span class="text-slate-100">${appt.time}</span></div>
          <div class="flex justify-between"><span class="text-slate-400">Location:</span><span class="text-slate-300">${appt.location}</span></div>
          <div class="flex justify-between"><span class="text-slate-400">Status:</span><span class="badge badge-${appt.status.toLowerCase()}">${appt.status}</span></div>
          <div class="pt-2 border-t border-slate-800">
            <span class="text-slate-400 block mb-1 font-sans font-bold">Visit Reason & Notes:</span>
            <p class="text-slate-300 font-sans leading-relaxed bg-slate-900 p-3 rounded-xl border border-slate-800">"${appt.reason}"</p>
          </div>
        </div>

        <div class="flex gap-2">
          <button onclick="ClinovaApp.downloadCalendarEvent('${appt.appointmentId}')" class="w-1/2 btn btn-secondary py-2 text-xs">
            <i data-lucide="download" class="w-3.5 h-3.5"></i> Download .ics
          </button>
          <button onclick="this.closest('.fixed').remove()" class="w-1/2 btn btn-primary py-2 text-xs">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
  },

  openCancelConfirmationModal(appointmentId) {
    const appt = window.clinovaDB.findOne('appointments', a => a.appointmentId === appointmentId);
    if (!appt) return this.showToast('Appointment not found', 'error');

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4';
    modal.innerHTML = `
      <div class="glass-card max-w-md w-full p-6 border border-red-500/40 text-center shadow-2xl">
        <i data-lucide="alert-triangle" class="w-14 h-14 text-red-400 mx-auto mb-3"></i>
        <h3 class="text-xl font-bold text-slate-100 mb-1">Cancel this appointment?</h3>
        <p class="text-xs text-slate-400 mb-4">Are you sure you want to cancel your visit with <span class="font-bold text-slate-200">${appt.doctorName}</span> on ${this.formatDate(appt.date)} at ${appt.time}?</p>
        
        <div class="flex gap-3 pt-2">
          <button onclick="this.closest('.fixed').remove()" class="w-1/2 btn btn-secondary py-2.5 text-xs">Keep Appointment</button>
          <button onclick="ClinovaApp.confirmCancelAppointment('${appointmentId}')" class="w-1/2 btn btn-danger py-2.5 text-xs">Cancel Appointment</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
  },

  async confirmCancelAppointment(appointmentId) {
    const user = window.clinovaAuth.getCurrentUser();
    const modal = document.querySelector('.fixed.z-50');
    if (modal) modal.remove();

    const res = await window.clinovaAPI.updateAppointmentStatus(user, appointmentId, 'CANCELLED');
    if (res.success) {
      this.showToast('Appointment cancelled successfully.', 'success');
      if (user.role === 'DOCTOR' || user.role === 'ADMIN') {
        this.renderDoctorDashboard();
      } else {
        this.renderPatientAppointments();
      }
    } else {
      this.showToast(res.message, 'error');
    }
  },

  async openMedicalRecordModal(appointmentId, patientId) {
    const user = window.clinovaAuth.getCurrentUser();
    const res = await window.clinovaAPI.getMedicalRecords(user);
    const records = res.success ? res.data : [];
    const record = records.find(r => r.appointmentId === appointmentId) || records[0];

    if (!record) return this.showToast('No medical record found for this visit yet.', 'info');

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto';
    modal.innerHTML = `
      <div class="glass-card max-w-lg w-full p-6 border border-teal-500/40 shadow-2xl my-8">
        <div class="flex justify-between items-start mb-4 border-b border-slate-800 pb-3">
          <div>
            <span class="badge badge-demo mb-1">${record.recordType}</span>
            <h3 class="text-xl font-bold text-slate-100">${record.diagnosis}</h3>
            <p class="text-xs font-mono text-cyan-400">Record ID: ${record.recordId} • Date: ${this.formatDate(record.date)}</p>
          </div>
          <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-slate-100 text-lg font-bold">&times;</button>
        </div>

        <div class="space-y-3 text-xs bg-slate-900/80 p-4 rounded-xl border border-slate-800 mb-6">
          <p><span class="font-bold text-slate-400">Attending Physician:</span> <span class="text-slate-200">${record.doctorName}</span></p>
          <p><span class="font-bold text-slate-400">Visit Reason:</span> <span class="text-slate-300">"${record.visitReason}"</span></p>
          <p><span class="font-bold text-slate-400">Consultation Notes:</span> <span class="text-slate-300">${record.notes}</span></p>
          <p><span class="font-bold text-slate-400">Prescription:</span> <span class="text-teal-300 font-mono font-bold">${record.prescription}</span></p>
          <p><span class="font-bold text-slate-400">Follow-up:</span> <span class="text-slate-300">${record.followUp}</span></p>
        </div>

        <button onclick="this.closest('.fixed').remove()" class="w-full btn btn-primary py-2.5 text-xs">Close Record</button>
      </div>
    `;
    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
  },

  openRescheduleModal(appointmentId) {
    const appt = window.clinovaDB.findOne('appointments', a => a.appointmentId === appointmentId);
    if (!appt) return this.showToast('Appointment not found', 'error');

    const todayStr = new Date().toISOString().split('T')[0];

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto';
    modal.innerHTML = `
      <div class="glass-card max-w-md w-full p-6 border border-slate-800 shadow-2xl my-8">
        <div class="flex justify-between items-start mb-4 border-b border-slate-800 pb-3">
          <div>
            <h3 class="text-xl font-bold text-slate-100">Reschedule Appointment</h3>
            <p class="text-xs text-cyan-400">${appt.doctorName} (${appt.specialization})</p>
          </div>
          <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-slate-100 text-lg font-bold">&times;</button>
        </div>

        <form onsubmit="ClinovaApp.handleRescheduleSubmit(event, '${appointmentId}')" class="space-y-4 text-xs">
          <div>
            <label class="block font-bold text-slate-400 mb-1">Select New Date</label>
            <input type="date" id="resched-date" required value="${appt.date}" min="${todayStr}" onchange="ClinovaApp.loadRescheduleSlots('${appt.doctorId}')" class="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 outline-none focus:border-cyan-500 font-mono">
          </div>

          <div>
            <label class="block font-bold text-slate-400 mb-1">Select Available Time Slot</label>
            <div id="resched-slots-container" class="grid grid-cols-3 gap-2 py-1">
              <span class="col-span-full text-slate-500 text-center">Loading slots...</span>
            </div>
            <input type="hidden" id="resched-time" value="${appt.time}">
          </div>

          <div class="flex gap-3 pt-3 border-t border-slate-800">
            <button type="button" onclick="this.closest('.fixed').remove()" class="w-1/2 btn btn-secondary py-2.5">Cancel</button>
            <button type="submit" class="w-1/2 btn btn-primary py-2.5">Confirm Reschedule</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
    this.loadRescheduleSlots(appt.doctorId);
  },

  async handleRescheduleSubmit(e, appointmentId) {
    e.preventDefault();
    const user = window.clinovaAuth.getCurrentUser();
    const newDate = document.getElementById('resched-date').value;
    const newTime = document.getElementById('resched-time').value;

    if (!newTime) {
      return this.showToast('Please select a valid time slot.', 'warning');
    }

    const res = await window.clinovaAPI.rescheduleAppointment(user, appointmentId, newDate, newTime);
    if (res.success) {
      this.showToast('Appointment rescheduled successfully!', 'success');
      const modal = document.querySelector('.fixed.z-50');
      if (modal) modal.remove();
      this.renderPatientAppointments();
    } else {
      this.showToast(res.message, 'error');
    }
  },

  async loadRescheduleSlots(doctorId) {
    const dateInput = document.getElementById('resched-date');
    const slotsContainer = document.getElementById('resched-slots-container');
    const timeInput = document.getElementById('resched-time');
    if (!dateInput || !slotsContainer) return;

    const date = dateInput.value;
    if (!date) return;

    slotsContainer.innerHTML = `<span class="col-span-full text-xs text-cyan-400 text-center animate-pulse py-2">Checking slot availability...</span>`;
    
    const res = await window.clinovaAPI.getDoctorAvailableSlots(doctorId, date);
    const slotDetails = res.success ? res.data : [];

    if (slotDetails.length === 0) {
      slotsContainer.innerHTML = `<span class="col-span-full text-xs text-red-400 text-center font-semibold">No available slots on this date.</span>`;
      if (timeInput) timeInput.value = '';
      return;
    }

    let selectedTime = timeInput ? timeInput.value : '';
    let html = '';

    slotDetails.forEach(slot => {
      const isBooked = !slot.isAvailable;
      const isSelected = slot.time === selectedTime;

      html += `
        <button type="button" 
          ${isBooked ? 'disabled' : `onclick="ClinovaApp.selectRescheduleTime('${slot.time}', this)"`} 
          class="resched-slot-btn py-2 px-2 rounded-lg border text-[11px] font-mono transition ${
            isBooked 
              ? 'opacity-40 bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed line-through' 
              : isSelected 
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold' 
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-cyan-500'
          }">
          ${slot.time}
        </button>
      `;
    });

    slotsContainer.innerHTML = html;
  },

  selectRescheduleTime(time, element) {
    document.querySelectorAll('.resched-slot-btn').forEach(btn => {
      if (!btn.disabled) {
        btn.classList.remove('bg-cyan-500/20', 'border-cyan-400', 'text-cyan-300', 'font-bold');
        btn.classList.add('bg-slate-900/80', 'border-slate-800', 'text-slate-300');
      }
    });
    element.classList.remove('bg-slate-900/80', 'border-slate-800', 'text-slate-300');
    element.classList.add('bg-cyan-500/20', 'border-cyan-400', 'text-cyan-300', 'font-bold');
    const timeInput = document.getElementById('resched-time');
    if (timeInput) timeInput.value = time;
  },

  async renderPatientRecords() {
    const user = window.clinovaAuth.getCurrentUser();
    if (!user || (user.role !== 'PATIENT' && user.role !== 'ADMIN')) {
      this.showToast('403 — Access Restricted', 'error');
      return this.renderUnauthorized('Medical Records Access Restricted');
    }

    const container = document.getElementById('main-content');

    // Skeleton loading state
    container.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div class="skeleton h-10 w-64"></div>
        <div class="skeleton h-16 w-full rounded-2xl"></div>
        <div class="space-y-4">
          <div class="skeleton h-36 w-full rounded-2xl"></div>
          <div class="skeleton h-36 w-full rounded-2xl"></div>
        </div>
      </div>
    `;

    const [recordsRes, docsRes] = await Promise.all([
      window.clinovaAPI.getMedicalRecords(user),
      window.clinovaAPI.getDoctors()
    ]);

    const records = recordsRes.success ? recordsRes.data : [];
    const doctors = docsRes.success ? docsRes.data : [];

    container.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 py-8">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 class="text-3xl font-extrabold mb-1">Medical Record Timeline</h1>
            <p class="text-xs text-slate-400">Authenticated clinical history, physician notes, diagnoses, and verified prescriptions.</p>
          </div>
          <span class="badge badge-demo">DEMO / SYNTHETIC MEDICAL DATA</span>
        </div>

        <!-- SEARCH & FILTERS TOOLBAR -->
        <div class="glass-card p-4 mb-8 border border-slate-800 space-y-3">
          <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div class="md:col-span-2 relative">
              <i data-lucide="search" class="w-4 h-4 absolute left-3.5 top-3 text-slate-400"></i>
              <input type="text" id="rec-search-input" oninput="ClinovaApp.filterPatientRecordsList()" placeholder="Search by doctor, diagnosis, visit reason, or ID..." class="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 outline-none focus:border-cyan-500">
            </div>

            <div>
              <select id="rec-doc-filter" onchange="ClinovaApp.filterPatientRecordsList()" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 outline-none focus:border-cyan-500">
                <option value="ALL">All Doctors</option>
                ${doctors.map(d => `<option value="${d.doctorId}">${d.fullName}</option>`).join('')}
              </select>
            </div>

            <div>
              <select id="rec-type-filter" onchange="ClinovaApp.filterPatientRecordsList()" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 outline-none focus:border-cyan-500">
                <option value="ALL">All Record Types</option>
                <option value="Clinical Consultation">Clinical Consultation</option>
                <option value="Cardiology Consultation">Cardiology Consultation</option>
                <option value="Dermatology Assessment">Dermatology Assessment</option>
                <option value="Specialist Visit">Specialist Visit</option>
                <option value="Follow-up">Follow-up</option>
              </select>
            </div>

            <div>
              <input type="date" id="rec-date-filter" onchange="ClinovaApp.filterPatientRecordsList()" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 outline-none focus:border-cyan-500 font-mono" title="Filter by Date">
            </div>
          </div>
        </div>

        <!-- TIMELINE CONTAINER -->
        <div id="patient-records-timeline-container">
          ${this.renderPatientRecordsTimelineHtml(records)}
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  async filterPatientRecordsList() {
    const user = window.clinovaAuth.getCurrentUser();
    const search = document.getElementById('rec-search-input')?.value || '';
    const docId = document.getElementById('rec-doc-filter')?.value || 'ALL';
    const type = document.getElementById('rec-type-filter')?.value || 'ALL';
    const date = document.getElementById('rec-date-filter')?.value || '';

    const res = await window.clinovaAPI.getMedicalRecords(user, {
      search,
      doctorId: docId,
      recordType: type,
      date
    });

    const records = res.success ? res.data : [];
    const container = document.getElementById('patient-records-timeline-container');
    if (container) {
      container.innerHTML = this.renderPatientRecordsTimelineHtml(records);
      if (window.lucide) window.lucide.createIcons();
    }
  },

  renderPatientRecordsTimelineHtml(records = []) {
    if (!records || records.length === 0) {
      return `
        <div class="glass-card p-12 text-center border border-slate-800 my-6 space-y-3">
          <i data-lucide="file-x-2" class="w-16 h-16 text-slate-500 mx-auto mb-2"></i>
          <h3 class="text-xl font-bold text-slate-200">Your medical record timeline is empty.</h3>
          <p class="text-xs text-slate-400 max-w-md mx-auto">Medical records will appear here after completed consultations.</p>
        </div>
      `;
    }

    return `
      <div class="space-y-6">
        ${records.map(r => `
          <div class="glass-card p-6 border-l-4 border-l-teal-400 hover:border-l-cyan-400 transition shadow-xl space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="badge badge-demo">${r.recordType || 'Clinical Consultation'}</span>
                  <span class="text-xs text-slate-400 font-mono">${r.recordId}</span>
                  <span class="text-xs text-cyan-400 font-mono">• ${this.formatDate(r.date)}</span>
                </div>
                <h3 class="text-xl font-extrabold text-slate-100">${r.diagnosis}</h3>
                <p class="text-xs text-cyan-300 font-semibold">Attending Physician: ${r.doctorName}</p>
              </div>

              <button onclick="ClinovaApp.openRecordDetailsModal('${r.recordId}')" class="btn btn-sm btn-secondary text-xs self-start sm:self-center">
                <i data-lucide="file-text" class="w-3.5 h-3.5"></i> View Details
              </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <div>
                <p class="text-slate-400 font-bold mb-1">Visit Reason:</p>
                <p class="text-slate-200">"${r.visitReason}"</p>
              </div>
              <div>
                <p class="text-slate-400 font-bold mb-1">Prescription:</p>
                <p class="text-teal-300 font-mono font-semibold">${r.prescription}</p>
              </div>
              <div class="md:col-span-2">
                <p class="text-slate-400 font-bold mb-1">Consultation Notes:</p>
                <p class="text-slate-300 leading-relaxed">${r.notes}</p>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  async openRecordDetailsModal(recordId) {
    const user = window.clinovaAuth.getCurrentUser();
    const res = await window.clinovaAPI.getMedicalRecordById(user, recordId);
    
    if (!res.success) {
      return this.showToast('403 — Access Restricted', 'error');
    }

    const r = res.data;

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto';
    modal.innerHTML = `
      <div class="glass-card max-w-lg w-full p-6 border border-teal-500/50 shadow-2xl my-8">
        <div class="flex justify-between items-start mb-4 border-b border-slate-800 pb-3">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="badge badge-demo">${r.recordType || 'Clinical Consultation'}</span>
              <span class="text-xs font-mono text-cyan-400">ID: ${r.recordId}</span>
            </div>
            <h3 class="text-xl font-bold text-slate-100">${r.diagnosis}</h3>
            <p class="text-xs text-slate-400 font-mono">Issued on ${this.formatDate(r.date)}</p>
          </div>
          <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-slate-100 text-lg font-bold">&times;</button>
        </div>

        <div class="space-y-4 text-xs">
          <!-- DEMO DATA BADGE -->
          <div class="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-center font-bold font-mono text-[11px]">
            DEMO / SYNTHETIC MEDICAL DATA
          </div>

          <!-- VISIT DETAILS -->
          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <h4 class="font-bold text-cyan-400 uppercase tracking-wider text-[10px]">Visit Information</h4>
            <div class="flex justify-between"><span class="text-slate-400">Date:</span><span class="text-slate-100 font-mono">${this.formatDate(r.date)}</span></div>
            <div class="flex justify-between"><span class="text-slate-400">Doctor:</span><span class="text-slate-100 font-bold">${r.doctorName}</span></div>
            <div class="flex justify-between"><span class="text-slate-400">Reason:</span><span class="text-slate-200">"${r.visitReason}"</span></div>
            ${r.appointmentId ? `<div class="flex justify-between"><span class="text-slate-400">Appointment ID:</span><span class="text-cyan-400 font-mono">${r.appointmentId}</span></div>` : ''}
          </div>

          <!-- CLINICAL SUMMARY -->
          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <h4 class="font-bold text-cyan-400 uppercase tracking-wider text-[10px]">Clinical Summary</h4>
            <div>
              <span class="text-slate-400 block mb-0.5">Diagnosis:</span>
              <span class="text-slate-100 font-bold leading-relaxed">${r.diagnosis}</span>
            </div>
            <div class="pt-2 border-t border-slate-800/80">
              <span class="text-slate-400 block mb-0.5">Physician Notes:</span>
              <p class="text-slate-300 leading-relaxed font-sans">${r.notes}</p>
            </div>
          </div>

          <!-- PRESCRIPTION & FOLLOW-UP -->
          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <h4 class="font-bold text-teal-400 uppercase tracking-wider text-[10px]">Prescription & Follow-up</h4>
            <div>
              <span class="text-slate-400 block mb-0.5">Medication & Instructions:</span>
              <span class="text-teal-300 font-mono font-bold leading-relaxed">${r.prescription}</span>
            </div>
            <div class="pt-2 border-t border-slate-800/80 flex justify-between">
              <span class="text-slate-400">Follow-up Schedule:</span>
              <span class="text-slate-200 font-semibold">${r.followUp}</span>
            </div>
          </div>
        </div>

        <div class="pt-4 mt-2">
          <button onclick="this.closest('.fixed').remove()" class="w-full btn btn-primary py-2.5 text-xs">Close Details</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
  },

  async renderPatientProfile() {
    const user = window.clinovaAuth.getCurrentUser();
    if (!user || (user.role !== 'PATIENT' && user.role !== 'ADMIN')) {
      this.showToast('403 — Access Restricted', 'error');
      return this.renderUnauthorized('Patient Profile Access Restricted');
    }

    const container = document.getElementById('main-content');

    // Skeleton loader
    container.innerHTML = `
      <div class="max-w-4xl mx-auto py-8 px-4 space-y-6">
        <div class="skeleton h-10 w-64"></div>
        <div class="skeleton h-64 w-full rounded-2xl"></div>
      </div>
    `;

    const res = await window.clinovaAPI.getPatientProfile(user);
    const p = res.success ? res.data : {};

    container.innerHTML = `
      <div class="max-w-4xl mx-auto py-8 px-4 space-y-6">
        <div class="glass-card p-8 border border-slate-800 space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <span class="badge badge-demo mb-1">DEMO / SYNTHETIC MEDICAL DATA</span>
              <h1 class="text-3xl font-extrabold text-slate-100">${p.fullName}</h1>
              <p class="text-xs text-slate-400 font-mono">Patient ID: <span class="text-cyan-400 font-bold">${p.patientId}</span> • Registered Account</p>
            </div>
            <button onclick="ClinovaApp.openProfileEditModal()" class="btn btn-primary self-start sm:self-auto">
              <i data-lucide="edit" class="w-4 h-4"></i> Edit Profile
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- PERSONAL INFORMATION -->
            <div class="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div class="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <h4 class="font-bold text-sm text-cyan-400 flex items-center gap-2">
                  <i data-lucide="user" class="w-4 h-4"></i> Personal Information
                </h4>
              </div>
              <div class="space-y-2 text-xs">
                <p class="flex justify-between"><span class="text-slate-400">Full Name:</span><span class="font-bold text-slate-100">${p.fullName}</span></p>
                <p class="flex justify-between"><span class="text-slate-400">Email:</span><span class="text-slate-300 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800" title="Email is read-only">${p.email} (Read-only)</span></p>
                <p class="flex justify-between"><span class="text-slate-400">Phone:</span><span class="text-slate-200 font-mono">${p.phone}</span></p>
                <p class="flex justify-between"><span class="text-slate-400">Date of Birth:</span><span class="text-slate-200 font-mono">${p.dateOfBirth} (${p.age} yrs)</span></p>
                <p class="flex justify-between"><span class="text-slate-400">Gender:</span><span class="text-slate-200">${p.gender}</span></p>
                <p class="pt-2 border-t border-slate-800"><span class="text-slate-400 block mb-1">Address:</span><span class="text-slate-200 leading-relaxed">${p.address}</span></p>
              </div>
            </div>

            <!-- EMERGENCY CONTACT -->
            <div class="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div class="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <h4 class="font-bold text-sm text-amber-400 flex items-center gap-2">
                  <i data-lucide="phone-call" class="w-4 h-4"></i> Emergency Contact
                </h4>
              </div>
              <div class="space-y-2 text-xs">
                <p class="flex justify-between"><span class="text-slate-400">Contact Name:</span><span class="font-bold text-slate-100">${p.emergencyContactName}</span></p>
                <p class="flex justify-between"><span class="text-slate-400">Relationship:</span><span class="text-slate-200">${p.emergencyContactRelationship}</span></p>
                <p class="flex justify-between"><span class="text-slate-400">Phone:</span><span class="text-amber-300 font-mono font-bold">${p.emergencyContactPhone}</span></p>
              </div>
            </div>

            <!-- MEDICAL OVERVIEW -->
            <div class="md:col-span-2 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div class="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <h4 class="font-bold text-sm text-teal-400 flex items-center gap-2">
                  <i data-lucide="activity" class="w-4 h-4"></i> Medical Overview
                </h4>
                <span class="badge badge-demo">DEMO MEDICAL DATA</span>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                <div class="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span class="text-slate-400 block text-[10px] uppercase font-mono">Blood Group</span>
                  <span class="text-cyan-400 font-bold text-lg">${p.bloodGroup}</span>
                </div>
                <div class="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span class="text-slate-400 block text-[10px] uppercase font-mono">Known Allergies</span>
                  <span class="text-slate-200 font-semibold">${Array.isArray(p.allergies) ? p.allergies.join(', ') : p.allergies}</span>
                </div>
                <div class="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span class="text-slate-400 block text-[10px] uppercase font-mono">Existing Conditions</span>
                  <span class="text-slate-200 font-semibold">${Array.isArray(p.existingConditions) ? p.existingConditions.join(', ') : p.existingConditions}</span>
                </div>
                <div class="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span class="text-slate-400 block text-[10px] uppercase font-mono">Current Medications</span>
                  <span class="text-teal-300 font-semibold font-mono">${Array.isArray(p.currentMedications) ? p.currentMedications.join(', ') : p.currentMedications}</span>
                </div>
              </div>
            </div>

            <!-- ACCOUNT SECURITY & SESSION INFO -->
            <div class="md:col-span-2 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div class="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <h4 class="font-bold text-sm text-purple-400 flex items-center gap-2">
                  <i data-lucide="shield-check" class="w-4 h-4"></i> Account Security & Session Information
                </h4>
                <span class="badge badge-confirmed">Active Session</span>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <p><span class="text-slate-400">Authenticated Role:</span> <span class="text-cyan-400 font-bold">${user.role}</span></p>
                  <p><span class="text-slate-400">Session Email:</span> <span class="text-slate-200">${user.email}</span></p>
                  <p><span class="text-slate-400">Patient ID:</span> <span class="text-slate-200">${user.patientId}</span></p>
                </div>
                <div class="flex flex-col justify-center gap-2">
                  <button onclick="ClinovaApp.openChangePasswordModal()" class="btn btn-secondary py-2.5 text-xs">
                    <i data-lucide="key" class="w-4 h-4"></i> Change Password
                  </button>
                  <button onclick="ClinovaApp.handlePatientLogout()" class="btn btn-danger py-2.5 text-xs">
                    <i data-lucide="log-out" class="w-4 h-4"></i> Sign Out / Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  async openProfileEditModal() {
    const user = window.clinovaAuth.getCurrentUser();
    const res = await window.clinovaAPI.getPatientProfile(user);
    if (!res.success) return this.showToast(res.message, 'error');

    const p = res.data;

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto';
    modal.innerHTML = `
      <div class="glass-card max-w-lg w-full p-6 border border-cyan-500/40 shadow-2xl my-8">
        <div class="flex justify-between items-start mb-4 border-b border-slate-800 pb-3">
          <div>
            <h3 class="text-xl font-bold text-slate-100">Edit Patient Profile</h3>
            <p class="text-xs text-slate-400">Update personal details, address & emergency contacts</p>
          </div>
          <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-slate-100 text-lg font-bold">&times;</button>
        </div>

        <form onsubmit="ClinovaApp.handleProfileUpdateSubmit(event)" class="space-y-4 text-xs">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-400 mb-1">Full Name</label>
              <input type="text" id="edit-fullname" required value="${p.fullName}" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 outline-none focus:border-cyan-500">
            </div>
            <div>
              <label class="block font-bold text-slate-400 mb-1">Email (Read-only)</label>
              <input type="email" disabled value="${p.email}" class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-500 cursor-not-allowed">
            </div>
            <div>
              <label class="block font-bold text-slate-400 mb-1">Phone Number</label>
              <input type="text" id="edit-phone" required value="${p.phone}" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 outline-none focus:border-cyan-500 font-mono">
            </div>
            <div>
              <label class="block font-bold text-slate-400 mb-1">Date of Birth</label>
              <input type="date" id="edit-dob" required value="${p.dateOfBirth}" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 outline-none focus:border-cyan-500 font-mono">
            </div>
            <div>
              <label class="block font-bold text-slate-400 mb-1">Gender</label>
              <select id="edit-gender" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 outline-none focus:border-cyan-500">
                <option value="Male" ${p.gender === 'Male' ? 'selected' : ''}>Male</option>
                <option value="Female" ${p.gender === 'Female' ? 'selected' : ''}>Female</option>
                <option value="Other" ${p.gender === 'Other' ? 'selected' : ''}>Other</option>
              </select>
            </div>
            <div>
              <label class="block font-bold text-slate-400 mb-1">Blood Group</label>
              <select id="edit-bloodgroup" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 outline-none focus:border-cyan-500 font-mono">
                ${['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => `<option value="${bg}" ${p.bloodGroup === bg ? 'selected' : ''}>${bg}</option>`).join('')}
              </select>
            </div>
            <div class="md:col-span-2">
              <label class="block font-bold text-slate-400 mb-1">Address</label>
              <input type="text" id="edit-address" required value="${p.address}" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 outline-none focus:border-cyan-500">
            </div>
          </div>

          <div class="pt-3 border-t border-slate-800 space-y-3">
            <h4 class="font-bold text-amber-400">Emergency Contact Information</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label class="block font-bold text-slate-400 mb-1">Contact Name</label>
                <input type="text" id="edit-emg-name" required value="${p.emergencyContactName}" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 outline-none focus:border-cyan-500">
              </div>
              <div>
                <label class="block font-bold text-slate-400 mb-1">Relationship</label>
                <input type="text" id="edit-emg-rel" required value="${p.emergencyContactRelationship}" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 outline-none focus:border-cyan-500">
              </div>
              <div>
                <label class="block font-bold text-slate-400 mb-1">Phone</label>
                <input type="text" id="edit-emg-phone" required value="${p.emergencyContactPhone}" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 outline-none focus:border-cyan-500 font-mono">
              </div>
            </div>
          </div>

          <div class="flex gap-3 pt-4 border-t border-slate-800">
            <button type="button" onclick="this.closest('.fixed').remove()" class="w-1/2 btn btn-secondary py-2.5">Cancel</button>
            <button type="submit" class="w-1/2 btn btn-primary py-2.5">Save Changes</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
  },

  async handleProfileUpdateSubmit(e) {
    e.preventDefault();
    const user = window.clinovaAuth.getCurrentUser();

    const profileData = {
      fullName: document.getElementById('edit-fullname').value,
      phone: document.getElementById('edit-phone').value,
      dateOfBirth: document.getElementById('edit-dob').value,
      gender: document.getElementById('edit-gender').value,
      bloodGroup: document.getElementById('edit-bloodgroup').value,
      address: document.getElementById('edit-address').value,
      emergencyContactName: document.getElementById('edit-emg-name').value,
      emergencyContactRelationship: document.getElementById('edit-emg-rel').value,
      emergencyContactPhone: document.getElementById('edit-emg-phone').value
    };

    const res = await window.clinovaAPI.updatePatientProfile(user, profileData);
    if (res.success) {
      this.showToast('Profile updated successfully.', 'success');
      user.fullName = profileData.fullName;
      window.clinovaAuth.setSession(user);

      const modal = document.querySelector('.fixed.z-50');
      if (modal) modal.remove();
      this.renderPatientProfile();
    } else {
      this.showToast(res.message, 'error');
    }
  },

  openChangePasswordModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4';
    modal.innerHTML = `
      <div class="glass-card max-w-md w-full p-6 border border-purple-500/40 shadow-2xl">
        <div class="flex justify-between items-start mb-4 border-b border-slate-800 pb-3">
          <div>
            <h3 class="text-xl font-bold text-slate-100">Change Password</h3>
            <p class="text-xs text-slate-400">Update your account authentication password</p>
          </div>
          <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-slate-100 text-lg font-bold">&times;</button>
        </div>

        <form onsubmit="ClinovaApp.handlePasswordChangeSubmit(event)" class="space-y-4 text-xs">
          <div>
            <label class="block font-bold text-slate-400 mb-1">Current Password</label>
            <input type="password" id="pwd-current" required class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 outline-none focus:border-purple-500">
          </div>

          <div>
            <label class="block font-bold text-slate-400 mb-1">New Password (Min 6 chars)</label>
            <input type="password" id="pwd-new" required minlength="6" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 outline-none focus:border-purple-500">
          </div>

          <div>
            <label class="block font-bold text-slate-400 mb-1">Confirm New Password</label>
            <input type="password" id="pwd-confirm" required minlength="6" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 outline-none focus:border-purple-500">
          </div>

          <div class="flex gap-3 pt-3 border-t border-slate-800">
            <button type="button" onclick="this.closest('.fixed').remove()" class="w-1/2 btn btn-secondary py-2.5">Cancel</button>
            <button type="submit" class="w-1/2 btn btn-primary py-2.5">Update Password</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
  },

  async handlePasswordChangeSubmit(e) {
    e.preventDefault();
    const user = window.clinovaAuth.getCurrentUser();
    const currentPassword = document.getElementById('pwd-current').value;
    const newPassword = document.getElementById('pwd-new').value;
    const confirmPassword = document.getElementById('pwd-confirm').value;

    const res = await window.clinovaAPI.changePassword(user, { currentPassword, newPassword, confirmPassword });
    if (res.success) {
      this.showToast('Password updated successfully.', 'success');
      const modal = document.querySelector('.fixed.z-50');
      if (modal) modal.remove();
    } else {
      this.showToast(res.message, 'error');
    }
  },

  handlePatientLogout() {
    window.clinovaAuth.clearSession();
    this.showToast('Signed out of CLINOVA session', 'info');
    this.navigate('landing');
  },

  // --- DOCTOR WORKSPACE ---

  async renderDoctorDashboard() {
    const user = window.clinovaAuth.getCurrentUser();
    if (!user || (user.role !== 'DOCTOR' && user.role !== 'ADMIN')) {
      this.showToast('403 — Doctor Workspace Restricted', 'error');
      return this.renderUnauthorized('Doctor Workspace Restricted');
    }

    const container = document.getElementById('main-content');
    
    // Skeleton loader
    container.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div class="skeleton h-10 w-64"></div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="skeleton h-24 w-full rounded-2xl"></div>
          <div class="skeleton h-24 w-full rounded-2xl"></div>
          <div class="skeleton h-24 w-full rounded-2xl"></div>
          <div class="skeleton h-24 w-full rounded-2xl"></div>
        </div>
        <div class="skeleton h-80 w-full rounded-2xl"></div>
      </div>
    `;

    const [statsRes, apptsRes, docRes] = await Promise.all([
      window.clinovaAPI.getDoctorDashboardStats(user),
      window.clinovaAPI.getAppointments(user),
      window.clinovaAPI.getDoctorProfile(user)
    ]);

    const stats = statsRes.success ? statsRes.data : { todayAppointments: 0, pendingCount: 0, completedCount: 0, totalPatientsCount: 0 };
    const allAppts = apptsRes.success ? apptsRes.data : [];
    const doctor = docRes.success ? docRes.data : {};

    this.activeDoctorQueueTab = this.activeDoctorQueueTab || 'all';

    container.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 py-8">
        <!-- HEADER & STATUS BAR -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="badge badge-demo">${doctor.specialization || 'Specialist'}</span>
              <span class="text-xs font-mono text-cyan-400">Doctor ID: ${user.doctorId}</span>
            </div>
            <h1 class="text-3xl font-extrabold text-slate-100">Welcome, ${user.fullName}</h1>
            <p class="text-xs text-slate-400">Clinical Queue Timeline, Consultation Workspace & Schedule Control</p>
          </div>
          
          <div class="flex items-center gap-3">
            <div class="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full ${doctor.availability === 'Unavailable' ? 'bg-red-400' : doctor.availability === 'Busy' ? 'bg-amber-400' : 'bg-emerald-400'}"></span>
              <span class="text-slate-300 font-semibold">${doctor.availabilityStatus || doctor.availability || 'Available Today'}</span>
            </div>
            <button onclick="ClinovaApp.openDoctorScheduleModal()" class="btn btn-primary text-xs py-2.5">
              <i data-lucide="clock" class="w-4 h-4"></i> Schedule & Slots
            </button>
          </div>
        </div>

        <!-- DASHBOARD STATISTICS CARDS -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div class="glass-card p-5 border border-slate-800">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Scheduled Visits</span>
              <i data-lucide="calendar" class="w-4 h-4 text-cyan-400"></i>
            </div>
            <h3 class="text-3xl font-extrabold text-slate-100">${stats.todayAppointments}</h3>
            <p class="text-[10px] text-slate-500 mt-1">Assigned consultations</p>
          </div>

          <div class="glass-card p-5 border border-slate-800">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Queue</span>
              <i data-lucide="clock" class="w-4 h-4 text-amber-400"></i>
            </div>
            <h3 class="text-3xl font-extrabold text-amber-400">${stats.pendingCount}</h3>
            <p class="text-[10px] text-slate-500 mt-1">Awaiting consultation</p>
          </div>

          <div class="glass-card p-5 border border-slate-800">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed Visits</span>
              <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-400"></i>
            </div>
            <h3 class="text-3xl font-extrabold text-emerald-400">${stats.completedCount}</h3>
            <p class="text-[10px] text-slate-500 mt-1">Records & prescriptions issued</p>
          </div>

          <div class="glass-card p-5 border border-slate-800">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned Patients</span>
              <i data-lucide="users" class="w-4 h-4 text-purple-400"></i>
            </div>
            <h3 class="text-3xl font-extrabold text-purple-400">${stats.totalPatientsCount}</h3>
            <p class="text-[10px] text-slate-500 mt-1">Unique clinical records</p>
          </div>
        </div>

        <!-- QUEUE TIMELINE & SEARCH TOOLBAR -->
        <div class="glass-card p-6 border border-slate-800 space-y-4">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 class="text-xl font-bold text-slate-100">Patient Queue & Consultation Timeline</h3>
              <p class="text-xs text-slate-400">Select a patient to launch consultation workspace or review authorized history</p>
            </div>

            <div class="flex flex-col md:flex-row gap-3 w-full md:w-auto">
              <div class="relative w-full md:w-56">
                <i data-lucide="search" class="w-4 h-4 absolute left-3.5 top-3 text-slate-400"></i>
                <input type="text" id="doc-queue-search" oninput="ClinovaApp.filterDoctorQueueList()" placeholder="Search patient, ID..." class="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 outline-none focus:border-cyan-500">
              </div>
              <select id="doc-queue-status" onchange="ClinovaApp.filterDoctorQueueList()" class="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 outline-none focus:border-cyan-500">
                <option value="ALL">All Status</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="WAITING">Waiting</option>
                <option value="PENDING">Pending</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <select id="doc-queue-type" onchange="ClinovaApp.filterDoctorQueueList()" class="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 outline-none focus:border-cyan-500">
                <option value="ALL">All Types</option>
                <option value="General consultation">General</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Routine checkup">Routine</option>
                <option value="Other">Other</option>
              </select>
              <input type="date" id="doc-queue-date" onchange="ClinovaApp.filterDoctorQueueList()" class="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 outline-none focus:border-cyan-500 font-mono" title="Filter by Date">
            </div>
          </div>

          <!-- TABS -->
          <div class="flex items-center gap-2 font-semibold text-xs border-b border-slate-800 pb-2">
            <button onclick="ClinovaApp.switchDoctorQueueTab('all')" class="doc-queue-tab px-4 py-2 rounded-xl transition ${this.activeDoctorQueueTab === 'all' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'}">All Queue (${allAppts.length})</button>
            <button onclick="ClinovaApp.switchDoctorQueueTab('pending')" class="doc-queue-tab px-4 py-2 rounded-xl transition ${this.activeDoctorQueueTab === 'pending' ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'}">Pending (${stats.pendingCount})</button>
            <button onclick="ClinovaApp.switchDoctorQueueTab('completed')" class="doc-queue-tab px-4 py-2 rounded-xl transition ${this.activeDoctorQueueTab === 'completed' ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40' : 'text-slate-400 hover:text-slate-200'}">Completed (${stats.completedCount})</button>
          </div>

          <!-- QUEUE CONTAINER -->
          <div id="doctor-queue-container">
            ${this.renderDoctorQueueListHtml(allAppts, this.activeDoctorQueueTab)}
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  switchDoctorQueueTab(tabName) {
    this.activeDoctorQueueTab = tabName;
    this.filterDoctorQueueList();
  },

  async filterDoctorQueueList() {
    const user = window.clinovaAuth.getCurrentUser();
    const search = document.getElementById('doc-queue-search')?.value || '';
    const statusFilter = document.getElementById('doc-queue-status')?.value || 'ALL';
    const typeFilter = document.getElementById('doc-queue-type')?.value || 'ALL';
    const dateFilter = document.getElementById('doc-queue-date')?.value || '';
    const tab = this.activeDoctorQueueTab || 'all';

    const res = await window.clinovaAPI.getAppointments(user, { search, status: statusFilter, type: typeFilter, date: dateFilter });
    let appts = res.success ? res.data : [];

    if (tab === 'pending') {
      appts = appts.filter(a => a.status === 'CONFIRMED' || a.status === 'WAITING' || a.status === 'PENDING');
    } else if (tab === 'completed') {
      appts = appts.filter(a => a.status === 'COMPLETED');
    }

    const container = document.getElementById('doctor-queue-container');
    if (container) {
      container.innerHTML = this.renderDoctorQueueListHtml(appts, tab);
      if (window.lucide) window.lucide.createIcons();
    }
  },

  renderDoctorQueueListHtml(appts = [], tab = 'all') {
    if (!appts || appts.length === 0) {
      return `
        <div class="p-8 text-center border border-slate-800 rounded-2xl bg-slate-900/40 space-y-2">
          <i data-lucide="inbox" class="w-12 h-12 text-slate-500 mx-auto mb-2"></i>
          <h4 class="text-base font-bold text-slate-200">No appointments in this queue.</h4>
          <p class="text-xs text-slate-400">Scheduled visits will appear here as patients book consultations.</p>
        </div>
      `;
    }

    return `
      <div class="space-y-3">
        ${appts.map(a => `
          <div class="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div class="space-y-1">
              <div class="flex items-center gap-3">
                <span class="font-mono text-xs text-cyan-400 font-bold"><i data-lucide="clock" class="inline w-3.5 h-3.5"></i> ${a.time}</span>
                <span class="text-xs font-mono text-slate-400">${a.appointmentId}</span>
                <span class="badge badge-${a.status.toLowerCase()}">${a.status}</span>
              </div>
              <h4 class="text-lg font-extrabold text-slate-100">${a.patientName} <span class="text-xs font-normal text-slate-400">(${a.patientId})</span></h4>
              <p class="text-xs text-slate-300 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                <span class="font-bold text-slate-400">Visit Reason:</span> "${a.reason}"
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-2 lg:flex-col lg:items-end lg:justify-center">
              <button onclick="ClinovaApp.openAppointmentDetailsModal('${a.appointmentId}')" class="btn btn-sm btn-secondary text-xs">
                <i data-lucide="eye" class="w-3.5 h-3.5"></i> View Details
              </button>

              ${a.status !== 'COMPLETED' && a.status !== 'CANCELLED' ? `
                <button onclick="ClinovaApp.openDoctorConsultationModal('${a.appointmentId}', '${a.patientId}')" class="btn btn-sm btn-primary text-xs">
                  <i data-lucide="stethoscope" class="w-3.5 h-3.5"></i> Start Consultation
                </button>
                <button onclick="ClinovaApp.openCancelConfirmationModal('${a.appointmentId}')" class="btn btn-sm btn-danger text-xs">
                  <i data-lucide="x-circle" class="w-3.5 h-3.5"></i> Cancel
                </button>
              ` : ''}

              <button onclick="ClinovaApp.openAuthorizedPatientHistoryModal('${a.patientId}')" class="btn btn-sm btn-secondary text-xs">
                <i data-lucide="folder-user" class="w-3.5 h-3.5"></i> Patient History
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  async openAuthorizedPatientHistoryModal(patientId) {
    const user = window.clinovaAuth.getCurrentUser();
    // Show loading overlay
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md';
    loadingOverlay.innerHTML = `<div class="loader animate-spin rounded-full border-4 border-t-4 border-cyan-500 w-12 h-12"></div>`;
    document.body.appendChild(loadingOverlay);
    const res = await window.clinovaAPI.getAuthorizedPatientData(user, null, patientId);

    if (!res.success) {
      // Remove loading overlay
      loadingOverlay.remove();
      return this.showToast(res.message, 'error');
    }
    // Remove loading overlay after successful fetch
    loadingOverlay.remove();

    const { patient, previousVisits } = res.data;

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto';
    modal.innerHTML = `
      <div class="glass-card max-w-2xl w-full p-6 border border-cyan-500/50 shadow-2xl my-8 space-y-4">
        <div class="flex justify-between items-start border-b border-slate-800 pb-3">
          <div>
            <span class="badge badge-demo mb-1">Authorized Patient Record</span>
            <h3 class="text-2xl font-bold text-slate-100">${patient.fullName}</h3>
            <p class="text-xs font-mono text-cyan-400">Patient ID: ${patient.patientId} • DOB: ${patient.dateOfBirth} (${patient.age} yrs)</p>
          </div>
          <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-slate-100 text-lg font-bold">&times;</button>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div class="p-3 rounded-xl bg-slate-900 border border-slate-800"><span class="text-slate-400 block text-[10px]">Blood Group</span><span class="text-cyan-400 font-bold text-sm">${patient.bloodGroup}</span></div>
          <div class="p-3 rounded-xl bg-slate-900 border border-slate-800"><span class="text-slate-400 block text-[10px]">Gender</span><span class="text-slate-200 font-semibold text-sm">${patient.gender}</span></div>
          <div class="p-3 rounded-xl bg-slate-900 border border-slate-800"><span class="text-slate-400 block text-[10px]">Phone</span><span class="text-slate-200 font-mono text-xs">${patient.phone}</span></div>
          <div class="p-3 rounded-xl bg-slate-900 border border-slate-800"><span class="text-slate-400 block text-[10px]">Emergency Phone</span><span class="text-amber-300 font-mono text-xs">${patient.emergencyContactPhone}</span></div>
        </div>

        <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
          <p><span class="font-bold text-slate-400">Known Allergies:</span> <span class="text-slate-200">${Array.isArray(patient.allergies) ? patient.allergies.join(', ') : patient.allergies}</span></p>
          <p><span class="font-bold text-slate-400">Existing Conditions:</span> <span class="text-slate-200">${Array.isArray(patient.existingConditions) ? patient.existingConditions.join(', ') : patient.existingConditions}</span></p>
          <p><span class="font-bold text-slate-400">Current Medications:</span> <span class="text-teal-300 font-mono">${Array.isArray(patient.currentMedications) ? patient.currentMedications.join(', ') : patient.currentMedications}</span></p>
        </div>

        <div>
          <h4 class="font-bold text-sm text-cyan-400 mb-2">Previous Consultation History (${previousVisits.length})</h4>
          <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
            ${previousVisits.length === 0 ? `<p class="text-xs text-slate-500 py-2">No prior consultations recorded.</p>` : previousVisits.map(v => `
              <div class="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1">
                <div class="flex justify-between font-mono text-[11px]"><span class="text-cyan-400 font-bold">${v.diagnosis}</span><span class="text-slate-400">${v.date}</span></div>
                <p class="text-slate-300">Notes: ${v.notes}</p>
                <p class="text-teal-300 font-mono">Rx: ${v.prescription}</p>
              </div>
            `).join('')}
          </div>
        </div>

        <button onclick="this.closest('.fixed').remove()" class="w-full btn btn-primary py-2.5 text-xs">Close Patient History</button>
      </div>
    `;
    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
  },

  async renderDoctorPatients() {
    const user = window.clinovaAuth.getCurrentUser();
    if (!user || (user.role !== 'DOCTOR' && user.role !== 'ADMIN')) {
      return this.renderUnauthorized('Doctor Workspace Restricted');
    }

    const container = document.getElementById('main-content');
    
    // Skeleton loader
    container.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div class="skeleton h-10 w-64"></div>
        <div class="skeleton h-64 w-full rounded-2xl"></div>
      </div>
    `;

    const res = await window.clinovaAPI.getDoctorPatients(user);
    const patients = res.success ? res.data : [];

    container.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 py-8">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 class="text-3xl font-extrabold text-slate-100">Assigned Patients</h1>
            <p class="text-xs text-slate-400">Patient profiles, clinical history, and treatment records</p>
          </div>

          <div class="relative w-full md:w-80">
            <i data-lucide="search" class="w-4 h-4 absolute left-3.5 top-3 text-slate-400"></i>
            <input type="text" id="doc-patient-search" oninput="ClinovaApp.filterDoctorPatientsList()" placeholder="Search patient name, ID, or phone..." class="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 outline-none focus:border-cyan-500">
          </div>
        </div>

        <div id="doctor-patients-container">
          ${this.renderDoctorPatientsListHtml(patients)}
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  async filterDoctorPatientsList() {
    const user = window.clinovaAuth.getCurrentUser();
    const search = document.getElementById('doc-patient-search')?.value || '';

    const res = await window.clinovaAPI.getDoctorPatients(user, search);
    const patients = res.success ? res.data : [];

    const container = document.getElementById('doctor-patients-container');
    if (container) {
      container.innerHTML = this.renderDoctorPatientsListHtml(patients);
      if (window.lucide) window.lucide.createIcons();
    }
  },

  renderDoctorPatientsListHtml(patients = []) {
    if (!patients || patients.length === 0) {
      return `
        <div class="glass-card p-12 text-center border border-slate-800 my-6 space-y-2">
          <i data-lucide="users" class="w-14 h-14 text-slate-500 mx-auto mb-2"></i>
          <h3 class="text-xl font-bold text-slate-200">No assigned patients found.</h3>
          <p class="text-xs text-slate-400">Patients will appear here once consultations are scheduled.</p>
        </div>
      `;
    }

    return `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${patients.map(p => `
          <div class="glass-card p-6 border border-slate-800 hover:border-cyan-500/40 transition space-y-3">
            <div class="flex justify-between items-start">
              <div>
                <span class="text-xs font-mono text-cyan-400 font-bold">${p.patientId}</span>
                <h3 class="text-xl font-bold text-slate-100">${p.fullName}</h3>
                <p class="text-xs text-slate-400">${p.age} yrs • ${p.gender} • Blood Group: <span class="text-cyan-300 font-bold">${p.bloodGroup}</span></p>
              </div>
              <button onclick="ClinovaApp.openAuthorizedPatientHistoryModal('${p.patientId}')" class="btn btn-sm btn-secondary text-xs">
                <i data-lucide="folder-user" class="w-3.5 h-3.5"></i> View History
              </button>
            </div>

            <div class="space-y-1 text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <p><span class="font-bold text-slate-400">Phone:</span> ${p.phone}</p>
              <p><span class="font-bold text-slate-400">Email:</span> ${p.email}</p>
              <p><span class="font-bold text-slate-400">Last Consultation:</span> ${p.lastVisitWithDoctor || 'Recent'}</p>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  async openDoctorScheduleModal() {
    const user = window.clinovaAuth.getCurrentUser();
    const res = await window.clinovaAPI.getDoctorProfile(user);
    if (!res.success) return this.showToast(res.message, 'error');

    const doctor = res.data;
    const currentSlots = doctor.availableSlots || ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'];
    const masterSlots = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '02:00 PM', '02:30 PM', '03:30 PM', '04:30 PM'];

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto';
    modal.innerHTML = `
      <div class="glass-card max-w-lg w-full p-6 border border-cyan-500/40 shadow-2xl my-8">
        <div class="flex justify-between items-start mb-4 border-b border-slate-800 pb-3">
          <div>
            <h3 class="text-xl font-bold text-slate-100">Schedule & Availability Control</h3>
            <p class="text-xs text-slate-400">Manage real-time status and active consultation slot availability</p>
          </div>
          <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-slate-100 text-lg font-bold">&times;</button>
        </div>

        <form onsubmit="ClinovaApp.handleDoctorScheduleSubmit(event)" class="space-y-4 text-xs">
          <div>
            <label class="block font-bold text-slate-400 mb-2">Availability Status</label>
            <div class="grid grid-cols-3 gap-2">
              <label class="p-2.5 rounded-xl border border-slate-800 bg-slate-900 flex items-center gap-2 cursor-pointer hover:border-cyan-500">
                <input type="radio" name="sched-avail" value="Available" ${doctor.availability !== 'Busy' && doctor.availability !== 'Unavailable' ? 'checked' : ''}>
                <span class="text-emerald-400 font-bold">Available</span>
              </label>
              <label class="p-2.5 rounded-xl border border-slate-800 bg-slate-900 flex items-center gap-2 cursor-pointer hover:border-amber-500">
                <input type="radio" name="sched-avail" value="Busy" ${doctor.availability === 'Busy' ? 'checked' : ''}>
                <span class="text-amber-400 font-bold">Busy</span>
              </label>
              <label class="p-2.5 rounded-xl border border-slate-800 bg-slate-900 flex items-center gap-2 cursor-pointer hover:border-red-500">
                <input type="radio" name="sched-avail" value="Unavailable" ${doctor.availability === 'Unavailable' ? 'checked' : ''}>
                <span class="text-red-400 font-bold">Unavailable</span>
              </label>
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-400 mb-1">Status Banner Label</label>
            <input type="text" id="sched-status-label" required value="${doctor.availabilityStatus || 'Available Today'}" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 outline-none focus:border-cyan-500">
          </div>

          <div>
            <label class="block font-bold text-slate-400 mb-2">Active Consultation Time Slots</label>
            <div class="grid grid-cols-3 gap-2">
              ${masterSlots.map(s => {
                const isChecked = currentSlots.includes(s);
                return `
                  <label class="p-2 rounded-lg border border-slate-800 bg-slate-900/80 flex items-center gap-2 font-mono text-[11px] cursor-pointer">
                    <input type="checkbox" name="sched-slots" value="${s}" ${isChecked ? 'checked' : ''}>
                    <span class="${isChecked ? 'text-cyan-300 font-bold' : 'text-slate-400'}">${s}</span>
                  </label>
                `;
              }).join('')}
            </div>
          </div>

          <div class="flex gap-3 pt-4 border-t border-slate-800">
            <button type="button" onclick="this.closest('.fixed').remove()" class="w-1/2 btn btn-secondary py-2.5">Cancel</button>
            <button type="submit" class="w-1/2 btn btn-primary py-2.5">Save Schedule</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
  },

  async handleDoctorScheduleSubmit(e) {
    e.preventDefault();
    const user = window.clinovaAuth.getCurrentUser();
    
    const availRadio = document.querySelector('input[name="sched-avail"]:checked');
    const availability = availRadio ? availRadio.value : 'Available';
    const availabilityStatus = document.getElementById('sched-status-label').value;
    
    const slotCheckboxes = document.querySelectorAll('input[name="sched-slots"]:checked');
    const availableSlots = Array.from(slotCheckboxes).map(cb => cb.value);

    const res = await window.clinovaAPI.updateDoctorSchedule(user, {
      availability,
      availabilityStatus,
      availableSlots
    });

    if (res.success) {
      this.showToast('Schedule and availability updated successfully.', 'success');
      const modal = document.querySelector('.fixed.z-50');
      if (modal) modal.remove();
      this.renderDoctorDashboard();
    } else {
      this.showToast(res.message, 'error');
    }
  },

  async openDoctorConsultationModal(appointmentId, patientId) {
    const user = window.clinovaAuth.getCurrentUser();
    const appt = window.clinovaDB.findOne('appointments', a => a.appointmentId === appointmentId);
    if (!appt) return this.showToast('Appointment not found', 'error');

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto';
    modal.innerHTML = `
      <div class="glass-card max-w-lg w-full p-6 border border-cyan-500/40 shadow-2xl my-8">
        <div class="flex justify-between items-start mb-4 border-b border-slate-800 pb-3">
          <div>
            <span class="badge badge-demo mb-1">Clinical Consultation</span>
            <h3 class="text-xl font-bold text-slate-100">${appt.patientName} (${appt.patientId})</h3>
            <p class="text-xs font-mono text-cyan-400">Appointment: ${appt.appointmentId} • ${appt.time}</p>
          </div>
          <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-slate-100 text-lg font-bold">&times;</button>
        </div>

        <form onsubmit="ClinovaApp.handleDoctorConsultationSubmit(event, '${appt.appointmentId}', '${appt.patientId}')" class="space-y-4 text-xs">
          <div>
            <label class="block font-bold text-slate-400 mb-1">Visit Reason</label>
            <input type="text" disabled value="${appt.reason}" class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400">
          </div>

          <div>
            <label class="block font-bold text-slate-400 mb-1">Diagnosis Summary *</label>
            <input type="text" id="doc-diagnosis" required placeholder="e.g. Acute Bronchitis • Normal Sinus Rhythm" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 outline-none focus:border-cyan-500">
          </div>

          <div>
            <label class="block font-bold text-slate-400 mb-1">Physician Notes & Clinical Findings *</label>
            <textarea id="doc-notes" required rows="3" placeholder="Enter clinical notes, patient symptoms, and examination summary..." class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 outline-none focus:border-cyan-500"></textarea>
          </div>

          <div>
            <label class="block font-bold text-slate-400 mb-1">Prescription & Medication Instructions *</label>
            <input type="text" id="doc-prescription" required placeholder="e.g. Amoxicillin 500mg — 1 tab tid x 7 days" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 outline-none focus:border-cyan-500 font-mono">
          </div>

          <div>
            <label class="block font-bold text-slate-400 mb-1">Follow-up Schedule</label>
            <input type="text" id="doc-followup" value="7 days as needed" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 outline-none focus:border-cyan-500">
          </div>

          <div class="flex gap-3 pt-3 border-t border-slate-800">
            <button type="button" onclick="this.closest('.fixed').remove()" class="w-1/2 btn btn-secondary py-2.5">Cancel</button>
            <button type="submit" class="w-1/2 btn btn-primary py-2.5">Complete Consultation</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
  },

  async handleDoctorConsultationSubmit(e, appointmentId, patientId) {
    e.preventDefault();
    const user = window.clinovaAuth.getCurrentUser();
    const diagnosis = document.getElementById('doc-diagnosis').value;
    const notes = document.getElementById('doc-notes').value;
    const prescription = document.getElementById('doc-prescription').value;
    const followUp = document.getElementById('doc-followup').value;

    const res = await window.clinovaAPI.createMedicalRecord(user, {
      appointmentId,
      patientId,
      diagnosis,
      notes,
      prescription,
      followUp
    });

    if (res.success) {
      this.showToast('Consultation completed & medical record issued!', 'success');
      const modal = document.querySelector('.fixed.z-50');
      if (modal) modal.remove();
      this.renderDoctorDashboard();
    } else {
      this.showToast(res.message, 'error');
    }
  },

  async renderDoctorProfile() {
    const user = window.clinovaAuth.getCurrentUser();
    if (!user || (user.role !== 'DOCTOR' && user.role !== 'ADMIN')) {
      return this.renderUnauthorized('Doctor Workspace Restricted');
    }

    const container = document.getElementById('main-content');
    const res = await window.clinovaAPI.getDoctorProfile(user);
    const d = res.success ? res.data : {};

    container.innerHTML = `
      <div class="max-w-4xl mx-auto py-8 px-4 space-y-6">
        <div class="glass-card p-8 border border-slate-800 space-y-6">
          <div class="flex flex-col sm:flex-row items-center gap-6 border-b border-slate-800 pb-6">
            <img src="${d.profileImage}" class="w-24 h-24 rounded-full object-cover border-2 border-cyan-400/50 shadow-xl">
            <div class="text-center sm:text-left space-y-1">
              <div class="flex items-center justify-center sm:justify-start gap-2">
                <h2 class="text-3xl font-extrabold text-slate-100">${d.fullName}</h2>
                <span class="badge badge-demo">${d.specialization}</span>
              </div>
              <p class="text-xs font-mono text-cyan-400">Doctor ID: ${d.doctorId} • ${d.experience} Experience</p>
              <div class="flex items-center justify-center sm:justify-start gap-3 text-xs text-amber-400 font-bold pt-1">
                <span>⭐ ${d.rating} Rating</span>
                <span>•</span>
                <span class="text-emerald-400">${d.availabilityStatus || 'Available Today'}</span>
              </div>
            </div>
          </div>

          <div class="space-y-4 text-xs">
            <div>
              <h4 class="font-bold text-sm text-cyan-400 mb-1">Biography & Professional Summary</h4>
              <p class="text-slate-300 leading-relaxed bg-slate-900 p-4 rounded-xl border border-slate-800">${d.bio}</p>
            </div>

            <div>
              <h4 class="font-bold text-sm text-cyan-400 mb-2">Active Consultation Time Slots</h4>
              <div class="flex flex-wrap gap-2">
                ${(d.availableSlots || []).map(s => `<span class="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-xs">${s}</span>`).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  },

  loginAsDemoRole(role) {
    window.clinovaAuth.loginAsDemo(role);
  },

  fillDemoCredentials(email, pass) {
    document.getElementById('login-email').value = email;
    document.getElementById('login-password').value = pass;
  },

  async handleLoginSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;
    const res = await window.clinovaAPI.login(email, pass);
    if (res.success) {
      window.clinovaAuth.setSession(res.data.session);
    } else {
      this.showToast(res.message, 'error');
    }
  },

  async handleRegisterSubmit(e) {
    e.preventDefault();
    const fullName = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const phone = document.getElementById('reg-phone').value;
    const dateOfBirth = '2000-01-01';
    const password = document.getElementById('reg-pass').value;
    const confirmPassword = document.getElementById('reg-confirm').value;

    const res = await window.clinovaAPI.registerPatient({ fullName, email, phone, dateOfBirth, gender: 'Other', password, confirmPassword });
    if (res.success) {
      window.clinovaAuth.setSession(res.data.session);
    } else {
      this.showToast(res.message, 'error');
    }
  },

  async cancelAppointment(appointmentId) {
    const user = window.clinovaAuth.getCurrentUser();
    const res = await window.clinovaAPI.updateAppointmentStatus(user, appointmentId, 'CANCELLED');
    if (res.success) {
      this.showToast('Appointment cancelled successfully', 'info');
      this.navigate(this.currentRoute);
    }
  },

  initAIChat() {
    const toggleBtn = document.getElementById('ai-chat-toggle');
    const chatWindow = document.getElementById('ai-chat-window');
    if (toggleBtn && chatWindow) {
      toggleBtn.addEventListener('click', () => {
        chatWindow.classList.toggle('active');
        this.renderSuggestedPrompts();
      });
    }
  },

  clearAIChat() {
    const messagesBox = document.getElementById('ai-chat-messages');
    if (messagesBox) {
      messagesBox.innerHTML = `
        <div class="text-left mb-3">
          <div class="inline-block px-3 py-2 rounded-2xl bg-slate-800 border border-slate-700 text-slate-200 text-xs">
            👋 Chat cleared. I am **Clinova Assistant**. How can I help you today?
          </div>
        </div>
      `;
      this.showToast('Chat history cleared', 'info');
    }
  },

  renderSuggestedPrompts() {
    const promptsContainer = document.getElementById('ai-suggested-prompts');
    if (!promptsContainer) return;

    const user = window.clinovaAuth.getCurrentUser();
    const prompts = window.clinovaAI.getSuggestedPrompts(user ? user.role : 'GUEST');

    promptsContainer.innerHTML = prompts.map(p => `
      <button onclick="ClinovaApp.sendAIMessage('${p.replace(/'/g, "\\'")}')" class="text-[11px] px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 hover:border-cyan-400 text-slate-300 transition text-left">
        ${p}
      </button>
    `).join('');
  },

  async sendAIMessage(presetText = null) {
    const input = document.getElementById('ai-chat-input');
    const messagesBox = document.getElementById('ai-chat-messages');
    const text = presetText || (input ? input.value : '');
    if (!text.trim()) return;

    if (input) input.value = '';

    const userMsg = document.createElement('div');
    userMsg.className = 'text-right mb-3 animate-fade-in';
    userMsg.innerHTML = `<span class="inline-block px-3 py-2 rounded-2xl bg-cyan-600 text-white text-xs max-w-[85%] text-left shadow-md">${text}</span>`;
    messagesBox.appendChild(userMsg);
    messagesBox.scrollTop = messagesBox.scrollHeight;

    const typingIndicator = document.createElement('div');
    typingIndicator.id = 'ai-typing-indicator';
    typingIndicator.className = 'text-left mb-3';
    typingIndicator.innerHTML = `
      <div class="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-800 border border-slate-700 text-slate-400 text-xs">
        <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
        <span>Clinova Assistant is thinking...</span>
      </div>
    `;
    messagesBox.appendChild(typingIndicator);
    messagesBox.scrollTop = messagesBox.scrollHeight;

    setTimeout(async () => {
      typingIndicator.remove();

      const user = window.clinovaAuth.getCurrentUser();
      const res = await window.clinovaAI.processUserMessage(text, user);

      const aiMsg = document.createElement('div');
      aiMsg.className = 'text-left mb-3 animate-fade-in';
      aiMsg.innerHTML = `<div class="inline-block px-3 py-2 rounded-2xl bg-slate-800 border border-slate-700 text-slate-200 text-xs max-w-[88%] shadow-md">${res.reply.replace(/\n/g, '<br/>')}</div>`;
      messagesBox.appendChild(aiMsg);
      messagesBox.scrollTop = messagesBox.scrollHeight;
    }, 450);
  },

  async openDoctorConsultationModal(appointmentId, patientId) {
    const user = window.clinovaAuth.getCurrentUser();
    const res = await window.clinovaAPI.getAuthorizedPatientData(user, appointmentId, patientId);
    if (!res.success) {
      return this.showToast(res.message, 'error');
    }
    const { patient, previousVisits } = res.data;

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto';
    modal.innerHTML = `
      <div class="glass-card max-w-2xl w-full p-6 border border-cyan-500/40 my-8 shadow-2xl">
        <div class="flex justify-between items-start mb-4 border-b border-slate-800 pb-3">
          <div>
            <span class="badge badge-demo mb-1">Authorized Patient Record</span>
            <h3 class="text-xl font-bold text-slate-100">${patient.fullName}</h3>
            <p class="text-xs text-slate-400">Patient ID: <span class="font-mono text-cyan-400">${patient.patientId}</span> • Age: ${patient.age} (${patient.gender})</p>
          </div>
          <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-slate-100 text-lg font-bold">&times;</button>
        </div>

        <div class="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs mb-6">
          <div><span class="text-slate-400">Blood Group:</span> <span class="font-bold text-slate-200">${patient.bloodGroup}</span></div>
          <div><span class="text-slate-400">Allergies:</span> <span class="font-bold text-red-400">${patient.allergies.join(', ')}</span></div>
          <div><span class="text-slate-400">Conditions:</span> <span class="font-bold text-amber-400">${patient.existingConditions.join(', ')}</span></div>
          <div><span class="text-slate-400">Current Meds:</span> <span class="font-bold text-cyan-400">${patient.currentMedications.join(', ')}</span></div>
        </div>

        <h4 class="font-bold text-sm text-cyan-400 mb-3">Record Clinical Consultation</h4>
        <form onsubmit="ClinovaApp.handleCreateMedicalRecordSubmit(event, '${appointmentId}', '${patientId}')" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1">Diagnosis</label>
            <input type="text" id="consult-diagnosis" required class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs outline-none focus:border-cyan-500" placeholder="e.g. Acute Bronchitis / Routine Checkup Clear">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1">Visit Reason & Consultation Notes</label>
            <textarea id="consult-notes" required rows="2" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs outline-none focus:border-cyan-500" placeholder="Clinical notes, symptoms observed, vitals assessment..."></textarea>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1">Prescription (Synthetic / Demo)</label>
            <input type="text" id="consult-prescription" required class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs outline-none focus:border-cyan-500" placeholder="e.g. Amoxicillin 500mg - 1 tab tid for 7 days">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1">Follow-up Recommendation</label>
            <input type="text" id="consult-followup" value="7 Days Routine Check" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs outline-none focus:border-cyan-500">
          </div>

          <div class="flex gap-3 pt-2">
            <button type="button" onclick="this.closest('.fixed').remove()" class="w-1/2 btn btn-secondary py-2">Cancel</button>
            <button type="submit" class="w-1/2 btn btn-primary py-2">Save Record & Complete Visit</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
  },

  async handleCreateMedicalRecordSubmit(e, appointmentId, patientId) {
    e.preventDefault();
    const user = window.clinovaAuth.getCurrentUser();
    const diagnosis = document.getElementById('consult-diagnosis').value;
    const notes = document.getElementById('consult-notes').value;
    const prescription = document.getElementById('consult-prescription').value;
    const followUp = document.getElementById('consult-followup').value;

    const res = await window.clinovaAPI.createMedicalRecord(user, {
      appointmentId,
      patientId,
      diagnosis,
      notes,
      prescription,
      followUp,
      visitReason: notes
    });

    if (res.success) {
      this.showToast('Medical record saved and visit completed!', 'success');
      const modal = document.querySelector('.fixed.z-50');
      if (modal) modal.remove();
      this.navigate(this.currentRoute);
    } else {
      this.showToast(res.message, 'error');
    }
  },

  async openProfileEditModal() {
    const user = window.clinovaAuth.getCurrentUser();
    const res = await window.clinovaAPI.getPatientProfile(user);
    if (!res.success) return this.showToast('Unable to load profile', 'error');
    const p = res.data;

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4';
    modal.innerHTML = `
      <div class="glass-card max-w-md w-full p-6 border border-slate-800 shadow-2xl">
        <h3 class="text-xl font-bold mb-4">Edit Profile Information</h3>
        <form onsubmit="ClinovaApp.handleProfileEditSubmit(event)" class="space-y-3 text-xs">
          <div>
            <label class="block text-slate-400 mb-1">Phone Number</label>
            <input type="text" id="edit-phone" value="${p.phone}" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 outline-none">
          </div>
          <div>
            <label class="block text-slate-400 mb-1">Home Address</label>
            <input type="text" id="edit-address" value="${p.address}" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 outline-none">
          </div>
          <div>
            <label class="block text-slate-400 mb-1">Emergency Contact Name</label>
            <input type="text" id="edit-em-name" value="${p.emergencyContactName}" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 outline-none">
          </div>
          <div>
            <label class="block text-slate-400 mb-1">Emergency Contact Phone</label>
            <input type="text" id="edit-em-phone" value="${p.emergencyContactPhone}" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 outline-none">
          </div>
          <div class="flex gap-3 pt-3">
            <button type="button" onclick="this.closest('.fixed').remove()" class="w-1/2 btn btn-secondary py-2">Cancel</button>
            <button type="submit" class="w-1/2 btn btn-primary py-2">Save Profile</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
  },

  async handleProfileEditSubmit(e) {
    e.preventDefault();
    const user = window.clinovaAuth.getCurrentUser();
    const updates = {
      phone: document.getElementById('edit-phone').value,
      address: document.getElementById('edit-address').value,
      emergencyContactName: document.getElementById('edit-em-name').value,
      emergencyContactPhone: document.getElementById('edit-em-phone').value,
    };
    window.clinovaDB.update('patients', 'patientId', user.patientId, updates);
    this.showToast('Profile updated successfully', 'success');
    const modal = document.querySelector('.fixed.z-50');
    if (modal) modal.remove();
    this.renderPatientProfile();
  },

  // =====================================================================
  //  ADMIN PORTAL — Full implementation (Auth-protected, ADMIN role only)
  // =====================================================================

  _adminGuard(currentUser) {
    if (!currentUser || currentUser.role !== 'ADMIN') {
      this.showToast('403 — Admin access restricted', 'error');
      this.renderUnauthorized('Admin Control Center Restricted');
      return false;
    }
    return true;
  },

  // ---- ADMIN DASHBOARD ----
  async renderAdminDashboard() {
    const user = window.clinovaAuth.getCurrentUser();
    if (!this._adminGuard(user)) return;

    const container = document.getElementById('main-content');
    container.innerHTML = `
      <div class="max-w-7xl mx-auto py-8 px-4 space-y-8">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span class="badge badge-demo mb-2">ADMIN CONTROL CENTER</span>
            <h1 class="text-3xl font-extrabold text-slate-100">System Overview</h1>
            <p class="text-xs text-slate-400 mt-1">Welcome back, <span class="text-cyan-400 font-bold">${user.fullName}</span> • Real-time backend statistics</p>
          </div>
          <div class="flex gap-2">
            <button onclick="ClinovaApp.renderAdminDashboard()" class="btn btn-secondary text-xs">
              <i data-lucide="refresh-cw" class="w-4 h-4"></i> Refresh
            </button>
            <button onclick="ClinovaApp.renderAdminAuditLogs()" class="btn btn-primary text-xs">
              <i data-lucide="shield" class="w-4 h-4"></i> Audit Logs
            </button>
          </div>
        </div>
        <div id="admin-stats-grid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          ${[1,2,3,4,5].map(() => `<div class="skeleton h-28 w-full rounded-xl"></div>`).join('')}
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="glass-card p-6 border border-slate-800">
            <h3 class="font-bold text-cyan-400 mb-4 text-sm flex items-center gap-2"><i data-lucide="users" class="w-4 h-4"></i> Recent Patients</h3>
            <div id="admin-recent-patients" class="space-y-2"><div class="skeleton h-24 w-full rounded-xl"></div></div>
            <a href="#admin-patients" class="block mt-4 text-center text-xs text-cyan-400 hover:underline font-bold">View All Patients →</a>
          </div>
          <div class="glass-card p-6 border border-slate-800">
            <h3 class="font-bold text-teal-400 mb-4 text-sm flex items-center gap-2"><i data-lucide="calendar" class="w-4 h-4"></i> Recent Appointments</h3>
            <div id="admin-recent-appts" class="space-y-2"><div class="skeleton h-24 w-full rounded-xl"></div></div>
            <a href="#admin-appointments" class="block mt-4 text-center text-xs text-teal-400 hover:underline font-bold">View All Appointments →</a>
          </div>
        </div>
        <div class="glass-card p-6 border border-slate-800">
          <h3 class="font-bold text-amber-400 mb-4 text-sm flex items-center gap-2"><i data-lucide="activity" class="w-4 h-4"></i> Recent System Activity</h3>
          <div id="admin-recent-audit" class="space-y-2"><div class="skeleton h-20 w-full rounded-xl"></div></div>
          <a href="#admin-audit" class="block mt-4 text-center text-xs text-amber-400 hover:underline font-bold">View Full Audit Log →</a>
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();

    // Load analytics
    const [analyticsRes, patientsRes, apptsRes, auditRes] = await Promise.all([
      window.clinovaAPI.getAdminAnalytics(user),
      window.clinovaAPI.getAllPatientsForAdmin(user, {}),
      window.clinovaAPI.getAppointments(user, {}),
      window.clinovaAPI.getAuditLogs(user, 'ALL')
    ]);

    if (analyticsRes.success) {
      const s = analyticsRes.data;
      const statsGrid = document.getElementById('admin-stats-grid');
      if (statsGrid) {
        statsGrid.innerHTML = `
          ${this._adminStatCard('users', 'Total Patients', s.totalPatients, 'text-cyan-400', 'border-cyan-500/30')}
          ${this._adminStatCard('stethoscope', 'Active Doctors', s.activeDoctors, 'text-teal-400', 'border-teal-500/30')}
          ${this._adminStatCard('calendar-days', 'Total Appointments', s.todayAppointments, 'text-purple-400', 'border-purple-500/30')}
          ${this._adminStatCard('check-circle', 'Completed', s.completedAppointments, 'text-green-400', 'border-green-500/30')}
          ${this._adminStatCard('x-circle', 'Cancelled', s.cancelledAppointments, 'text-red-400', 'border-red-500/30')}
        `;
      }
    }

    if (patientsRes.success) {
      const recentP = document.getElementById('admin-recent-patients');
      if (recentP) {
        const pts = patientsRes.data.slice(0, 5);
        if (pts.length === 0) {
          recentP.innerHTML = `<p class="text-xs text-slate-500 text-center py-4">No patients found.</p>`;
        } else {
          recentP.innerHTML = pts.map(p => `
            <div class="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <div>
                <p class="font-bold text-slate-100">${p.fullName}</p>
                <p class="text-slate-400 font-mono">${p.patientId} • ${p.gender}, Age ${p.age}</p>
              </div>
              <span class="badge badge-${p.status === 'Active' ? 'confirmed' : 'cancelled'}">${p.status}</span>
            </div>
          `).join('');
        }
      }
    }

    if (apptsRes.success) {
      const recentA = document.getElementById('admin-recent-appts');
      if (recentA) {
        const apts = apptsRes.data.slice(0, 5);
        if (apts.length === 0) {
          recentA.innerHTML = `<p class="text-xs text-slate-500 text-center py-4">No appointments found.</p>`;
        } else {
          recentA.innerHTML = apts.map(a => `
            <div class="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <div>
                <p class="font-bold text-slate-100">${a.patientName} → ${a.doctorName}</p>
                <p class="text-slate-400 font-mono">${a.appointmentId} • ${this.formatDate(a.date)} ${a.time}</p>
              </div>
              <span class="badge badge-${this._statusBadgeClass(a.status)}">${a.status}</span>
            </div>
          `).join('');
        }
      }
    }

    if (auditRes.success) {
      const recentAudit = document.getElementById('admin-recent-audit');
      if (recentAudit) {
        const logs = auditRes.data.slice(0, 5);
        if (logs.length === 0) {
          recentAudit.innerHTML = `<p class="text-xs text-slate-500 text-center py-4">No audit events yet.</p>`;
        } else {
          recentAudit.innerHTML = logs.map(l => this._renderAuditLogRow(l)).join('');
        }
      }
    }

    if (window.lucide) window.lucide.createIcons();
  },

  _adminStatCard(icon, label, value, colorClass, borderClass) {
    return `
      <div class="glass-card p-5 border ${borderClass} space-y-2 hover:scale-[1.02] transition-transform">
        <div class="flex items-center justify-between">
          <i data-lucide="${icon}" class="w-5 h-5 ${colorClass}"></i>
          <span class="text-[10px] text-slate-500 font-mono uppercase">Live</span>
        </div>
        <p class="text-3xl font-extrabold ${colorClass}">${value}</p>
        <p class="text-xs text-slate-400 font-medium">${label}</p>
      </div>
    `;
  },

  _statusBadgeClass(status) {
    if (!status) return 'pending';
    const s = status.toUpperCase();
    if (s === 'COMPLETED') return 'confirmed';
    if (s === 'CANCELLED') return 'cancelled';
    if (s === 'CONFIRMED') return 'confirmed';
    if (s === 'PENDING' || s === 'WAITING') return 'pending';
    return 'pending';
  },

  // ---- ADMIN PATIENTS ----
  async renderAdminPatients() {
    const user = window.clinovaAuth.getCurrentUser();
    if (!this._adminGuard(user)) return;

    const container = document.getElementById('main-content');
    container.innerHTML = `
      <div class="max-w-7xl mx-auto py-8 px-4 space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span class="badge badge-demo mb-2">ADMIN</span>
            <h1 class="text-3xl font-extrabold text-slate-100">Patient Management</h1>
            <p class="text-xs text-slate-400 mt-1">View, search, filter and manage all registered patients</p>
          </div>
        </div>

        <!-- Filters -->
        <div class="glass-card p-4 border border-slate-800 flex flex-col sm:flex-row gap-3 flex-wrap">
          <input type="text" id="admin-pt-search" placeholder="Search by name, ID, email, phone..."
            class="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs outline-none focus:border-cyan-500 min-w-[200px]"
            oninput="ClinovaApp.handleAdminPatientSearch()">
          <select id="admin-pt-status" onchange="ClinovaApp.handleAdminPatientSearch()"
            class="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs outline-none focus:border-cyan-500">
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <button onclick="ClinovaApp.clearAdminPatientFilters()" class="btn btn-secondary text-xs px-4">
            <i data-lucide="x" class="w-3.5 h-3.5"></i> Clear
          </button>
        </div>

        <!-- Table -->
        <div class="glass-card border border-slate-800 overflow-x-auto">
          <div id="admin-patients-table-wrap">
            <div class="skeleton h-64 w-full rounded-xl m-4"></div>
          </div>
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    await this._loadAdminPatientsTable(user, {});
  },

  async _loadAdminPatientsTable(user, filters) {
    const res = await window.clinovaAPI.getAllPatientsForAdmin(user, filters);
    const wrap = document.getElementById('admin-patients-table-wrap');
    if (!wrap) return;

    if (!res.success) {
      wrap.innerHTML = `<p class="p-6 text-red-400 text-sm font-bold">Error: ${res.message}</p>`;
      return;
    }

    const pts = res.data;
    if (pts.length === 0) {
      wrap.innerHTML = `
        <div class="p-12 text-center space-y-3">
          <i data-lucide="users" class="w-12 h-12 text-slate-600 mx-auto"></i>
          <p class="text-slate-400 font-bold">No patients found.</p>
          <button onclick="ClinovaApp.clearAdminPatientFilters()" class="btn btn-secondary text-xs">Clear Filters</button>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    wrap.innerHTML = `
      <table class="w-full text-xs">
        <thead>
          <tr class="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
            <th class="px-4 py-3 text-left font-bold">Patient</th>
            <th class="px-4 py-3 text-left font-bold">ID</th>
            <th class="px-4 py-3 text-left font-bold hidden md:table-cell">Contact</th>
            <th class="px-4 py-3 text-left font-bold hidden lg:table-cell">Age / Gender</th>
            <th class="px-4 py-3 text-left font-bold">Status</th>
            <th class="px-4 py-3 text-left font-bold">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800/60">
          ${pts.map(p => `
            <tr class="hover:bg-slate-900/60 transition">
              <td class="px-4 py-3">
                <p class="font-bold text-slate-100">${p.fullName}</p>
                <p class="text-slate-500 font-mono text-[10px]">${p.email}</p>
              </td>
              <td class="px-4 py-3 font-mono text-cyan-400">${p.patientId}</td>
              <td class="px-4 py-3 text-slate-300 hidden md:table-cell">${p.phone}</td>
              <td class="px-4 py-3 text-slate-300 hidden lg:table-cell">${p.age} yrs / ${p.gender}</td>
              <td class="px-4 py-3">
                <span class="badge badge-${p.status === 'Active' ? 'confirmed' : 'cancelled'}">${p.status}</span>
              </td>
              <td class="px-4 py-3">
                <div class="flex gap-2 flex-wrap">
                  <button onclick="ClinovaApp.openAdminPatientModal('${p.patientId}')" class="btn btn-sm btn-secondary text-[10px]">
                    <i data-lucide="eye" class="w-3 h-3"></i> View
                  </button>
                  <button onclick="ClinovaApp.toggleAdminPatientStatus('${p.patientId}', '${p.status}')"
                    class="btn btn-sm text-[10px] ${p.status === 'Active' ? 'btn-danger' : 'btn-primary'}">
                    ${p.status === 'Active' ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="px-4 py-3 border-t border-slate-800 text-xs text-slate-500 font-mono">
        Showing ${pts.length} patient${pts.length !== 1 ? 's' : ''}
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  },

  async handleAdminPatientSearch() {
    const user = window.clinovaAuth.getCurrentUser();
    if (!this._adminGuard(user)) return;
    const search = document.getElementById('admin-pt-search')?.value || '';
    const status = document.getElementById('admin-pt-status')?.value || 'ALL';
    const wrap = document.getElementById('admin-patients-table-wrap');
    if (wrap) wrap.innerHTML = `<div class="skeleton h-32 w-full rounded-xl m-4"></div>`;
    await this._loadAdminPatientsTable(user, { search, status });
  },

  clearAdminPatientFilters() {
    const s = document.getElementById('admin-pt-search');
    const st = document.getElementById('admin-pt-status');
    if (s) s.value = '';
    if (st) st.value = 'ALL';
    this.handleAdminPatientSearch();
  },

  async toggleAdminPatientStatus(patientId, currentStatus) {
    const user = window.clinovaAuth.getCurrentUser();
    if (!this._adminGuard(user)) return;
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    if (!confirm(`Are you sure you want to set patient ${patientId} to ${newStatus}?`)) return;
    const res = await window.clinovaAPI.toggleAccountStatus(user, 'patient', patientId, newStatus);
    if (res.success) {
      this.showToast(`Patient status updated to ${newStatus}.`, 'success');
      this.handleAdminPatientSearch();
    } else {
      this.showToast(res.message, 'error');
    }
  },

  async openAdminPatientModal(patientId) {
    const user = window.clinovaAuth.getCurrentUser();
    if (!this._adminGuard(user)) return;
    const patient = window.clinovaDB.findOne('patients', p => p.patientId === patientId);
    if (!patient) return this.showToast('Patient not found', 'error');

    const appts = window.clinovaDB.filter('appointments', a => a.patientId === patientId);
    const records = window.clinovaDB.filter('medicalRecords', r => r.patientId === patientId);

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto';
    modal.innerHTML = `
      <div class="glass-card max-w-2xl w-full p-6 border border-cyan-500/40 shadow-2xl my-8 space-y-4">
        <div class="flex justify-between items-start border-b border-slate-800 pb-3">
          <div>
            <span class="badge badge-demo mb-1">ADMIN VIEW — SYNTHETIC DATA</span>
            <h3 class="text-xl font-bold text-slate-100">${patient.fullName}</h3>
            <p class="text-xs text-cyan-400 font-mono">${patient.patientId} • ${patient.gender}, Age ${patient.age}</p>
          </div>
          <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-slate-100 text-lg font-bold">&times;</button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <h4 class="font-bold text-cyan-400 text-[10px] uppercase tracking-wider">Personal Information</h4>
            <p class="flex justify-between"><span class="text-slate-400">Email:</span><span class="text-slate-200 font-mono">${patient.email}</span></p>
            <p class="flex justify-between"><span class="text-slate-400">Phone:</span><span class="text-slate-200 font-mono">${patient.phone}</span></p>
            <p class="flex justify-between"><span class="text-slate-400">DOB:</span><span class="text-slate-200 font-mono">${patient.dateOfBirth}</span></p>
            <p class="flex justify-between"><span class="text-slate-400">Blood Group:</span><span class="text-cyan-400 font-bold">${patient.bloodGroup}</span></p>
            <p class="flex justify-between"><span class="text-slate-400">Status:</span><span class="badge badge-${patient.status === 'Active' ? 'confirmed' : 'cancelled'}">${patient.status}</span></p>
          </div>
          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <h4 class="font-bold text-teal-400 text-[10px] uppercase tracking-wider">Medical Overview (Synthetic)</h4>
            <p class="flex justify-between"><span class="text-slate-400">Allergies:</span><span class="text-red-400 font-semibold">${Array.isArray(patient.allergies) ? patient.allergies.join(', ') : patient.allergies}</span></p>
            <p class="flex justify-between"><span class="text-slate-400">Conditions:</span><span class="text-amber-400 font-semibold">${Array.isArray(patient.existingConditions) ? patient.existingConditions.join(', ') : patient.existingConditions}</span></p>
            <p class="flex justify-between"><span class="text-slate-400">Medications:</span><span class="text-teal-400 font-semibold">${Array.isArray(patient.currentMedications) ? patient.currentMedications.slice(0,1).join(', ') : patient.currentMedications}</span></p>
            <p class="flex justify-between"><span class="text-slate-400">Total Appts:</span><span class="text-slate-200 font-bold">${appts.length}</span></p>
            <p class="flex justify-between"><span class="text-slate-400">Medical Records:</span><span class="text-slate-200 font-bold">${records.length}</span></p>
          </div>
        </div>

        <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
          <h4 class="font-bold text-amber-400 text-[10px] uppercase tracking-wider">Emergency Contact</h4>
          <p class="flex gap-4"><span class="text-slate-400">Name:</span><span class="text-slate-200 font-bold">${patient.emergencyContactName}</span>
            <span class="text-slate-400">Rel:</span><span class="text-slate-200">${patient.emergencyContactRelationship}</span>
            <span class="text-slate-400">Phone:</span><span class="text-amber-300 font-mono">${patient.emergencyContactPhone}</span>
          </p>
        </div>

        <button onclick="this.closest('.fixed').remove()" class="w-full btn btn-secondary py-2.5 text-xs">Close Patient Record</button>
      </div>
    `;
    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
  },

  // ---- ADMIN DOCTORS ----
  async renderAdminDoctors() {
    const user = window.clinovaAuth.getCurrentUser();
    if (!this._adminGuard(user)) return;

    const container = document.getElementById('main-content');
    container.innerHTML = `
      <div class="max-w-7xl mx-auto py-8 px-4 space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span class="badge badge-demo mb-2">ADMIN</span>
            <h1 class="text-3xl font-extrabold text-slate-100">Doctor Management</h1>
            <p class="text-xs text-slate-400 mt-1">View, manage, add, and control doctor accounts</p>
          </div>
          <button onclick="ClinovaApp.openAddDoctorModal()" class="btn btn-primary text-xs">
            <i data-lucide="user-plus" class="w-4 h-4"></i> Add New Doctor
          </button>
        </div>

        <!-- Filters -->
        <div class="glass-card p-4 border border-slate-800 flex flex-col sm:flex-row gap-3 flex-wrap">
          <input type="text" id="admin-dr-search" placeholder="Search by name, ID, specialization..."
            class="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs outline-none focus:border-cyan-500 min-w-[200px]"
            oninput="ClinovaApp.handleAdminDoctorSearch()">
          <select id="admin-dr-status" onchange="ClinovaApp.handleAdminDoctorSearch()"
            class="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs outline-none focus:border-cyan-500">
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <button onclick="ClinovaApp.clearAdminDoctorFilters()" class="btn btn-secondary text-xs px-4">
            <i data-lucide="x" class="w-3.5 h-3.5"></i> Clear
          </button>
        </div>

        <div class="glass-card border border-slate-800 overflow-x-auto">
          <div id="admin-doctors-table-wrap">
            <div class="skeleton h-64 w-full rounded-xl m-4"></div>
          </div>
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    await this._loadAdminDoctorsTable(user, {});
  },

  async _loadAdminDoctorsTable(user, filters) {
    const res = await window.clinovaAPI.getDoctors({ includeInactive: true, ...filters });
    const wrap = document.getElementById('admin-doctors-table-wrap');
    if (!wrap) return;

    if (!res.success) {
      wrap.innerHTML = `<p class="p-6 text-red-400 text-sm font-bold">Error: ${res.message}</p>`;
      return;
    }

    let doctors = res.data;
    // apply admin status filter if set
    if (filters.status && filters.status !== 'ALL') {
      doctors = doctors.filter(d => d.status === filters.status);
    }
    // apply admin search filter
    if (filters.search) {
      const q = filters.search.toLowerCase();
      doctors = doctors.filter(d =>
        d.fullName.toLowerCase().includes(q) ||
        d.doctorId.toLowerCase().includes(q) ||
        (d.specialization || '').toLowerCase().includes(q)
      );
    }

    if (doctors.length === 0) {
      wrap.innerHTML = `
        <div class="p-12 text-center space-y-3">
          <i data-lucide="stethoscope" class="w-12 h-12 text-slate-600 mx-auto"></i>
          <p class="text-slate-400 font-bold">No doctors found.</p>
          <button onclick="ClinovaApp.clearAdminDoctorFilters()" class="btn btn-secondary text-xs">Clear Filters</button>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    wrap.innerHTML = `
      <table class="w-full text-xs">
        <thead>
          <tr class="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
            <th class="px-4 py-3 text-left font-bold">Doctor</th>
            <th class="px-4 py-3 text-left font-bold">ID</th>
            <th class="px-4 py-3 text-left font-bold hidden md:table-cell">Specialization</th>
            <th class="px-4 py-3 text-left font-bold hidden lg:table-cell">Rating / Exp</th>
            <th class="px-4 py-3 text-left font-bold">Availability</th>
            <th class="px-4 py-3 text-left font-bold">Status</th>
            <th class="px-4 py-3 text-left font-bold">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800/60">
          ${doctors.map(d => `
            <tr class="hover:bg-slate-900/60 transition">
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <img src="${d.profileImage}" class="w-9 h-9 rounded-full object-cover border border-cyan-500/30">
                  <div>
                    <p class="font-bold text-slate-100">${d.fullName}</p>
                    <p class="text-slate-500 text-[10px] font-mono">${d.email || 'N/A'}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3 font-mono text-teal-400">${d.doctorId}</td>
              <td class="px-4 py-3 text-slate-300 hidden md:table-cell">${d.specialization}</td>
              <td class="px-4 py-3 text-slate-300 hidden lg:table-cell">⭐ ${d.rating} • ${d.experience}</td>
              <td class="px-4 py-3">
                <span class="badge badge-${d.availability === 'Available' ? 'confirmed' : 'pending'}">${d.availability || 'Available'}</span>
              </td>
              <td class="px-4 py-3">
                <span class="badge badge-${d.status === 'Active' ? 'confirmed' : 'cancelled'}">${d.status || 'Active'}</span>
              </td>
              <td class="px-4 py-3">
                <div class="flex gap-2 flex-wrap">
                  <button onclick="ClinovaApp.openAdminDoctorModal('${d.doctorId}')" class="btn btn-sm btn-secondary text-[10px]">
                    <i data-lucide="eye" class="w-3 h-3"></i> View
                  </button>
                  <button onclick="ClinovaApp.toggleAdminDoctorStatus('${d.doctorId}', '${d.status || 'Active'}')"
                    class="btn btn-sm text-[10px] ${(d.status || 'Active') === 'Active' ? 'btn-danger' : 'btn-primary'}">
                    ${(d.status || 'Active') === 'Active' ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="px-4 py-3 border-t border-slate-800 text-xs text-slate-500 font-mono">
        Showing ${doctors.length} doctor${doctors.length !== 1 ? 's' : ''}
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  },

  async handleAdminDoctorSearch() {
    const user = window.clinovaAuth.getCurrentUser();
    if (!this._adminGuard(user)) return;
    const search = document.getElementById('admin-dr-search')?.value || '';
    const status = document.getElementById('admin-dr-status')?.value || 'ALL';
    const wrap = document.getElementById('admin-doctors-table-wrap');
    if (wrap) wrap.innerHTML = `<div class="skeleton h-32 w-full rounded-xl m-4"></div>`;
    await this._loadAdminDoctorsTable(user, { search, status, includeInactive: true });
  },

  clearAdminDoctorFilters() {
    const s = document.getElementById('admin-dr-search');
    const st = document.getElementById('admin-dr-status');
    if (s) s.value = '';
    if (st) st.value = 'ALL';
    this.handleAdminDoctorSearch();
  },

  async toggleAdminDoctorStatus(doctorId, currentStatus) {
    const user = window.clinovaAuth.getCurrentUser();
    if (!this._adminGuard(user)) return;
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    if (!confirm(`Are you sure you want to set doctor ${doctorId} to ${newStatus}?`)) return;
    const res = await window.clinovaAPI.toggleAccountStatus(user, 'doctor', doctorId, newStatus);
    if (res.success) {
      this.showToast(`Doctor status updated to ${newStatus}.`, 'success');
      this.handleAdminDoctorSearch();
    } else {
      this.showToast(res.message, 'error');
    }
  },

  async openAdminDoctorModal(doctorId) {
    const doctor = window.clinovaDB.findOne('doctors', d => d.doctorId === doctorId);
    if (!doctor) return this.showToast('Doctor not found', 'error');
    const appts = window.clinovaDB.filter('appointments', a => a.doctorId === doctorId);
    const completed = appts.filter(a => a.status === 'COMPLETED').length;
    const upcoming = appts.filter(a => ['CONFIRMED','WAITING','PENDING'].includes(a.status)).length;

    const specs = ['Cardiology', 'Neurology', 'Oncology', 'Orthopedics', 'Pediatrics', 'Dermatology', 'General Medicine', 'Psychiatry'];

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto';
    modal.innerHTML = `
      <div class="glass-card max-w-lg w-full p-6 border border-teal-500/40 shadow-2xl my-8 space-y-4">
        <div class="flex justify-between items-start border-b border-slate-800 pb-3">
          <div class="flex items-center gap-4">
            <img src="${doctor.profileImage}" class="w-14 h-14 rounded-full border-2 border-teal-400 object-cover">
            <div>
              <span class="badge badge-demo mb-1">ADMIN — DOCTOR PROFILE</span>
              <h3 class="text-xl font-bold text-slate-100">${doctor.fullName}</h3>
              <p class="text-xs text-teal-400 font-mono">${doctor.doctorId} • ${doctor.specialization}</p>
            </div>
          </div>
          <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-slate-100 text-lg font-bold">&times;</button>
        </div>

        <div class="grid grid-cols-2 gap-4 text-xs">
          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <h4 class="font-bold text-teal-400 text-[10px] uppercase tracking-wider">Profile & Status</h4>
            <p class="flex justify-between items-center"><span class="text-slate-400">Experience:</span><span class="text-slate-200">${doctor.experience}</span></p>
            <p class="flex justify-between items-center"><span class="text-slate-400">Rating:</span><span class="text-amber-400 font-bold">⭐ ${doctor.rating}</span></p>
            <p class="flex justify-between items-center"><span class="text-slate-400">Availability:</span><span class="badge badge-${doctor.availability === 'Available' ? 'confirmed' : 'pending'}">${doctor.availability || 'Available'}</span></p>
            <p class="flex justify-between items-center"><span class="text-slate-400">Status:</span><span class="badge badge-${doctor.status === 'Active' ? 'confirmed' : 'cancelled'}">${doctor.status || 'Active'}</span></p>
          </div>
          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <h4 class="font-bold text-cyan-400 text-[10px] uppercase tracking-wider">Appointment Stats</h4>
            <p class="flex justify-between"><span class="text-slate-400">Total Appts:</span><span class="font-bold text-slate-200">${appts.length}</span></p>
            <p class="flex justify-between"><span class="text-slate-400">Completed:</span><span class="font-bold text-green-400">${completed}</span></p>
            <p class="flex justify-between"><span class="text-slate-400">Upcoming:</span><span class="font-bold text-cyan-400">${upcoming}</span></p>
          </div>
        </div>

        <!-- Management Controls (Specialization & Availability) -->
        <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-3">
          <h4 class="font-bold text-amber-400 text-[10px] uppercase tracking-wider">Manage Specialization & Availability</h4>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-400 mb-1 text-[11px]">Specialization</label>
              <select id="admin-edit-spec" class="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs outline-none focus:border-cyan-500">
                ${specs.map(s => `<option value="${s}" ${s === doctor.specialization ? 'selected' : ''}>${s}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block text-slate-400 mb-1 text-[11px]">Availability Status</label>
              <select id="admin-edit-avail" class="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs outline-none focus:border-cyan-500">
                <option value="Available" ${doctor.availability === 'Available' ? 'selected' : ''}>Available</option>
                <option value="Unavailable" ${doctor.availability === 'Unavailable' ? 'selected' : ''}>Unavailable</option>
                <option value="On Leave" ${doctor.availability === 'On Leave' ? 'selected' : ''}>On Leave</option>
              </select>
            </div>
          </div>
          <button onclick="ClinovaApp.saveAdminDoctorEdit('${doctor.doctorId}')" class="w-full btn btn-primary text-xs py-1.5">
            Save Changes
          </button>
        </div>

        <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <h4 class="font-bold text-slate-400 mb-2 text-[10px] uppercase tracking-wider">Biography</h4>
          <p class="text-slate-300 leading-relaxed">${doctor.bio}</p>
        </div>

        <div class="flex gap-3">
          <button onclick="ClinovaApp.toggleAdminDoctorStatus('${doctor.doctorId}', '${doctor.status || 'Active'}'); this.closest('.fixed').remove();"
            class="flex-1 btn text-xs ${(doctor.status || 'Active') === 'Active' ? 'btn-danger' : 'btn-primary'}">
            ${(doctor.status || 'Active') === 'Active' ? 'Deactivate Doctor' : 'Activate Doctor'}
          </button>
          <button onclick="this.closest('.fixed').remove()" class="flex-1 btn btn-secondary text-xs">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
  },

  async saveAdminDoctorEdit(doctorId) {
    const user = window.clinovaAuth.getCurrentUser();
    if (!this._adminGuard(user)) return;

    const spec = document.getElementById('admin-edit-spec')?.value;
    const avail = document.getElementById('admin-edit-avail')?.value;

    const res = await window.clinovaAPI.updateDoctorDetails(user, doctorId, {
      specialization: spec,
      availability: avail,
      availabilityStatus: avail === 'Available' ? 'Available Today' : avail
    });

    if (res.success) {
      this.showToast('Doctor specialization and availability updated successfully!', 'success');
      const modal = document.querySelector('.fixed.inset-0');
      if (modal) modal.remove();
      this.handleAdminDoctorSearch();
    } else {
      this.showToast(res.message || 'Failed to update doctor details', 'error');
    }
  },

  openAddDoctorModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto';
    modal.innerHTML = `
      <div class="glass-card max-w-lg w-full p-6 border border-teal-500/40 shadow-2xl my-8">
        <div class="flex justify-between items-start mb-4 border-b border-slate-800 pb-3">
          <div>
            <h3 class="text-xl font-bold text-slate-100">Add New Doctor</h3>
            <p class="text-xs text-slate-400">Create a new doctor account on CLINOVA</p>
          </div>
          <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-slate-100 text-lg font-bold">&times;</button>
        </div>
        <form onsubmit="ClinovaApp.handleAddDoctorSubmit(event)" class="space-y-4 text-xs">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-400 mb-1">Full Name</label>
              <input type="text" id="add-dr-name" required placeholder="Dr. Full Name" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 outline-none focus:border-teal-500">
            </div>
            <div>
              <label class="block font-bold text-slate-400 mb-1">Email</label>
              <input type="email" id="add-dr-email" required placeholder="doctor@clinova.demo" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 outline-none focus:border-teal-500">
            </div>
            <div>
              <label class="block font-bold text-slate-400 mb-1">Specialization</label>
              <select id="add-dr-spec" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 outline-none focus:border-teal-500">
                <option>Cardiology</option>
                <option>Neurology</option>
                <option>Oncology</option>
                <option>Orthopedics</option>
                <option>Pediatrics</option>
                <option>Dermatology</option>
                <option>General Medicine</option>
                <option>Psychiatry</option>
              </select>
            </div>
            <div>
              <label class="block font-bold text-slate-400 mb-1">Experience</label>
              <input type="text" id="add-dr-exp" required placeholder="e.g. 8 Years" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 outline-none focus:border-teal-500">
            </div>
            <div class="md:col-span-2">
              <label class="block font-bold text-slate-400 mb-1">Bio / Description</label>
              <textarea id="add-dr-bio" rows="2" placeholder="Board-certified specialist at CLINOVA..." class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 outline-none focus:border-teal-500"></textarea>
            </div>
          </div>
          <div class="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[11px]">
            Default login password: <span class="font-mono font-bold">Doctor@123</span>
          </div>
          <div class="flex gap-3 pt-2">
            <button type="button" onclick="this.closest('.fixed').remove()" class="w-1/2 btn btn-secondary py-2.5">Cancel</button>
            <button type="submit" class="w-1/2 btn btn-primary py-2.5">Create Doctor Account</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
  },

  async handleAddDoctorSubmit(e) {
    e.preventDefault();
    const user = window.clinovaAuth.getCurrentUser();
    if (!this._adminGuard(user)) return;

    const doctorData = {
      fullName: document.getElementById('add-dr-name').value,
      email: document.getElementById('add-dr-email').value,
      specialization: document.getElementById('add-dr-spec').value,
      experience: document.getElementById('add-dr-exp').value,
      bio: document.getElementById('add-dr-bio').value
    };

    const res = await window.clinovaAPI.createDoctor(user, doctorData);
    if (res.success) {
      this.showToast(`Doctor ${doctorData.fullName} created successfully!`, 'success');
      const modal = document.querySelector('.fixed.z-50');
      if (modal) modal.remove();
      this.renderAdminDoctors();
    } else {
      this.showToast(res.message, 'error');
    }
  },

  // ---- ADMIN APPOINTMENTS ----
  async renderAdminAppointments() {
    const user = window.clinovaAuth.getCurrentUser();
    if (!this._adminGuard(user)) return;

    const doctors = window.clinovaDB.get('doctors');
    const patients = window.clinovaDB.get('patients');

    const container = document.getElementById('main-content');
    container.innerHTML = `
      <div class="max-w-7xl mx-auto py-8 px-4 space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span class="badge badge-demo mb-2">ADMIN</span>
            <h1 class="text-3xl font-extrabold text-slate-100">Appointment Management</h1>
            <p class="text-xs text-slate-400 mt-1">Search, filter and view all system appointments and historical logs</p>
          </div>
        </div>

        <!-- Filters -->
        <div class="glass-card p-4 border border-slate-800 flex flex-col sm:flex-row gap-3 flex-wrap">
          <input type="text" id="admin-apt-search" placeholder="Search by ID, patient, doctor, reason..."
            class="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs outline-none focus:border-cyan-500 min-w-[180px]"
            oninput="ClinovaApp.handleAdminApptSearch()">
          <select id="admin-apt-status" onchange="ClinovaApp.handleAdminApptSearch()"
            class="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs outline-none focus:border-cyan-500">
            <option value="ALL">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PENDING">Pending</option>
            <option value="WAITING">Waiting</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select id="admin-apt-doctor" onchange="ClinovaApp.handleAdminApptSearch()"
            class="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs outline-none focus:border-cyan-500">
            <option value="ALL">All Doctors</option>
            ${doctors.map(d => `<option value="${d.doctorId}">${d.fullName}</option>`).join('')}
          </select>
          <select id="admin-apt-patient" onchange="ClinovaApp.handleAdminApptSearch()"
            class="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs outline-none focus:border-cyan-500">
            <option value="ALL">All Patients</option>
            ${patients.map(p => `<option value="${p.patientId}">${p.fullName}</option>`).join('')}
          </select>
          <input type="date" id="admin-apt-date" onchange="ClinovaApp.handleAdminApptSearch()"
            class="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs outline-none focus:border-cyan-500 font-mono">
          <button onclick="ClinovaApp.clearAdminApptFilters()" class="btn btn-secondary text-xs px-4">
            <i data-lucide="x" class="w-3.5 h-3.5"></i> Clear
          </button>
        </div>

        <div class="glass-card border border-slate-800 overflow-x-auto">
          <div id="admin-appts-table-wrap">
            <div class="skeleton h-64 w-full rounded-xl m-4"></div>
          </div>
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    await this._loadAdminApptsTable(user, {});
  },

  async _loadAdminApptsTable(user, filters) {
    const res = await window.clinovaAPI.getAppointments(user, filters);
    const wrap = document.getElementById('admin-appts-table-wrap');
    if (!wrap) return;

    if (!res.success) {
      wrap.innerHTML = `<p class="p-6 text-red-400 text-sm font-bold">Error: ${res.message}</p>`;
      return;
    }

    let apts = res.data;
    if (filters.patientId && filters.patientId !== 'ALL') {
      apts = apts.filter(a => a.patientId === filters.patientId);
    }

    if (apts.length === 0) {
      wrap.innerHTML = `
        <div class="p-12 text-center space-y-3">
          <i data-lucide="calendar-x" class="w-12 h-12 text-slate-600 mx-auto"></i>
          <p class="text-slate-400 font-bold">No appointments found matching your filter criteria.</p>
          <button onclick="ClinovaApp.clearAdminApptFilters()" class="btn btn-secondary text-xs">Clear Filters</button>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    wrap.innerHTML = `
      <table class="w-full text-xs">
        <thead>
          <tr class="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
            <th class="px-4 py-3 text-left font-bold">Appointment ID</th>
            <th class="px-4 py-3 text-left font-bold">Patient</th>
            <th class="px-4 py-3 text-left font-bold hidden md:table-cell">Doctor</th>
            <th class="px-4 py-3 text-left font-bold hidden lg:table-cell">Date & Time</th>
            <th class="px-4 py-3 text-left font-bold hidden lg:table-cell">Reason</th>
            <th class="px-4 py-3 text-left font-bold">Status</th>
            <th class="px-4 py-3 text-left font-bold">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800/60">
          ${apts.map(a => `
            <tr class="hover:bg-slate-900/60 transition">
              <td class="px-4 py-3 font-mono text-cyan-400">${a.appointmentId}</td>
              <td class="px-4 py-3">
                <p class="font-bold text-slate-100">${a.patientName}</p>
                <p class="text-slate-500 font-mono text-[10px]">${a.patientId}</p>
              </td>
              <td class="px-4 py-3 hidden md:table-cell">
                <p class="font-semibold text-slate-200">${a.doctorName}</p>
                <p class="text-slate-500 text-[10px]">${a.specialization}</p>
              </td>
              <td class="px-4 py-3 text-slate-300 font-mono hidden lg:table-cell">${this.formatDate(a.date)}<br>${a.time}</td>
              <td class="px-4 py-3 text-slate-400 hidden lg:table-cell max-w-[120px] truncate">${a.reason}</td>
              <td class="px-4 py-3">
                <span class="badge badge-${this._statusBadgeClass(a.status)}">${a.status}</span>
              </td>
              <td class="px-4 py-3">
                <button onclick="ClinovaApp.openAdminApptModal('${a.appointmentId}')" class="btn btn-sm btn-secondary text-[10px]">
                  <i data-lucide="eye" class="w-3 h-3"></i> View Details
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="px-4 py-3 border-t border-slate-800 text-xs text-slate-500 font-mono">
        Showing ${apts.length} appointment${apts.length !== 1 ? 's' : ''}
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  },

  async handleAdminApptSearch() {
    const user = window.clinovaAuth.getCurrentUser();
    if (!this._adminGuard(user)) return;
    const search = document.getElementById('admin-apt-search')?.value || '';
    const status = document.getElementById('admin-apt-status')?.value || 'ALL';
    const doctorId = document.getElementById('admin-apt-doctor')?.value || 'ALL';
    const patientId = document.getElementById('admin-apt-patient')?.value || 'ALL';
    const date = document.getElementById('admin-apt-date')?.value || '';

    const wrap = document.getElementById('admin-appts-table-wrap');
    if (wrap) wrap.innerHTML = `<div class="skeleton h-32 w-full rounded-xl m-4"></div>`;
    const filters = {};
    if (search) filters.search = search;
    if (status !== 'ALL') filters.status = status;
    if (doctorId !== 'ALL') filters.doctorId = doctorId;
    if (patientId !== 'ALL') filters.patientId = patientId;
    if (date) filters.date = date;
    await this._loadAdminApptsTable(user, filters);
  },

  clearAdminApptFilters() {
    const s = document.getElementById('admin-apt-search');
    const st = document.getElementById('admin-apt-status');
    const dr = document.getElementById('admin-apt-doctor');
    const pt = document.getElementById('admin-apt-patient');
    const d = document.getElementById('admin-apt-date');
    if (s) s.value = '';
    if (st) st.value = 'ALL';
    if (dr) dr.value = 'ALL';
    if (pt) pt.value = 'ALL';
    if (d) d.value = '';
    this.handleAdminApptSearch();
  },

  openAdminApptModal(appointmentId) {
    const a = window.clinovaDB.findOne('appointments', a => a.appointmentId === appointmentId);
    if (!a) return this.showToast('Appointment not found', 'error');

    // Retrieve appointment history / audit log trail for this specific appointment
    const auditLogs = window.clinovaDB.filter('auditLogs', log => log.resourceId === appointmentId);

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto';
    modal.innerHTML = `
      <div class="glass-card max-w-xl w-full p-6 border border-purple-500/40 shadow-2xl my-8 space-y-4">
        <div class="flex justify-between items-start border-b border-slate-800 pb-3">
          <div>
            <span class="badge badge-demo mb-1">ADMIN — APPOINTMENT DETAILS & HISTORY</span>
            <h3 class="text-xl font-bold text-slate-100">Appointment ${a.appointmentId}</h3>
            <span class="badge badge-${this._statusBadgeClass(a.status)} mt-1">${a.status}</span>
          </div>
          <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-slate-100 text-lg font-bold">&times;</button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <h4 class="font-bold text-cyan-400 text-[10px] uppercase tracking-wider">Patient</h4>
            <p class="flex justify-between"><span class="text-slate-400">Name:</span><span class="font-bold text-slate-100">${a.patientName}</span></p>
            <p class="flex justify-between"><span class="text-slate-400">Patient ID:</span><span class="font-mono text-cyan-400">${a.patientId}</span></p>
          </div>
          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <h4 class="font-bold text-teal-400 text-[10px] uppercase tracking-wider">Doctor</h4>
            <p class="flex justify-between"><span class="text-slate-400">Name:</span><span class="font-bold text-slate-100">${a.doctorName}</span></p>
            <p class="flex justify-between"><span class="text-slate-400">Specialization:</span><span class="text-teal-400">${a.specialization}</span></p>
          </div>
          <div class="md:col-span-2 p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <h4 class="font-bold text-purple-400 text-[10px] uppercase tracking-wider">Appointment Overview</h4>
            <p class="flex justify-between"><span class="text-slate-400">Date:</span><span class="font-mono text-slate-200">${this.formatDate(a.date)}</span></p>
            <p class="flex justify-between"><span class="text-slate-400">Time:</span><span class="font-mono text-slate-200">${a.time}</span></p>
            <p class="flex justify-between"><span class="text-slate-400">Location:</span><span class="text-slate-300">${a.location}</span></p>
            <p class="flex justify-between"><span class="text-slate-400">Reason:</span><span class="text-slate-200 text-right max-w-[220px]">${a.reason}</span></p>
            <p class="flex justify-between"><span class="text-slate-400">Booked At:</span><span class="font-mono text-slate-400 text-[10px]">${a.createdAt ? new Date(a.createdAt).toLocaleString() : 'N/A'}</span></p>
          </div>
        </div>

        <!-- Appointment Audit Trail & Status History -->
        <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-3">
          <h4 class="font-bold text-amber-400 text-[10px] uppercase tracking-wider">Appointment Action History</h4>
          ${auditLogs.length > 0 ? `
            <div class="space-y-2 max-h-40 overflow-y-auto pr-1">
              ${auditLogs.map(log => `
                <div class="p-2 rounded-lg bg-slate-950 border border-slate-800 text-[11px] flex justify-between items-center">
                  <div>
                    <span class="font-mono font-bold text-amber-300">${log.action}</span>
                    <span class="text-slate-400 ml-2">by ${log.userName} (${log.userRole})</span>
                    <p class="text-slate-500 text-[10px]">${log.detail || ''}</p>
                  </div>
                  <span class="text-slate-500 font-mono text-[10px]">${new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
              `).join('')}
            </div>
          ` : `
            <p class="text-slate-500 text-xs italic">Initial booking record (No subsequent modifications recorded).</p>
          `}
        </div>

        <button onclick="this.closest('.fixed').remove()" class="w-full btn btn-secondary py-2.5 text-xs">Close Details</button>
      </div>
    `;
    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
  },

  // ---- ADMIN AUDIT LOGS ----
  async renderAdminAuditLogs() {
    const user = window.clinovaAuth.getCurrentUser();
    if (!this._adminGuard(user)) return;

    const container = document.getElementById('main-content');
    container.innerHTML = `
      <div class="max-w-7xl mx-auto py-8 px-4 space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span class="badge badge-demo mb-2">ADMIN SECURITY CENTER</span>
            <h1 class="text-3xl font-extrabold text-slate-100">Security Audit Log & Activity Monitor</h1>
            <p class="text-xs text-slate-400 mt-1">Immutable, append-only record of all system events, authentication, access control and patient record operations</p>
          </div>
          <button onclick="ClinovaApp.renderAdminAuditLogs()" class="btn btn-secondary text-xs">
            <i data-lucide="refresh-cw" class="w-4 h-4"></i> Refresh Log Stream
          </button>
        </div>

        <!-- Security Summary Cards Grid -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4" id="admin-audit-summary-cards">
          <div class="glass-card p-4 border border-slate-800 space-y-1">
            <div class="flex items-center justify-between">
              <span class="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Logins</span>
              <i data-lucide="log-in" class="w-4 h-4 text-cyan-400"></i>
            </div>
            <p class="text-2xl font-black text-slate-100" id="summary-total-logins">--</p>
            <p class="text-[10px] text-cyan-400 font-mono">Successful User Auth</p>
          </div>

          <div class="glass-card p-4 border border-slate-800 space-y-1">
            <div class="flex items-center justify-between">
              <span class="text-[10px] uppercase font-bold tracking-wider text-slate-400">Failed Logins</span>
              <i data-lucide="shield-alert" class="w-4 h-4 text-amber-400"></i>
            </div>
            <p class="text-2xl font-black text-amber-300" id="summary-failed-logins">--</p>
            <p class="text-[10px] text-amber-400 font-mono">Bad Password / Blocked</p>
          </div>

          <div class="glass-card p-4 border border-slate-800 space-y-1">
            <div class="flex items-center justify-between">
              <span class="text-[10px] uppercase font-bold tracking-wider text-slate-400">Denied Access</span>
              <i data-lucide="shield-off" class="w-4 h-4 text-red-400"></i>
            </div>
            <p class="text-2xl font-black text-red-400" id="summary-denied-access">--</p>
            <p class="text-[10px] text-red-400 font-mono">RBAC / 403 Violations</p>
          </div>

          <div class="glass-card p-4 border border-slate-800 space-y-1">
            <div class="flex items-center justify-between">
              <span class="text-[10px] uppercase font-bold tracking-wider text-slate-400">Record Access</span>
              <i data-lucide="file-text" class="w-4 h-4 text-teal-400"></i>
            </div>
            <p class="text-2xl font-black text-slate-100" id="summary-record-access">--</p>
            <p class="text-[10px] text-teal-400 font-mono">PHI Timeline Accesses</p>
          </div>
        </div>

        <!-- Comprehensive Multi-Filters -->
        <div class="glass-card p-4 border border-slate-800 flex flex-col md:flex-row gap-3 flex-wrap items-center">
          <div class="flex-1 min-w-[180px] w-full">
            <label class="text-[10px] text-slate-400 font-mono block mb-1">User Search</label>
            <input type="text" id="admin-audit-user" placeholder="Search user name or ID..."
              class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs outline-none focus:border-amber-500"
              oninput="ClinovaApp.handleAdminAuditSearch()">
          </div>

          <div class="w-full md:w-auto min-w-[120px]">
            <label class="text-[10px] text-slate-400 font-mono block mb-1">Role</label>
            <select id="admin-audit-role" onchange="ClinovaApp.handleAdminAuditSearch()"
              class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs outline-none focus:border-amber-500">
              <option value="ALL">All Roles</option>
              <option value="PATIENT">PATIENT</option>
              <option value="DOCTOR">DOCTOR</option>
              <option value="ADMIN">ADMIN</option>
              <option value="GUEST">GUEST</option>
            </select>
          </div>

          <div class="w-full md:w-auto min-w-[160px]">
            <label class="text-[10px] text-slate-400 font-mono block mb-1">Action Type</label>
            <select id="admin-audit-action" onchange="ClinovaApp.handleAdminAuditSearch()"
              class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs outline-none focus:border-amber-500">
              <option value="ALL">All Actions</option>
              <option value="LOGIN">LOGIN</option>
              <option value="LOGOUT">LOGOUT</option>
              <option value="REGISTER">REGISTER</option>
              <option value="CHANGE_PASSWORD">CHANGE_PASSWORD</option>
              <option value="FAILED_PASSWORD_CHANGE">FAILED_PASSWORD_CHANGE</option>
              <option value="LOGIN_FAILED">LOGIN_FAILED</option>
              <option value="LOGIN_BLOCKED">LOGIN_BLOCKED</option>
              <option value="DENIED_ACCESS">DENIED_ACCESS</option>
              <option value="PATIENT_RECORD_ACCESS">PATIENT_RECORD_ACCESS</option>
              <option value="UNAUTHORIZED_RECORD_ACCESS">UNAUTHORIZED_RECORD_ACCESS</option>
              <option value="BOOK_APPOINTMENT">BOOK_APPOINTMENT</option>
              <option value="RESCHEDULE_APPOINTMENT">RESCHEDULE_APPOINTMENT</option>
              <option value="CANCEL_APPOINTMENT">CANCEL_APPOINTMENT</option>
              <option value="COMPLETE_CONSULTATION">COMPLETE_CONSULTATION</option>
              <option value="CREATE_MEDICAL_RECORD">CREATE_MEDICAL_RECORD</option>
              <option value="UPDATE_PROFILE">UPDATE_PROFILE</option>
              <option value="TOGGLE_STATUS">TOGGLE_STATUS</option>
              <option value="CREATE_DOCTOR">CREATE_DOCTOR</option>
              <option value="UPDATE_DOCTOR_SCHEDULE">UPDATE_DOCTOR_SCHEDULE</option>
            </select>
          </div>

          <div class="w-full md:w-auto min-w-[130px]">
            <label class="text-[10px] text-slate-400 font-mono block mb-1">Date</label>
            <input type="date" id="admin-audit-date" onchange="ClinovaApp.handleAdminAuditSearch()"
              class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs outline-none focus:border-amber-500">
          </div>

          <div class="w-full md:w-auto min-w-[120px]">
            <label class="text-[10px] text-slate-400 font-mono block mb-1">Result</label>
            <select id="admin-audit-result" onchange="ClinovaApp.handleAdminAuditSearch()"
              class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs outline-none focus:border-amber-500">
              <option value="ALL">All Outcomes</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="FAILED">FAILED</option>
              <option value="DENIED">DENIED</option>
              <option value="BLOCKED">BLOCKED</option>
            </select>
          </div>

          <div class="w-full md:w-auto self-end">
            <button onclick="ClinovaApp.clearAdminAuditFilters()" class="btn btn-secondary text-xs px-4 py-2 w-full md:w-auto">
              <i data-lucide="x" class="w-3.5 h-3.5"></i> Clear
            </button>
          </div>
        </div>

        <div class="glass-card border border-slate-800 overflow-x-auto">
          <div id="admin-audit-table-wrap">
            <div class="skeleton h-64 w-full rounded-xl m-4"></div>
          </div>
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    await this._loadAdminAuditTable(user);
  },

  async _loadAdminAuditTable(user) {
    const userFilter = document.getElementById('admin-audit-user')?.value || '';
    const roleFilter = document.getElementById('admin-audit-role')?.value || 'ALL';
    const actionFilter = document.getElementById('admin-audit-action')?.value || 'ALL';
    const dateFilter = document.getElementById('admin-audit-date')?.value || '';
    const resultFilter = document.getElementById('admin-audit-result')?.value || 'ALL';

    const res = await window.clinovaAPI.getAuditLogs(user, {
      user: userFilter,
      role: roleFilter,
      action: actionFilter,
      date: dateFilter,
      result: resultFilter
    });

    const wrap = document.getElementById('admin-audit-table-wrap');
    if (!wrap) return;

    if (!res.success) {
      wrap.innerHTML = `<p class="p-6 text-red-400 text-sm font-bold">Access Denied: ${res.message}</p>`;
      return;
    }

    const { logs, summary } = res.data;

    // Update Summary Cards
    const elLogins = document.getElementById('summary-total-logins');
    const elFailed = document.getElementById('summary-failed-logins');
    const elDenied = document.getElementById('summary-denied-access');
    const elRecord = document.getElementById('summary-record-access');

    if (elLogins) elLogins.textContent = summary.totalLogins || 0;
    if (elFailed) elFailed.textContent = summary.failedLogins || 0;
    if (elDenied) elDenied.textContent = summary.deniedAccess || 0;
    if (elRecord) elRecord.textContent = summary.patientRecordAccess || 0;

    if (logs.length === 0) {
      wrap.innerHTML = `
        <div class="p-12 text-center space-y-3">
          <i data-lucide="shield-check" class="w-12 h-12 text-slate-600 mx-auto"></i>
          <p class="text-slate-400 font-bold">No audit events match the selected security filters.</p>
          <button onclick="ClinovaApp.clearAdminAuditFilters()" class="btn btn-secondary text-xs">Reset All Filters</button>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    wrap.innerHTML = `
      <table class="w-full text-xs">
        <thead>
          <tr class="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
            <th class="px-4 py-3 text-left font-bold">Timestamp</th>
            <th class="px-4 py-3 text-left font-bold">User</th>
            <th class="px-4 py-3 text-left font-bold">Role</th>
            <th class="px-4 py-3 text-left font-bold">Action</th>
            <th class="px-4 py-3 text-left font-bold hidden md:table-cell">Target</th>
            <th class="px-4 py-3 text-left font-bold hidden lg:table-cell">IP Address</th>
            <th class="px-4 py-3 text-left font-bold hidden lg:table-cell">Details</th>
            <th class="px-4 py-3 text-left font-bold">Result</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800/60">
          ${logs.map(l => this._renderAuditLogTableRow(l)).join('')}
        </tbody>
      </table>
      <div class="px-4 py-3 border-t border-slate-800 text-xs text-slate-500 font-mono flex justify-between items-center">
        <span>Showing ${logs.length} audit log event${logs.length !== 1 ? 's' : ''}</span>
        <span class="text-[10px] text-cyan-400">🔒 Append-Only Security Stream</span>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  },

  async handleAdminAuditSearch() {
    const user = window.clinovaAuth.getCurrentUser();
    if (!this._adminGuard(user)) return;
    const wrap = document.getElementById('admin-audit-table-wrap');
    if (wrap) wrap.innerHTML = `<div class="skeleton h-32 w-full rounded-xl m-4"></div>`;
    await this._loadAdminAuditTable(user);
  },

  clearAdminAuditFilters() {
    const u = document.getElementById('admin-audit-user');
    const r = document.getElementById('admin-audit-role');
    const a = document.getElementById('admin-audit-action');
    const d = document.getElementById('admin-audit-date');
    const res = document.getElementById('admin-audit-result');
    if (u) u.value = '';
    if (r) r.value = 'ALL';
    if (a) a.value = 'ALL';
    if (d) d.value = '';
    if (res) res.value = 'ALL';
    this.handleAdminAuditSearch();
  },

  _renderAuditLogRow(l) {
    const ts = l.timestamp ? new Date(l.timestamp).toLocaleString() : 'N/A';
    const isBlocked = l.result === 'BLOCKED' || l.result === 'DENIED' || l.status === 'BLOCKED' || l.status === 'DENIED';
    return `
      <div class="flex items-start gap-3 p-3 rounded-xl bg-slate-900 border ${isBlocked ? 'border-red-500/40' : 'border-slate-800'} text-xs">
        <div class="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isBlocked ? 'bg-red-500/20 text-red-400' : 'bg-cyan-500/20 text-cyan-400'}">
          <i data-lucide="${isBlocked ? 'shield-alert' : 'shield'}" class="w-3.5 h-3.5"></i>
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-bold ${isBlocked ? 'text-red-300' : 'text-slate-200'}">${l.action}</p>
          <p class="text-slate-400 text-[10px] truncate">${l.userName} (${l.role || l.userRole}) — ${l.detail || l.metadata || ''}</p>
          <p class="text-slate-600 text-[10px] font-mono">${ts} • IP: ${l.ip || '127.0.0.1'}</p>
        </div>
      </div>
    `;
  },

  _renderAuditLogTableRow(l) {
    const ts = l.timestamp ? new Date(l.timestamp).toLocaleString() : 'N/A';
    const outcome = l.result || l.status || 'SUCCESS';
    const isBlocked = outcome === 'BLOCKED' || outcome === 'DENIED' || outcome === 'FAILED';
    const isSuccess = outcome === 'SUCCESS';

    let badgeClass = 'bg-teal-500/20 text-teal-400 border-teal-500/30';
    if (outcome === 'DENIED') badgeClass = 'bg-red-500/20 text-red-400 border-red-500/30';
    if (outcome === 'BLOCKED') badgeClass = 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    if (outcome === 'FAILED') badgeClass = 'bg-amber-500/20 text-amber-400 border-amber-500/30';

    return `
      <tr class="hover:bg-slate-900/60 transition ${isBlocked ? 'bg-red-950/10' : ''}">
        <td class="px-4 py-3 font-mono text-slate-400 text-[10px] whitespace-nowrap">${ts}</td>
        <td class="px-4 py-3">
          <p class="font-bold text-slate-200">${l.userName || 'System'}</p>
          <p class="text-slate-500 text-[10px]">${l.userId || ''}</p>
        </td>
        <td class="px-4 py-3">
          <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">${l.role || l.userRole || 'GUEST'}</span>
        </td>
        <td class="px-4 py-3">
          <span class="font-mono font-bold text-[10px] px-2 py-0.5 rounded-lg ${isBlocked ? 'bg-red-500/20 text-red-400' : 'bg-cyan-500/20 text-cyan-400'}">${l.action}</span>
        </td>
        <td class="px-4 py-3 hidden md:table-cell">
          <p class="text-slate-300 font-mono text-[10px]">${l.target || (l.resource ? `${l.resource}:${l.resourceId || 'ALL'}` : 'System')}</p>
        </td>
        <td class="px-4 py-3 font-mono text-slate-400 text-[10px] hidden lg:table-cell">${l.ip || '127.0.0.1'}</td>
        <td class="px-4 py-3 text-slate-400 hidden lg:table-cell max-w-[180px] truncate" title="${l.metadata || l.detail || ''}">${l.metadata || l.detail || '—'}</td>
        <td class="px-4 py-3">
          <span class="px-2 py-0.5 rounded text-[10px] font-extrabold border ${badgeClass}">${outcome}</span>
        </td>
      </tr>
    `;
  },

  // ---- ADMIN NOTIFICATIONS (Bell for admin) ----
  toggleAdminNotificationDropdown() {
    const dd = document.getElementById('admin-notif-dropdown');
    if (dd) dd.classList.toggle('hidden');
  }
};

window.ClinovaApp = ClinovaApp;

