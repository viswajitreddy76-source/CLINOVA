/**
 * CLINOVA - Authentication & Role-Based Session Manager
 * Manages active user sessions, role security guards, and authorization state.
 */

const SESSION_STORAGE_KEY = 'clinova_active_session';

class ClinovaAuth {
  constructor() {
    this.session = null;
    this.init();
  }

  init() {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.expiresAt && new Date(parsed.expiresAt).getTime() < Date.now()) {
          console.warn('Session expired.');
          this.clearSession();
        } else {
          this.session = parsed;
        }
      } catch (e) {
        this.session = null;
      }
    }
  }

  setSession(sessionData) {
    this.session = sessionData;
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    window.dispatchEvent(new CustomEvent('clinova-auth-change', { detail: sessionData }));
  }

  clearSession() {
    if (this.session) {
      window.clinovaAPI.logout(this.session);
    }
    this.session = null;
    localStorage.removeItem(SESSION_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('clinova-auth-change', { detail: null }));
  }

  isAuthenticated() {
    return !!this.session && !!this.session.token;
  }

  getCurrentUser() {
    return this.session;
  }

  getRole() {
    return this.session ? this.session.role : 'GUEST';
  }

  hasRole(requiredRole) {
    if (!this.session) return false;
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(this.session.role);
    }
    return this.session.role === requiredRole;
  }

  // Pre-configured Quick Demo Credentials Switcher
  async loginAsDemo(role = 'PATIENT') {
    let email = 'patient@clinova.demo';
    let password = 'Patient@123';

    if (role === 'DOCTOR') {
      email = 'doctor@clinova.demo';
      password = 'Doctor@123';
    } else if (role === 'ADMIN') {
      email = 'admin@clinova.demo';
      password = 'Admin@123';
    }

    const res = await window.clinovaAPI.login(email, password);
    if (res.success) {
      this.setSession(res.data.session);
      return res;
    }
    return res;
  }
}

window.clinovaAuth = new ClinovaAuth();
