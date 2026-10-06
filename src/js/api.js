/**
 * CLINOVA - REST API Service Layer & Input Validator (Stage 4 Admin System Complete)
 * Implements clean backend endpoints, RBAC middleware checks, and Zod-style validations.
 */

class ClinovaAPI {
  constructor() {
    this.db = window.clinovaDB;
    this.loginAttempts = {}; // { email: { count: number, lockUntil: number } }
  }

  async _delay(ms = 150) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  _success(data, message = 'Operation successful') {
    return { success: true, data, message };
  }

  _error(message = 'An error occurred', statusCode = 400) {
    return { success: false, message, statusCode };
  }

  // --- SECURITY HELPERS ---

  _verifySession(currentUser, requiredRole = null) {
    if (!currentUser || !currentUser.token) {
      return { valid: false, error: this._error('Authentication required. Please log in.', 401) };
    }
    if (this.db.isTokenInvalidated(currentUser.token)) {
      return { valid: false, error: this._error('Session invalidated. Please log in again.', 401) };
    }
    if (currentUser.expiresAt && new Date(currentUser.expiresAt).getTime() < Date.now()) {
      return { valid: false, error: this._error('Session expired. Please log in again.', 401) };
    }
    if (requiredRole) {
      const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      if (!allowedRoles.includes(currentUser.role)) {
        this.db.logAudit(
          currentUser.userId,
          currentUser.fullName,
          currentUser.role,
          'DENIED_ACCESS',
          'SystemResource',
          allowedRoles.join(','),
          'DENIED',
          `Attempted access without ${allowedRoles.join('/')} privileges`,
          '127.0.0.1'
        );
        return { valid: false, error: this._error('403 — Privilege restriction. Access denied.', 403) };
      }
    }
    return { valid: true };
  }

  _sanitize(input) {
    if (typeof input !== 'string') return input;
    return input.replace(/[<>&'"]/g, char => {
      switch (char) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case "'": return '&#39;';
        case '"': return '&quot;';
        default: return char;
      }
    }).trim();
  }

  _checkRateLimit(emailKey) {
    const now = Date.now();
    const record = this.loginAttempts[emailKey];
    if (record) {
      if (record.lockUntil && now < record.lockUntil) {
        const remainingSec = Math.ceil((record.lockUntil - now) / 1000);
        return { locked: true, remainingSec };
      }
      if (record.lockUntil && now >= record.lockUntil) {
        delete this.loginAttempts[emailKey];
      }
    }
    return { locked: false };
  }

  _recordFailedLogin(emailKey) {
    const now = Date.now();
    if (!this.loginAttempts[emailKey]) {
      this.loginAttempts[emailKey] = { count: 1, lockUntil: 0 };
    } else {
      this.loginAttempts[emailKey].count += 1;
    }

    if (this.loginAttempts[emailKey].count >= 5) {
      this.loginAttempts[emailKey].lockUntil = now + (3 * 60 * 1000); // 3-minute temporary lockout
    }
  }

  _clearLoginAttempts(emailKey) {
    delete this.loginAttempts[emailKey];
  }

  // --- AUTHENTICATION & SESSION API ---

  async login(email, password) {
    await this._delay(200);
    if (!email || !password) return this._error('Email and password are required.', 400);

    const cleanEmail = this._sanitize(email).toLowerCase();
    const rateCheck = this._checkRateLimit(cleanEmail);
    if (rateCheck.locked) {
      this.db.logAudit('GUEST', 'Anonymous', 'GUEST', 'LOGIN_BLOCKED', 'AuthService', cleanEmail, 'BLOCKED', `Account locked due to rate limit. Retry in ${rateCheck.remainingSec}s`, '127.0.0.1');
      return this._error(`Too many failed login attempts. Account temporarily locked for ${rateCheck.remainingSec} seconds.`, 429);
    }

    const user = this.db.findOne('users', u => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      this._recordFailedLogin(cleanEmail);
      this.db.logAudit('GUEST', 'Anonymous', 'GUEST', 'LOGIN_FAILED', 'AuthService', cleanEmail, 'FAILED', 'Invalid credentials attempt', '127.0.0.1');
      return this._error('Invalid email or password.', 401);
    }

    // Verify password with Argon2 / Bcrypt crypto service
    const isPasswordValid = await window.ClinovaCrypto.verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      this._recordFailedLogin(cleanEmail);
      this.db.logAudit(user.id, user.fullName, user.role, 'LOGIN_FAILED', 'AuthService', cleanEmail, 'FAILED', 'Invalid credentials attempt', '127.0.0.1');
      return this._error('Invalid email or password.', 401);
    }

    if (!user.isActive) {
      this.db.logAudit(user.id, user.fullName, user.role, 'LOGIN_FAILED', 'AuthService', cleanEmail, 'DENIED', 'Deactivated account login attempt', '127.0.0.1');
      return this._error('Account deactivated. Please contact support.', 403);
    }

    // Upgrade legacy password hash to Argon2 if needed
    if (!user.passwordHash.startsWith('$argon2id$')) {
      const hashed = await window.ClinovaCrypto.hashPassword(password);
      this.db.update('users', 'id', user.id, { passwordHash: hashed });
    }

    this._clearLoginAttempts(cleanEmail);

    // Cryptographically resilient session token & expiry (8 hours)
    const token = 'sess_' + Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, '0')).join('');
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();

    const session = {
      token,
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      patientId: user.patientId || null,
      doctorId: user.doctorId || null,
      loggedInAt: new Date().toISOString(),
      expiresAt
    };

    // Sanitize user output to never leak hashes or private credentials
    const safeUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      patientId: user.patientId || null,
      doctorId: user.doctorId || null,
      isActive: user.isActive
    };

    this.db.logAudit(user.id, user.fullName, user.role, 'LOGIN', 'AuthService', user.email, 'SUCCESS', 'Authenticated via Argon2 secure API', '127.0.0.1');
    return this._success({ session, user: safeUser });
  }

  async loginWithGoogle(googleJwtToken) {
    await this._delay(200);
    if (!googleJwtToken) return this._error('Google authentication token is required.', 400);

    let payload = null;
    try {
      const base64Url = googleJwtToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      payload = JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Failed to parse Google JWT credential:', e);
      return this._error('Invalid Google authentication payload.', 400);
    }

    if (!payload || !payload.email) {
      return this._error('Unable to extract user profile from Google Identity token.', 400);
    }

    const cleanEmail = this._sanitize(payload.email).toLowerCase().trim();
    const fullName = this._sanitize(payload.name || payload.given_name || 'Google User');

    let user = this.db.findOne('users', u => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      // Auto-register new Patient using Google SSO Profile
      const newPatientNum = 10249 + this.db.get('patients').length;
      const patientId = `PT-${newPatientNum}`;
      const userId = `usr-google-${Date.now()}`;
      const dummyPassHash = await window.ClinovaCrypto.hashPassword('GoogleOAuth_' + Date.now());

      user = {
        id: userId,
        email: cleanEmail,
        passwordHash: dummyPassHash,
        role: 'PATIENT',
        patientId,
        fullName,
        googleSub: payload.sub,
        picture: payload.picture || null,
        createdAt: new Date().toISOString(),
        isActive: true
      };
      this.db.insert('users', user);

      const newPatient = {
        id: patientId,
        userId,
        patientId,
        fullName,
        dateOfBirth: '2000-01-01',
        age: 26,
        gender: 'Other',
        phone: '+1 (555) 000-GOOGLE',
        email: cleanEmail,
        address: 'Google OAuth Authenticated User',
        bloodGroup: 'O+',
        allergies: ['None listed (Synthetic)'],
        existingConditions: ['None listed (Synthetic)'],
        currentMedications: ['None listed (Synthetic)'],
        emergencyContactName: 'Google Contact',
        emergencyContactRelationship: 'Family',
        emergencyContactPhone: '+1 (555) 000-9999',
        healthSnapshot: {
          bloodPressure: '120/80 mmHg',
          heartRate: '72 bpm',
          bmi: '22.0 kg/m²',
          temperature: '98.6 °F',
          updatedAt: new Date().toISOString().split('T')[0]
        },
        status: 'Active',
        lastVisit: 'Google SSO Initial Login'
      };
      this.db.insert('patients', newPatient);

      this.db.logAudit(userId, fullName, 'PATIENT', 'REGISTER', 'PatientProfile', patientId, 'SUCCESS', `Created patient profile via Google SSO (${cleanEmail})`, '127.0.0.1');
    }

    if (!user.isActive) {
      this.db.logAudit(user.id, user.fullName, user.role, 'LOGIN_FAILED', 'AuthService', cleanEmail, 'DENIED', 'Deactivated Google account login attempt', '127.0.0.1');
      return this._error('Account deactivated. Please contact support.', 403);
    }

    const token = 'sess_' + Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, '0')).join('');
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();

    const session = {
      token,
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      patientId: user.patientId || null,
      doctorId: user.doctorId || null,
      authProvider: 'GOOGLE_OAUTH_2.0',
      loggedInAt: new Date().toISOString(),
      expiresAt
    };

    const safeUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      patientId: user.patientId || null,
      doctorId: user.doctorId || null,
      isActive: user.isActive
    };

    this.db.logAudit(user.id, user.fullName, user.role, 'LOGIN', 'AuthService', user.email, 'SUCCESS', 'Authenticated via Google Identity OAuth 2.0', '127.0.0.1');
    return this._success({ session, user: safeUser });
  }

  async loginWithGoogleDemoAccount(email = 'viswajitreddy76@gmail.com', name = 'Viswajit Reddy') {
    await this._delay(200);
    const cleanEmail = this._sanitize(email).toLowerCase().trim();
    const fullName = this._sanitize(name);

    let user = this.db.findOne('users', u => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      const newPatientNum = 10249 + this.db.get('patients').length;
      const patientId = `PT-${newPatientNum}`;
      const userId = `usr-google-${Date.now()}`;
      const dummyPassHash = await window.ClinovaCrypto.hashPassword('GoogleOAuth_' + Date.now());

      user = {
        id: userId,
        email: cleanEmail,
        passwordHash: dummyPassHash,
        role: 'PATIENT',
        patientId,
        fullName,
        googleSub: 'google-sub-' + Date.now(),
        createdAt: new Date().toISOString(),
        isActive: true
      };
      this.db.insert('users', user);

      const newPatient = {
        id: patientId,
        userId,
        patientId,
        fullName,
        dateOfBirth: '2000-01-01',
        age: 26,
        gender: 'Male',
        phone: '+1 (555) 777-GOOGLE',
        email: cleanEmail,
        address: 'Google Authenticated Patient Account',
        bloodGroup: 'O+',
        allergies: ['None listed (Synthetic)'],
        existingConditions: ['None listed (Synthetic)'],
        currentMedications: ['None listed (Synthetic)'],
        emergencyContactName: 'Google Contact',
        emergencyContactRelationship: 'Family',
        emergencyContactPhone: '+1 (555) 000-9999',
        healthSnapshot: {
          bloodPressure: '120/80 mmHg',
          heartRate: '72 bpm',
          bmi: '22.4 kg/m²',
          temperature: '98.6 °F',
          updatedAt: new Date().toISOString().split('T')[0]
        },
        status: 'Active',
        lastVisit: 'Google OAuth Single Sign-On'
      };
      this.db.insert('patients', newPatient);

      this.db.logAudit(userId, fullName, 'PATIENT', 'REGISTER', 'PatientProfile', patientId, 'SUCCESS', `Created patient via Google SSO Sandbox (${cleanEmail})`, '127.0.0.1');
    }

    if (!user.isActive) {
      return this._error('Account deactivated. Please contact support.', 403);
    }

    const token = 'sess_' + Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, '0')).join('');
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();

    const session = {
      token,
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      patientId: user.patientId || null,
      doctorId: user.doctorId || null,
      authProvider: 'GOOGLE_OAUTH_2.0_SANDBOX',
      loggedInAt: new Date().toISOString(),
      expiresAt
    };

    const safeUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      patientId: user.patientId || null,
      doctorId: user.doctorId || null,
      isActive: user.isActive
    };

    this.db.logAudit(user.id, user.fullName, user.role, 'LOGIN', 'AuthService', user.email, 'SUCCESS', 'Authenticated via Google Identity OAuth 2.0 (viswajitreddy76@gmail.com)', '127.0.0.1');
    return this._success({ session, user: safeUser });
  }

  async logout(currentUser) {
    await this._delay(100);
    if (currentUser && currentUser.token) {
      this.db.invalidateToken(currentUser.token, currentUser.userId);
      this.db.logAudit(
        currentUser.userId,
        currentUser.fullName,
        currentUser.role,
        'LOGOUT',
        'AuthService',
        currentUser.email,
        'SUCCESS',
        'User logged out and session invalidated',
        '127.0.0.1'
      );
    }
    return this._success(null, 'Logged out successfully.');
  }

  async registerPatient(formData) {
    await this._delay(300);
    const { fullName, email, phone, dateOfBirth, gender, password, confirmPassword } = formData;

    if (!fullName || fullName.trim().length < 3) return this._error('Full Name must be at least 3 characters.');
    if (!email || !email.includes('@')) return this._error('Please provide a valid email address.');
    if (!password || password.length < 6) return this._error('Password must be at least 6 characters long.');
    if (password !== confirmPassword) return this._error('Passwords do not match.');

    const existingUser = this.db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) return this._error('An account with this email already exists.', 409);

    const passwordHash = await window.ClinovaCrypto.hashPassword(password);
    const newPatientNum = 10249 + this.db.get('patients').length;
    const patientId = `PT-${newPatientNum}`;
    const userId = `usr-patient-${Date.now()}`;

    const newUser = {
      id: userId,
      email,
      passwordHash,
      role: 'PATIENT',
      patientId,
      fullName,
      createdAt: new Date().toISOString(),
      isActive: true
    };
    this.db.insert('users', newUser);

    const dobDate = new Date(dateOfBirth);
    const age = Math.floor((Date.now() - dobDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)) || 25;

    const newPatient = {
      id: patientId,
      userId,
      patientId,
      fullName,
      dateOfBirth,
      age,
      gender: gender || 'Other',
      phone: phone || '+1 (555) 000-0000',
      email,
      address: '742 Cyber Avenue, Tech City',
      bloodGroup: 'O+',
      allergies: ['None listed (Synthetic)'],
      existingConditions: ['None listed (Synthetic)'],
      currentMedications: ['None listed (Synthetic)'],
      emergencyContactName: 'Emergency Contact',
      emergencyContactRelationship: 'Family',
      emergencyContactPhone: '+1 (555) 000-9999',
      healthSnapshot: {
        bloodPressure: '120/80 mmHg',
        heartRate: '72 bpm',
        bmi: '22.0 kg/m²',
        temperature: '98.6 °F',
        updatedAt: new Date().toISOString().split('T')[0]
      },
      status: 'Active',
      lastVisit: 'First Registration'
    };
    this.db.insert('patients', newPatient);

    this.db.logAudit(userId, fullName, 'PATIENT', 'REGISTER', 'PatientProfile', patientId, 'SUCCESS', 'New synthetic patient created with Argon2 security', '127.0.0.1');
    return this.login(email, password);
  }

  // --- PATIENT PROFILE ENDPOINTS ---

  async getPatientProfile(currentUser) {
    await this._delay(150);
    const authCheck = this._verifySession(currentUser);
    if (!authCheck.valid) return authCheck.error;

    if (currentUser.role !== 'PATIENT' && currentUser.role !== 'ADMIN') {
      return this._error('Access denied. Patient authorization required.', 403);
    }
    const patientId = currentUser.role === 'PATIENT' ? currentUser.patientId : (currentUser.patientId || 'PT-10245');
    const patient = this.db.findOne('patients', p => p.patientId === patientId);
    if (!patient) return this._error('Patient profile not found.', 404);
    return this._success(patient);
  }

  async updatePatientProfile(currentUser, profileData) {
    await this._delay(200);
    const authCheck = this._verifySession(currentUser);
    if (!authCheck.valid) return authCheck.error;

    if (currentUser.role !== 'PATIENT' && currentUser.role !== 'ADMIN') {
      return this._error('Access denied. Patient authorization required.', 403);
    }

    const patientId = currentUser.patientId;
    const patient = this.db.findOne('patients', p => p.patientId === patientId);
    if (!patient) return this._error('Patient profile not found.', 404);

    const { fullName, phone, dateOfBirth, gender, address, emergencyContactName, emergencyContactRelationship, emergencyContactPhone, bloodGroup } = profileData;

    if (!fullName || fullName.trim().length < 3) return this._error('Full Name must be at least 3 characters.');
    if (!phone || phone.trim().length < 7) return this._error('Please provide a valid phone number.');
    if (!dateOfBirth) return this._error('Please select a valid Date of Birth.');
    if (!address || address.trim().length < 5) return this._error('Address must be at least 5 characters.');
    if (!emergencyContactName || emergencyContactName.trim().length < 3) return this._error('Emergency Contact Name must be at least 3 characters.');
    if (!emergencyContactRelationship || !emergencyContactRelationship.trim()) return this._error('Emergency Contact Relationship is required.');
    if (!emergencyContactPhone || emergencyContactPhone.trim().length < 7) return this._error('Please provide a valid Emergency Contact Phone.');

    const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const bg = bloodGroup && validBloodGroups.includes(bloodGroup) ? bloodGroup : patient.bloodGroup;

    const dobDate = new Date(dateOfBirth);
    const age = Math.floor((Date.now() - dobDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)) || patient.age;

    const updatedPatient = this.db.update('patients', 'patientId', patientId, {
      fullName: fullName.trim(),
      phone: phone.trim(),
      dateOfBirth,
      age,
      gender: gender || patient.gender,
      address: address.trim(),
      emergencyContactName: emergencyContactName.trim(),
      emergencyContactRelationship: emergencyContactRelationship.trim(),
      emergencyContactPhone: emergencyContactPhone.trim(),
      bloodGroup: bg
    });

    // Sync full name in user record and session
    this.db.update('users', 'id', currentUser.userId, { fullName: fullName.trim() });

    this.db.logAudit(currentUser.userId, currentUser.fullName, currentUser.role, 'UPDATE_PROFILE', 'PatientProfile', patientId, 'SUCCESS', 'Updated profile & emergency contact info', '127.0.0.1');

    return this._success(updatedPatient, 'Profile updated successfully.');
  }

  async changePassword(currentUser, passwordData) {
    await this._delay(200);
    const authCheck = this._verifySession(currentUser);
    if (!authCheck.valid) return authCheck.error;

    const { currentPassword, newPassword, confirmPassword } = passwordData;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return this._error('Please complete all password fields.', 400);
    }

    const user = this.db.findOne('users', u => u.id === currentUser.userId);
    if (!user) return this._error('User account not found.', 404);

    const isCurrentValid = await window.ClinovaCrypto.verifyPassword(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      this.db.logAudit(currentUser.userId, currentUser.fullName, currentUser.role, 'FAILED_PASSWORD_CHANGE', 'UserAccount', user.id, 'FAILED', 'Incorrect current password provided', '127.0.0.1');
      return this._error('Current password is incorrect.', 400);
    }

    if (newPassword.length < 6) {
      return this._error('New password must be at least 6 characters long.', 400);
    }

    if (newPassword !== confirmPassword) {
      return this._error('New password and confirmation do not match.', 400);
    }

    const newHash = await window.ClinovaCrypto.hashPassword(newPassword);
    this.db.update('users', 'id', user.id, { passwordHash: newHash });

    this.db.logAudit(currentUser.userId, currentUser.fullName, currentUser.role, 'CHANGE_PASSWORD', 'UserAccount', user.id, 'SUCCESS', 'Password updated with Argon2 hash', '127.0.0.1');

    return this._success(null, 'Password updated successfully.');
  }

  // --- DOCTOR ENDPOINTS ---

  async getDoctors(filters = {}) {
    await this._delay(100);
    let doctors = this.db.get('doctors');

    // Default to active doctors unless explicitly requested (e.g., admin view)
    if (!filters.includeInactive) {
      doctors = doctors.filter(d => d.status === 'Active' && d.availability !== 'Unavailable');
    }

    // Filter by search query (Name or Specialization)
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      doctors = doctors.filter(d => 
        d.fullName.toLowerCase().includes(q) ||
        d.doctorId.toLowerCase().includes(q) ||
        d.specialization.toLowerCase().includes(q) ||
        d.bio.toLowerCase().includes(q)
      );
    }

    // Filter by Specialization
    if (filters.specialization && filters.specialization !== 'ALL') {
      doctors = doctors.filter(d => d.specialization.toLowerCase() === filters.specialization.toLowerCase());
    }

    // Filter by Experience range
    if (filters.experience && filters.experience !== 'ALL') {
      doctors = doctors.filter(d => {
        const yrs = parseInt(d.experience, 10) || 0;
        if (filters.experience === '1-5') return yrs >= 1 && yrs <= 5;
        if (filters.experience === '5-10') return yrs > 5 && yrs <= 10;
        if (filters.experience === '10+') return yrs > 10;
        return true;
      });
    }

    // Filter by Availability status
    if (filters.availability && filters.availability !== 'ALL') {
      doctors = doctors.filter(d => (d.availability || 'Available').toLowerCase() === filters.availability.toLowerCase());
    }

    // Filter by Minimum Rating
    if (filters.minRating && filters.minRating !== 'ALL') {
      const minR = parseFloat(filters.minRating);
      if (!isNaN(minR)) {
        doctors = doctors.filter(d => (d.rating || 0) >= minR);
      }
    }

    // Sorting
    if (filters.sortBy) {
      if (filters.sortBy === 'rating_desc') {
        doctors.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      } else if (filters.sortBy === 'experience_desc') {
        doctors.sort((a, b) => (parseInt(b.experience, 10) || 0) - (parseInt(a.experience, 10) || 0));
      } else if (filters.sortBy === 'available_first') {
        doctors.sort((a, b) => {
          const availA = (a.availability || '').toLowerCase() === 'available' ? 1 : 0;
          const availB = (b.availability || '').toLowerCase() === 'available' ? 1 : 0;
          return availB - availA;
        });
      } else if (filters.sortBy === 'name_asc') {
        doctors.sort((a, b) => a.fullName.localeCompare(b.fullName));
      }
    }

    return this._success(doctors);
  }

  async getDoctorProfile(currentUser) {
    await this._delay(100);
    if (currentUser.role !== 'DOCTOR' && currentUser.role !== 'ADMIN') {
      return this._error('Access denied. Doctor authorization required.', 403);
    }
    const doctor = this.db.findOne('doctors', d => d.doctorId === currentUser.doctorId);
    if (!doctor) return this._error('Doctor profile not found.', 404);
    return this._success(doctor);
  }

  async updateDoctorProfile(currentUser, profileData) {
    await this._delay(200);
    if (currentUser.role !== 'DOCTOR' && currentUser.role !== 'ADMIN') {
      return this._error('Access denied.', 403);
    }

    const updated = this.db.update('doctors', 'doctorId', currentUser.doctorId, profileData);
    this.db.logAudit(currentUser.userId, currentUser.fullName, currentUser.role, 'UPDATE_DOCTOR_PROFILE', 'DoctorProfile', currentUser.doctorId, 'SUCCESS', 'Doctor updated profile');
    return this._success(updated, 'Doctor profile updated successfully.');
  }

  async getDoctorDashboardStats(currentUser) {
    await this._delay(150);
    if (!currentUser || (currentUser.role !== 'DOCTOR' && currentUser.role !== 'ADMIN')) {
      return this._error('Access denied. Doctor authorization required.', 403);
    }

    const doctorId = currentUser.role === 'DOCTOR' ? currentUser.doctorId : (currentUser.doctorId || 'DR-8801');
    const doctorAppts = this.db.filter('appointments', a => a.doctorId === doctorId);

    const todayStr = new Date().toISOString().split('T')[0];
    const todayAppointments = doctorAppts.filter(a => a.date === todayStr || a.status === 'CONFIRMED' || a.status === 'WAITING').length;
    const pendingCount = doctorAppts.filter(a => a.status === 'CONFIRMED' || a.status === 'WAITING' || a.status === 'PENDING').length;
    const completedCount = doctorAppts.filter(a => a.status === 'COMPLETED').length;
    const cancelledCount = doctorAppts.filter(a => a.status === 'CANCELLED').length;
    
    const patientIds = new Set(doctorAppts.map(a => a.patientId));
    const totalPatientsCount = patientIds.size;

    return this._success({
      todayAppointments,
      pendingCount,
      completedCount,
      cancelledCount,
      totalPatientsCount
    });
  }

  async updateDoctorSchedule(currentUser, scheduleData) {
    await this._delay(200);
    if (!currentUser || (currentUser.role !== 'DOCTOR' && currentUser.role !== 'ADMIN')) {
      return this._error('Access denied. Doctor authorization required.', 403);
    }

    const doctorId = currentUser.role === 'DOCTOR' ? currentUser.doctorId : currentUser.doctorId;
    const { availability, availabilityStatus, availableSlots } = scheduleData;

    const updated = this.db.update('doctors', 'doctorId', doctorId, {
      availability: availability || 'Available',
      availabilityStatus: availabilityStatus || 'Available Today',
      availableSlots: availableSlots || []
    });

    this.db.logAudit(currentUser.userId, currentUser.fullName, currentUser.role, 'UPDATE_DOCTOR_SCHEDULE', 'DoctorProfile', doctorId, 'SUCCESS', `Updated schedule availability to ${availabilityStatus}`);

    return this._success(updated, 'Schedule and availability updated successfully.');
  }

  async getDoctorPatients(currentUser, search = '') {
    await this._delay(150);
    if (!currentUser || (currentUser.role !== 'DOCTOR' && currentUser.role !== 'ADMIN')) {
      return this._error('Access denied. Doctor authorization required.', 403);
    }

    const doctorId = currentUser.role === 'DOCTOR' ? currentUser.doctorId : currentUser.doctorId;
    const doctorAppts = this.db.filter('appointments', a => a.doctorId === doctorId);

    const patientMap = new Map();
    doctorAppts.forEach(a => {
      if (!patientMap.has(a.patientId)) {
        const patient = this.db.findOne('patients', p => p.patientId === a.patientId);
        if (patient) {
          patientMap.set(a.patientId, {
            ...patient,
            lastVisitWithDoctor: a.date,
            totalVisitsWithDoctor: 1
          });
        }
      } else {
        const existing = patientMap.get(a.patientId);
        existing.totalVisitsWithDoctor += 1;
        if (new Date(a.date) > new Date(existing.lastVisitWithDoctor)) {
          existing.lastVisitWithDoctor = a.date;
        }
      }
    });

    let patients = Array.from(patientMap.values());
    if (search) {
      const q = search.toLowerCase().trim();
      patients = patients.filter(p => 
        p.fullName.toLowerCase().includes(q) ||
        p.patientId.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.phone.toLowerCase().includes(q)
      );
    }

    return this._success(patients);
  }

  // --- AUTHORIZED PATIENT VIEW ---

  async getAuthorizedPatientData(currentUser, appointmentId, patientId) {
    await this._delay(200);
    if (currentUser.role !== 'DOCTOR' && currentUser.role !== 'ADMIN') {
      return this._error('Access denied. Only authorized medical staff can access patient profiles.', 403);
    }

    if (currentUser.role === 'DOCTOR') {
      const assignment = this.db.findOne('appointments', a => a.doctorId === currentUser.doctorId && a.patientId === patientId);
      if (!assignment) {
        return this._error('Access denied. You are not assigned to an active appointment with this patient.', 403);
      }
    }

    const patient = this.db.findOne('patients', p => p.patientId === patientId);
    if (!patient) return this._error('Patient not found.', 404);

    const prevVisits = this.db.filter('medicalRecords', r => r.patientId === patientId);
    this.db.logAudit(currentUser.userId, currentUser.fullName, currentUser.role, 'VIEW_AUTHORIZED_PATIENT', 'PatientProfile', patientId, 'SUCCESS', 'Accessed authorized patient record');

    return this._success({ patient, previousVisits: prevVisits });
  }

  // --- APPOINTMENT ENDPOINTS ---

  async getAppointments(currentUser, filters = {}) {
    await this._delay(150);
    if (!currentUser) return this._error('Authentication required.', 401);

    let appointments = this.db.get('appointments');

    if (currentUser.role === 'PATIENT') {
      appointments = appointments.filter(a => a.patientId === currentUser.patientId);
    } else if (currentUser.role === 'DOCTOR') {
      appointments = appointments.filter(a => a.doctorId === currentUser.doctorId);
    } else if (currentUser.role !== 'ADMIN') {
      return this._error('Unauthorized access.', 403);
    }

    // Filter by Tab (Upcoming, Completed, Cancelled)
    if (filters.tab && filters.tab !== 'all') {
      if (filters.tab === 'upcoming') {
        appointments = appointments.filter(a => a.status === 'CONFIRMED' || a.status === 'WAITING' || a.status === 'PENDING');
      } else if (filters.tab === 'completed') {
        appointments = appointments.filter(a => a.status === 'COMPLETED');
      } else if (filters.tab === 'cancelled') {
        appointments = appointments.filter(a => a.status === 'CANCELLED');
      }
    }

    if (filters.status && filters.status !== 'ALL') {
      appointments = appointments.filter(a => a.status === filters.status);
    }
    if (filters.doctorId && filters.doctorId !== 'ALL') {
      appointments = appointments.filter(a => a.doctorId === filters.doctorId);
    }
    if (filters.specialization && filters.specialization !== 'ALL') {
      appointments = appointments.filter(a => a.specialization.toLowerCase() === filters.specialization.toLowerCase());
    }
    if (filters.type && filters.type !== 'ALL') {
      appointments = appointments.filter(a => a.reason.toLowerCase() === filters.type.toLowerCase() || (filters.type === 'Other' && !['general consultation', 'follow-up', 'routine checkup'].includes(a.reason.toLowerCase())));
    }
    if (filters.date) {
      appointments = appointments.filter(a => a.date === filters.date);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      appointments = appointments.filter(a => 
        a.appointmentId.toLowerCase().includes(q) ||
        a.patientName.toLowerCase().includes(q) ||
        a.doctorName.toLowerCase().includes(q) ||
        a.specialization.toLowerCase().includes(q) ||
        a.reason.toLowerCase().includes(q)
      );
    }

    appointments.sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));
    return this._success(appointments);
  }

  async getDoctorAvailableSlots(doctorId, date) {
    await this._delay(100);
    const doctor = this.db.findOne('doctors', d => d.doctorId === doctorId);
    if (!doctor) return this._error('Doctor not found', 404);

    const masterSlots = doctor.availableSlots && doctor.availableSlots.length > 0
      ? doctor.availableSlots
      : ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '02:00 PM', '02:30 PM', '03:30 PM'];

    const existingAppointments = this.db.filter('appointments', a => 
      a.doctorId === doctorId && 
      a.date === date && 
      a.status !== 'CANCELLED'
    );

    const bookedTimes = new Set(existingAppointments.map(a => a.time));

    const slotDetails = masterSlots.map(time => ({
      time,
      isAvailable: !bookedTimes.has(time)
    }));

    return this._success(slotDetails);
  }

  async bookAppointment(currentUser, bookingData) {
    await this._delay(250);
    if (!currentUser || (currentUser.role !== 'PATIENT' && currentUser.role !== 'ADMIN')) {
      return this._error('Only authenticated patients can book appointments.', 403);
    }

    const { doctorId, date, time, reason, visitType } = bookingData;
    if (!doctorId || !date || !time || !reason) {
      return this._error('Please complete all required appointment fields (Doctor, Date, Time, Reason).', 400);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (date < todayStr) {
      return this._error('Selected date cannot be in the past. Please select a valid future date.', 400);
    }

    const doctor = this.db.findOne('doctors', d => d.doctorId === doctorId);
    if (!doctor) return this._error('Selected doctor was not found.', 404);

    if (doctor.status !== 'Active' || doctor.availability === 'Unavailable') {
      return this._error('Selected doctor is currently inactive or unavailable for booking.', 400);
    }

    // Double Booking Protection Guard
    const existingSlot = this.db.findOne('appointments', a => 
      a.doctorId === doctorId && 
      a.date === date && 
      a.time === time && 
      a.status !== 'CANCELLED'
    );
    if (existingSlot) {
      return this._error('This appointment slot is no longer available. Please choose another time.', 409);
    }

    // Patient ID derived strictly from authenticated server session for patient role
    const patientId = currentUser.role === 'PATIENT' ? currentUser.patientId : (bookingData.patientId || currentUser.patientId);
    const patient = this.db.findOne('patients', p => p.patientId === patientId);
    const patientName = patient ? patient.fullName : currentUser.fullName;

    const aptNum = 1007 + this.db.get('appointments').length;
    const appointmentId = `APT-${aptNum}`;
    const fullReason = visitType && visitType !== 'Other' ? `${visitType} — ${reason}` : reason;

    const newAppointment = {
      id: appointmentId,
      appointmentId,
      patientId,
      patientName,
      doctorId: doctor.doctorId,
      doctorName: doctor.fullName,
      specialization: doctor.specialization,
      date,
      time,
      location: 'CLINOVA Main Hub - Suite 302',
      reason: fullReason,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString()
    };

    this.db.insert('appointments', newAppointment);
    this.db.logAudit(currentUser.userId, currentUser.fullName, currentUser.role, 'BOOK_APPOINTMENT', 'Appointment', appointmentId, 'SUCCESS', `Booked with ${doctor.fullName} on ${date} at ${time}`);

    return this._success(newAppointment, 'Appointment successfully booked!');
  }

  async rescheduleAppointment(currentUser, appointmentId, newDate, newTime) {
    await this._delay(200);
    if (!currentUser || (currentUser.role !== 'PATIENT' && currentUser.role !== 'ADMIN')) {
      return this._error('Access denied. Authentication required.', 403);
    }

    const appointment = this.db.findOne('appointments', a => a.appointmentId === appointmentId);
    if (!appointment) return this._error('Appointment not found.', 404);

    if (currentUser.role === 'PATIENT' && appointment.patientId !== currentUser.patientId) {
      return this._error('Access denied. You can only reschedule your own appointments.', 403);
    }

    if (appointment.status === 'CANCELLED' || appointment.status === 'COMPLETED') {
      return this._error(`Cannot reschedule a ${appointment.status.toLowerCase()} appointment.`, 400);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (newDate < todayStr) {
      return this._error('New appointment date cannot be in the past.', 400);
    }

    // Double Booking Protection Guard for Rescheduling
    const conflictSlot = this.db.findOne('appointments', a => 
      a.doctorId === appointment.doctorId &&
      a.date === newDate &&
      a.time === newTime &&
      a.appointmentId !== appointmentId &&
      a.status !== 'CANCELLED'
    );

    if (conflictSlot) {
      return this._error('This appointment slot is no longer available. Please choose another time.', 409);
    }

    const updated = this.db.update('appointments', 'appointmentId', appointmentId, {
      date: newDate,
      time: newTime,
      status: 'CONFIRMED'
    });

    this.db.logAudit(currentUser.userId, currentUser.fullName, currentUser.role, 'RESCHEDULE_APPOINTMENT', 'Appointment', appointmentId, 'SUCCESS', `Rescheduled to ${newDate} at ${newTime}`);

    return this._success(updated, 'Appointment rescheduled successfully!');
  }

  async updateAppointmentStatus(currentUser, appointmentId, status) {
    await this._delay(150);
    const appointment = this.db.findOne('appointments', a => a.appointmentId === appointmentId);
    if (!appointment) return this._error('Appointment not found.', 404);

    if (currentUser.role === 'PATIENT' && appointment.patientId !== currentUser.patientId) {
      return this._error('Access denied.', 403);
    }
    if (currentUser.role === 'DOCTOR' && appointment.doctorId !== currentUser.doctorId) {
      return this._error('Access denied.', 403);
    }

    const updated = this.db.update('appointments', 'appointmentId', appointmentId, { status });
    let actionType = 'UPDATE_APPOINTMENT_STATUS';
    if (status === 'CANCELLED') actionType = 'CANCEL_APPOINTMENT';
    if (status === 'COMPLETED') actionType = 'COMPLETE_CONSULTATION';

    this.db.logAudit(currentUser.userId, currentUser.fullName, currentUser.role, actionType, 'Appointment', appointmentId, 'SUCCESS', `Status updated to ${status}`);

    return this._success(updated, `Appointment status updated to ${status}.`);
  }

  // --- ADMIN MANAGEMENT ENDPOINTS ---

  async getAllPatientsForAdmin(currentUser, filters = {}) {
    await this._delay(150);
    if (currentUser.role !== 'ADMIN') return this._error('Access denied. Admin authorization required.', 403);

    let patients = this.db.get('patients');
    if (filters.status && filters.status !== 'ALL') {
      patients = patients.filter(p => p.status === filters.status);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      patients = patients.filter(p => 
        p.patientId.toLowerCase().includes(q) ||
        p.fullName.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.phone.toLowerCase().includes(q)
      );
    }

    return this._success(patients);
  }

  async getAdminAnalytics(currentUser) {
    await this._delay(200);
    if (currentUser.role !== 'ADMIN') {
      return this._error('Access denied. Admin authorization required.', 403);
    }

    const patients = this.db.get('patients');
    const doctors = this.db.get('doctors');
    const appointments = this.db.get('appointments');

    const totalPatients = patients.length;
    const activeDoctors = doctors.filter(d => d.status === 'Active').length;
    const todayAppointments = appointments.length;
    const pendingAppointments = appointments.filter(a => a.status === 'PENDING' || a.status === 'WAITING').length;
    const completedAppointments = appointments.filter(a => a.status === 'COMPLETED').length;
    const cancelledAppointments = appointments.filter(a => a.status === 'CANCELLED').length;

    return this._success({
      totalPatients,
      activeDoctors,
      todayAppointments,
      pendingAppointments,
      completedAppointments,
      cancelledAppointments
    });
  }

  async getAuditLogs(currentUser, filters = {}) {
    await this._delay(150);
    const authCheck = this._verifySession(currentUser, 'ADMIN');
    if (!authCheck.valid) {
      return authCheck.error;
    }

    let logs = this.db.get('auditLogs');

    const action = typeof filters === 'string' ? filters : (filters.action || 'ALL');
    const role = filters.role || 'ALL';
    const result = filters.result || 'ALL';
    const date = filters.date || '';
    const userSearch = filters.user || '';
    const generalSearch = filters.search || '';

    if (action && action !== 'ALL') {
      logs = logs.filter(l => l.action === action);
    }
    if (role && role !== 'ALL') {
      logs = logs.filter(l => l.role === role);
    }
    if (result && result !== 'ALL') {
      logs = logs.filter(l => (l.result || l.status) === result);
    }
    if (date) {
      logs = logs.filter(l => l.timestamp && l.timestamp.startsWith(date));
    }
    if (userSearch) {
      const uq = userSearch.toLowerCase().trim();
      logs = logs.filter(l => 
        (l.userName || '').toLowerCase().includes(uq) ||
        (l.userId || '').toLowerCase().includes(uq)
      );
    }
    if (generalSearch) {
      const q = generalSearch.toLowerCase().trim();
      logs = logs.filter(l =>
        (l.userName || '').toLowerCase().includes(q) ||
        (l.action || '').toLowerCase().includes(q) ||
        (l.resource || l.target || '').toLowerCase().includes(q) ||
        (l.resourceId || '').toLowerCase().includes(q) ||
        (l.metadata || l.detail || '').toLowerCase().includes(q) ||
        (l.ip || '').toLowerCase().includes(q)
      );
    }

    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Admin Security Section Summaries
    const allLogs = this.db.get('auditLogs');
    const totalLogins = allLogs.filter(l => l.action === 'LOGIN' && (l.result === 'SUCCESS' || l.status === 'SUCCESS')).length;
    const failedLogins = allLogs.filter(l => l.action === 'LOGIN_FAILED' || l.action === 'LOGIN_BLOCKED' || (l.action === 'LOGIN' && l.result !== 'SUCCESS')).length;
    const deniedAccess = allLogs.filter(l => l.action === 'DENIED_ACCESS' || l.action === 'UNAUTHORIZED_RECORD_ACCESS' || l.action === 'UNAUTHORIZED_RECORD_LOOKUP' || l.result === 'DENIED' || l.result === 'BLOCKED').length;
    const patientRecordAccess = allLogs.filter(l => l.action === 'VIEW_AUTHORIZED_PATIENT' || l.action === 'PATIENT_RECORD_ACCESS' || l.action === 'CREATE_MEDICAL_RECORD' || l.action === 'UNAUTHORIZED_RECORD_ACCESS').length;

    return this._success({
      logs,
      summary: {
        totalLogins,
        failedLogins,
        deniedAccess,
        patientRecordAccess,
        totalEvents: logs.length
      }
    });
  }

  async createDoctor(currentUser, doctorData) {
    await this._delay(250);
    const authCheck = this._verifySession(currentUser, 'ADMIN');
    if (!authCheck.valid) return authCheck.error;

    const drNum = 8800 + this.db.get('doctors').length + 1;
    const doctorId = `DR-${drNum}`;
    const userId = `usr-doctor-${Date.now()}`;
    const passwordHash = await window.ClinovaCrypto.hashPassword(doctorData.password || 'Doctor@123');

    const newUser = {
      id: userId,
      email: doctorData.email,
      passwordHash,
      role: 'DOCTOR',
      doctorId,
      fullName: doctorData.fullName,
      createdAt: new Date().toISOString(),
      isActive: true
    };
    this.db.insert('users', newUser);

    const newDoctor = {
      id: doctorId,
      userId,
      doctorId,
      fullName: doctorData.fullName,
      specialization: doctorData.specialization,
      experience: doctorData.experience || '5 Years',
      rating: 5.0,
      bio: doctorData.bio || 'Board-certified medical specialist at CLINOVA.',
      profileImage: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=300&auto=format&fit=crop',
      availabilityStatus: 'Available Today',
      availableSlots: ['09:00 AM', '10:00 AM', '02:00 PM', '04:00 PM'],
      status: 'Active'
    };
    this.db.insert('doctors', newDoctor);

    this.db.logAudit(currentUser.userId, currentUser.fullName, currentUser.role, 'CREATE_DOCTOR', 'DoctorProfile', doctorId, 'SUCCESS', `Created doctor ${doctorData.fullName}`, '127.0.0.1');

    return this._success(newDoctor, 'Doctor account created successfully.');
  }

  async updateDoctorDetails(currentUser, doctorId, updates) {
    await this._delay(150);
    const authCheck = this._verifySession(currentUser, 'ADMIN');
    if (!authCheck.valid) return authCheck.error;

    const doctor = this.db.findOne('doctors', d => d.doctorId === doctorId);
    if (!doctor) return this._error('Doctor not found', 404);

    const allowedUpdates = {};
    if (updates.specialization !== undefined) allowedUpdates.specialization = updates.specialization;
    if (updates.availability !== undefined) allowedUpdates.availability = updates.availability;
    if (updates.availabilityStatus !== undefined) allowedUpdates.availabilityStatus = updates.availabilityStatus;
    if (updates.experience !== undefined) allowedUpdates.experience = updates.experience;
    if (updates.bio !== undefined) allowedUpdates.bio = updates.bio;

    const updated = this.db.update('doctors', 'doctorId', doctorId, allowedUpdates);
    this.db.logAudit(currentUser.userId, currentUser.fullName, currentUser.role, 'UPDATE_DOCTOR_DETAILS', 'DoctorProfile', doctorId, 'SUCCESS', `Updated details for ${doctorId}: ${Object.keys(allowedUpdates).join(', ')}`, '127.0.0.1');

    return this._success(updated, 'Doctor details updated successfully.');
  }

  async toggleAccountStatus(currentUser, type, id, status) {
    await this._delay(150);
    const authCheck = this._verifySession(currentUser, 'ADMIN');
    if (!authCheck.valid) return authCheck.error;

    const table = type === 'patient' ? 'patients' : 'doctors';
    const idField = type === 'patient' ? 'patientId' : 'doctorId';

    const updated = this.db.update(table, idField, id, { status });
    this.db.logAudit(currentUser.userId, currentUser.fullName, currentUser.role, 'TOGGLE_STATUS', table, id, 'SUCCESS', `Set ${type} status to ${status}`, '127.0.0.1');

    return this._success(updated, `${type.toUpperCase()} status updated to ${status}.`);
  }

  async createMedicalRecord(currentUser, recordData) {
    await this._delay(250);
    const authCheck = this._verifySession(currentUser, ['DOCTOR']);
    if (!authCheck.valid) return authCheck.error;

    const recNum = 202600 + this.db.get('medicalRecords').length + 1;
    const recordId = `REC-${recNum}`;
    const patient = this.db.findOne('patients', p => p.patientId === recordData.patientId);

    const newRecord = {
      id: recordId,
      recordId,
      patientId: recordData.patientId,
      patientName: patient ? patient.fullName : 'Alex Johnson',
      doctorId: currentUser.doctorId || recordData.doctorId || 'DR-8801',
      doctorName: currentUser.fullName,
      appointmentId: recordData.appointmentId || 'N/A',
      date: recordData.date || new Date().toISOString().split('T')[0],
      visitReason: recordData.visitReason || 'General Consultation',
      diagnosis: recordData.diagnosis,
      notes: recordData.notes,
      prescription: recordData.prescription + ' (Demo Prescription)',
      followUp: recordData.followUp || '7 days',
      recordType: 'Clinical Consultation'
    };

    this.db.insert('medicalRecords', newRecord);

    if (recordData.appointmentId) {
      this.db.update('appointments', 'appointmentId', recordData.appointmentId, { status: 'COMPLETED' });
    }

    this.db.logAudit(currentUser.userId, currentUser.fullName, currentUser.role, 'CREATE_MEDICAL_RECORD', 'MedicalRecord', recordId, 'SUCCESS', `Issued diagnosis: ${recordData.diagnosis}`, '127.0.0.1');

    return this._success(newRecord, 'Medical record created successfully.');
  }

  async getMedicalRecords(currentUser, filters = {}) {
    await this._delay(150);
    const authCheck = this._verifySession(currentUser);
    if (!authCheck.valid) return authCheck.error;

    let targetPatientId = null;

    if (currentUser.role === 'PATIENT') {
      // Patients can ONLY access their own records. Never trust browser-supplied patientId.
      targetPatientId = currentUser.patientId;
      if (filters.patientId && filters.patientId !== currentUser.patientId) {
        this.db.logAudit(currentUser.userId, currentUser.fullName, currentUser.role, 'UNAUTHORIZED_RECORD_ACCESS', 'MedicalRecord', filters.patientId, 'BLOCKED', 'Attempted unauthorized patient record query', '127.0.0.1');
        return this._error('403 — Access Restricted: Patients can only view their own medical records.', 403);
      }
    } else if (currentUser.role === 'DOCTOR') {
      targetPatientId = filters.patientId || null;
    } else if (currentUser.role === 'ADMIN') {
      // Least privilege: Admins manage system operations without unnecessary clinical privileges
      this.db.logAudit(currentUser.userId, currentUser.fullName, currentUser.role, 'DENIED_ACCESS', 'MedicalRecord', filters.patientId || 'ALL', 'DENIED', 'Admin attempted clinical patient record query', '127.0.0.1');
      return this._error('403 — Access Restricted: System administrators manage system operations without unnecessary clinical access to private patient medical records.', 403);
    } else {
      return this._error('403 — Access Restricted', 403);
    }

    let records = this.db.get('medicalRecords');

    if (targetPatientId) {
      records = records.filter(r => r.patientId === targetPatientId);
    }

    // Filter by Record Type
    if (filters.recordType && filters.recordType !== 'ALL') {
      records = records.filter(r => (r.recordType || 'Clinical Consultation').toLowerCase() === filters.recordType.toLowerCase());
    }

    // Filter by Doctor
    if (filters.doctorId && filters.doctorId !== 'ALL') {
      records = records.filter(r => r.doctorId === filters.doctorId);
    }

    // Filter by Date
    if (filters.date) {
      records = records.filter(r => r.date === filters.date);
    }

    // Search by Doctor, Diagnosis, Visit Reason, Record ID
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      records = records.filter(r => 
        (r.recordId && r.recordId.toLowerCase().includes(q)) ||
        (r.doctorName && r.doctorName.toLowerCase().includes(q)) ||
        (r.diagnosis && r.diagnosis.toLowerCase().includes(q)) ||
        (r.visitReason && r.visitReason.toLowerCase().includes(q))
      );
    }

    // Sort Newest -> Oldest
    records.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Audit log patient record access
    this.db.logAudit(currentUser.userId, currentUser.fullName, currentUser.role, 'PATIENT_RECORD_ACCESS', 'MedicalRecord', targetPatientId || 'QUERY', 'SUCCESS', 'Accessed patient medical records timeline', '127.0.0.1');

    return this._success(records);
  }

  async getMedicalRecordById(currentUser, recordId) {
    await this._delay(150);
    const authCheck = this._verifySession(currentUser);
    if (!authCheck.valid) return authCheck.error;

    if (currentUser.role === 'ADMIN') {
      this.db.logAudit(currentUser.userId, currentUser.fullName, currentUser.role, 'DENIED_ACCESS', 'MedicalRecord', recordId, 'DENIED', 'Admin attempted clinical medical record lookup', '127.0.0.1');
      return this._error('403 — Access Restricted: System administrators manage system operations without unnecessary clinical privileges.', 403);
    }

    const record = this.db.findOne('medicalRecords', r => r.recordId === recordId);

    if (currentUser.role === 'PATIENT') {
      if (!record || record.patientId !== currentUser.patientId) {
        this.db.logAudit(currentUser.userId, currentUser.fullName, currentUser.role, 'UNAUTHORIZED_RECORD_LOOKUP', 'MedicalRecord', recordId, 'BLOCKED', 'Unauthorized single record lookup attempt', '127.0.0.1');
        return this._error('403 — Access Restricted', 403);
      }
    }

    if (!record) return this._error('403 — Access Restricted', 403);

    this.db.logAudit(currentUser.userId, currentUser.fullName, currentUser.role, 'PATIENT_RECORD_ACCESS', 'MedicalRecord', recordId, 'SUCCESS', 'Accessed detailed medical record view', '127.0.0.1');

    return this._success(record);
  }

  async getAuditLogs(currentUser) {
    await this._delay(100);
    const authCheck = this._verifySession(currentUser, 'ADMIN');
    if (!authCheck.valid) return authCheck.error;

    const logs = this.db.get('auditLogs') || [];
    const sorted = [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return this._success(sorted);
  }
}

window.clinovaAPI = new ClinovaAPI();

