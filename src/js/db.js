/**
 * CLINOVA - Synthetic Database Engine & Seeding Layer
 * Handles LocalStorage persistent data, relationships, and seed data initialization.
 */

const DB_KEY_PREFIX = 'clinova_db_';

// Initial synthetic seed data
const INITIAL_SEED = {
  users: [
    {
      id: 'usr-patient-1',
      email: 'patient@clinova.demo',
      passwordHash: 'Patient@123', // In demo sandbox
      role: 'PATIENT',
      patientId: 'PT-10245',
      fullName: 'Alex Johnson',
      createdAt: '2026-01-15T09:00:00Z',
      isActive: true
    },
    {
      id: 'usr-patient-2',
      email: 'emma.williams@clinova.demo',
      passwordHash: 'Patient@123',
      role: 'PATIENT',
      patientId: 'PT-10246',
      fullName: 'Emma Williams',
      createdAt: '2026-02-10T11:30:00Z',
      isActive: true
    },
    {
      id: 'usr-patient-3',
      email: 'michael.brown@clinova.demo',
      passwordHash: 'Patient@123',
      role: 'PATIENT',
      patientId: 'PT-10247',
      fullName: 'Michael Brown',
      createdAt: '2026-03-01T14:15:00Z',
      isActive: true
    },
    {
      id: 'usr-patient-4',
      email: 'sophia.davis@clinova.demo',
      passwordHash: 'Patient@123',
      role: 'PATIENT',
      patientId: 'PT-10248',
      fullName: 'Sophia Davis',
      createdAt: '2026-03-20T16:00:00Z',
      isActive: true
    },
    {
      id: 'usr-doctor-1',
      email: 'doctor@clinova.demo',
      passwordHash: 'Doctor@123',
      role: 'DOCTOR',
      doctorId: 'DR-8801',
      fullName: 'Dr. Sarah Mitchell',
      createdAt: '2025-11-01T08:00:00Z',
      isActive: true
    },
    {
      id: 'usr-doctor-2',
      email: 'dr.chen@clinova.demo',
      passwordHash: 'Doctor@123',
      role: 'DOCTOR',
      doctorId: 'DR-8802',
      fullName: 'Dr. David Chen',
      createdAt: '2025-11-05T08:00:00Z',
      isActive: true
    },
    {
      id: 'usr-doctor-3',
      email: 'dr.patel@clinova.demo',
      passwordHash: 'Doctor@123',
      role: 'DOCTOR',
      doctorId: 'DR-8803',
      fullName: 'Dr. Ananya Patel',
      createdAt: '2025-12-01T08:00:00Z',
      isActive: true
    },
    {
      id: 'usr-doctor-4',
      email: 'dr.rodriguez@clinova.demo',
      passwordHash: 'Doctor@123',
      role: 'DOCTOR',
      doctorId: 'DR-8804',
      fullName: 'Dr. Marcus Rodriguez',
      createdAt: '2026-01-01T08:00:00Z',
      isActive: true
    },
    {
      id: 'usr-admin-1',
      email: 'admin@clinova.demo',
      passwordHash: 'Admin@123',
      role: 'ADMIN',
      fullName: 'Chief Administrator',
      createdAt: '2025-10-01T00:00:00Z',
      isActive: true
    }
  ],

  patients: [
    {
      id: 'PT-10245',
      userId: 'usr-patient-1',
      patientId: 'PT-10245',
      fullName: 'Alex Johnson',
      dateOfBirth: '2002-05-14',
      age: 24,
      gender: 'Male',
      phone: '+1 (555) 234-5678',
      email: 'patient@clinova.demo',
      address: '742 Cyber Avenue, Suite 404, Tech City',
      bloodGroup: 'O+',
      allergies: ['Penicillin', 'Peanuts (Mild)'],
      existingConditions: ['Mild Asthma', 'Seasonal Rhinitis'],
      currentMedications: ['Albuterol Inhaler (As needed)', 'Cetirizine 10mg daily'],
      emergencyContactName: 'Rachel Johnson',
      emergencyContactRelationship: 'Sister',
      emergencyContactPhone: '+1 (555) 987-6543',
      healthSnapshot: {
        bloodPressure: '120/80 mmHg',
        heartRate: '72 bpm',
        bmi: '22.4 kg/m²',
        temperature: '98.6 °F',
        updatedAt: '2026-10-04'
      },
      status: 'Active',
      lastVisit: '2026-09-28'
    },
    {
      id: 'PT-10246',
      userId: 'usr-patient-2',
      patientId: 'PT-10246',
      fullName: 'Emma Williams',
      dateOfBirth: '1995-08-22',
      age: 31,
      gender: 'Female',
      phone: '+1 (555) 345-6789',
      email: 'emma.williams@clinova.demo',
      address: '108 Innovation Way, San Francisco, CA',
      bloodGroup: 'A+',
      allergies: ['Sulfa drugs'],
      existingConditions: ['Hypothyroidism'],
      currentMedications: ['Levothyroxine 50mcg'],
      emergencyContactName: 'David Williams',
      emergencyContactRelationship: 'Spouse',
      emergencyContactPhone: '+1 (555) 876-5432',
      healthSnapshot: {
        bloodPressure: '118/76 mmHg',
        heartRate: '68 bpm',
        bmi: '21.8 kg/m²',
        temperature: '98.4 °F',
        updatedAt: '2026-10-02'
      },
      status: 'Active',
      lastVisit: '2026-09-15'
    },
    {
      id: 'PT-10247',
      userId: 'usr-patient-3',
      patientId: 'PT-10247',
      fullName: 'Michael Brown',
      dateOfBirth: '1988-12-03',
      age: 37,
      gender: 'Male',
      phone: '+1 (555) 456-7890',
      email: 'michael.brown@clinova.demo',
      address: '350 Silicon Boulevard, Austin, TX',
      bloodGroup: 'B+',
      allergies: ['None known'],
      existingConditions: ['Hypertension (Stage 1)'],
      currentMedications: ['Lisinopril 10mg'],
      emergencyContactName: 'Sarah Brown',
      emergencyContactRelationship: 'Spouse',
      emergencyContactPhone: '+1 (555) 765-4321',
      healthSnapshot: {
        bloodPressure: '132/85 mmHg',
        heartRate: '78 bpm',
        bmi: '26.1 kg/m²',
        temperature: '98.7 °F',
        updatedAt: '2026-10-01'
      },
      status: 'Active',
      lastVisit: '2026-09-20'
    },
    {
      id: 'PT-10248',
      userId: 'usr-patient-4',
      patientId: 'PT-10248',
      fullName: 'Sophia Davis',
      dateOfBirth: '1999-03-19',
      age: 27,
      gender: 'Female',
      phone: '+1 (555) 567-8901',
      email: 'sophia.davis@clinova.demo',
      address: '42 Greenway Park, Seattle, WA',
      bloodGroup: 'AB-',
      allergies: ['Latex'],
      existingConditions: ['Migraine with Aura'],
      currentMedications: ['Sumatriptan 50mg (PRN)'],
      emergencyContactName: 'James Davis',
      emergencyContactRelationship: 'Father',
      emergencyContactPhone: '+1 (555) 654-3210',
      healthSnapshot: {
        bloodPressure: '115/74 mmHg',
        heartRate: '70 bpm',
        bmi: '20.5 kg/m²',
        temperature: '98.5 °F',
        updatedAt: '2026-09-30'
      },
      status: 'Active',
      lastVisit: '2026-09-10'
    }
  ],

  doctors: [
    {
      id: 'DR-8801',
      userId: 'usr-doctor-1',
      doctorId: 'DR-8801',
      fullName: 'Dr. Sarah Mitchell',
      specialization: 'General Medicine',
      experience: '12 Years',
      rating: 4.9,
      bio: 'Board-certified General Physician specializing in preventive care, chronic disease management, and digital health diagnostic workflows.',
      profileImage: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=300&auto=format&fit=crop',
      availabilityStatus: 'Available Today',
      availability: 'Available',
      availableSlots: ['09:00 AM', '09:30 AM', '10:30 AM', '11:30 AM', '02:00 PM', '03:30 PM'],
      status: 'Active'
    },
    {
      id: 'DR-8802',
      userId: 'usr-doctor-2',
      doctorId: 'DR-8802',
      fullName: 'Dr. David Chen',
      specialization: 'Cardiology',
      experience: '15 Years',
      rating: 4.95,
      bio: 'Lead Cardiologist with extensive clinical expertise in cardiovascular risk prevention, ECG analytics, and hypertension management.',
      profileImage: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=300&auto=format&fit=crop',
      availabilityStatus: 'Available Today',
      availability: 'Available',
      availableSlots: ['10:00 AM', '11:00 AM', '02:30 PM', '04:00 PM'],
      status: 'Active'
    },
    {
      id: 'DR-8803',
      userId: 'usr-doctor-3',
      doctorId: 'DR-8803',
      fullName: 'Dr. Ananya Patel',
      specialization: 'Dermatology',
      experience: '9 Years',
      rating: 4.88,
      bio: 'Specialist in clinical dermatology, skin health, allergic reaction diagnostics, and modern non-invasive therapies.',
      profileImage: 'https://images.unsplash.com/photo-1594824813571-24a69c100d3a?q=80&w=300&auto=format&fit=crop',
      availabilityStatus: 'Available Tomorrow',
      availability: 'Busy',
      availableSlots: ['09:00 AM', '10:30 AM', '01:30 PM', '03:00 PM'],
      status: 'Active'
    },
    {
      id: 'DR-8804',
      userId: 'usr-doctor-4',
      doctorId: 'DR-8804',
      fullName: 'Dr. Marcus Rodriguez',
      specialization: 'Orthopedics',
      experience: '14 Years',
      rating: 4.92,
      bio: 'Orthopedic Surgeon focused on sports medicine, joint health, spine mobility, and post-injury rehabilitation.',
      profileImage: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=300&auto=format&fit=crop',
      availabilityStatus: 'Available Today',
      availability: 'Available',
      availableSlots: ['09:30 AM', '11:30 AM', '02:00 PM', '04:30 PM'],
      status: 'Active'
    },
    {
      id: 'DR-8805',
      userId: 'usr-doctor-5',
      doctorId: 'DR-8805',
      fullName: 'Dr. Elena Rostova',
      specialization: 'Neurology',
      experience: '11 Years',
      rating: 4.91,
      bio: 'Clinical Neurologist specialized in headache disorders, neuro-diagnostic imaging analysis, and nerve health.',
      profileImage: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=300&auto=format&fit=crop',
      availabilityStatus: 'Available Today',
      availability: 'Available',
      availableSlots: ['10:00 AM', '11:00 AM', '03:00 PM'],
      status: 'Active'
    },
    {
      id: 'DR-8806',
      userId: 'usr-doctor-6',
      doctorId: 'DR-8806',
      fullName: 'Dr. Emily Watson',
      specialization: 'Pediatrics',
      experience: '8 Years',
      rating: 4.85,
      bio: 'Board-certified Pediatrician specialized in child wellness, adolescent care, vaccinations, and growth monitoring.',
      profileImage: 'https://images.unsplash.com/photo-1594824813571-24a69c100d3a?q=80&w=300&auto=format&fit=crop',
      availabilityStatus: 'Available Today',
      availability: 'Available',
      availableSlots: ['09:00 AM', '11:00 AM', '02:00 PM'],
      status: 'Active'
    },
    {
      id: 'DR-8807',
      userId: 'usr-doctor-7',
      doctorId: 'DR-8807',
      fullName: 'Dr. Robert Vance',
      specialization: 'Cardiology',
      experience: '20 Years',
      rating: 4.70,
      bio: 'Senior Cardiology Consultant currently on sabbatical leave.',
      profileImage: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=300&auto=format&fit=crop',
      availabilityStatus: 'Unavailable',
      availability: 'Unavailable',
      availableSlots: [],
      status: 'Inactive'
    }
  ],

  appointments: [
    {
      id: 'APT-1001',
      appointmentId: 'APT-1001',
      patientId: 'PT-10245',
      patientName: 'Alex Johnson',
      doctorId: 'DR-8801',
      doctorName: 'Dr. Sarah Mitchell',
      specialization: 'General Medicine',
      date: '2026-10-14',
      time: '10:30 AM',
      location: 'CLINOVA Main Hub - Suite 302',
      reason: 'Routine seasonal checkup and medication refill review.',
      status: 'CONFIRMED',
      createdAt: '2026-10-04T10:00:00Z'
    },
    {
      id: 'APT-1002',
      appointmentId: 'APT-1002',
      patientId: 'PT-10246',
      patientName: 'Emma Williams',
      doctorId: 'DR-8801',
      doctorName: 'Dr. Sarah Mitchell',
      specialization: 'General Medicine',
      date: '2026-10-05',
      time: '10:30 AM',
      location: 'CLINOVA Main Hub - Suite 302',
      reason: 'Follow-up consultation for thyroid panel metrics.',
      status: 'WAITING',
      createdAt: '2026-10-03T11:00:00Z'
    },
    {
      id: 'APT-1003',
      appointmentId: 'APT-1003',
      patientId: 'PT-10247',
      patientName: 'Michael Brown',
      doctorId: 'DR-8802',
      doctorName: 'Dr. David Chen',
      specialization: 'Cardiology',
      date: '2026-10-05',
      time: '11:30 AM',
      location: 'CLINOVA Heart Center - Room 405',
      reason: 'Blood pressure tracking and routine ECG review.',
      status: 'CONFIRMED',
      createdAt: '2026-10-02T14:30:00Z'
    },
    {
      id: 'APT-1004',
      appointmentId: 'APT-1004',
      patientId: 'PT-10248',
      patientName: 'Sophia Davis',
      doctorId: 'DR-8803',
      doctorName: 'Dr. Ananya Patel',
      specialization: 'Dermatology',
      date: '2026-10-06',
      time: '09:00 AM',
      location: 'CLINOVA Dermatology Suite',
      reason: 'Annual skin assessment and mild allergy checkup.',
      status: 'PENDING',
      createdAt: '2026-10-04T16:20:00Z'
    },
    {
      id: 'APT-1005',
      appointmentId: 'APT-1005',
      patientId: 'PT-10245',
      patientName: 'Alex Johnson',
      doctorId: 'DR-8802',
      doctorName: 'Dr. David Chen',
      specialization: 'Cardiology',
      date: '2026-09-28',
      time: '02:00 PM',
      location: 'CLINOVA Heart Center - Room 405',
      reason: 'Preventive baseline cardiovascular evaluation.',
      status: 'COMPLETED',
      createdAt: '2026-09-20T09:15:00Z'
    },
    {
      id: 'APT-1006',
      appointmentId: 'APT-1006',
      patientId: 'PT-10245',
      patientName: 'Alex Johnson',
      doctorId: 'DR-8803',
      doctorName: 'Dr. Ananya Patel',
      specialization: 'Dermatology',
      date: '2026-08-15',
      time: '11:00 AM',
      location: 'CLINOVA Dermatology Suite',
      reason: 'Seasonal skin allergy consultation.',
      status: 'COMPLETED',
      createdAt: '2026-08-10T15:00:00Z'
    }
  ],

  medicalRecords: [
    {
      id: 'REC-2026-01',
      recordId: 'REC-2026-01',
      patientId: 'PT-10245',
      patientName: 'Alex Johnson',
      doctorId: 'DR-8802',
      doctorName: 'Dr. David Chen',
      appointmentId: 'APT-1005',
      date: '2026-09-28',
      visitReason: 'Preventive baseline cardiovascular evaluation',
      diagnosis: 'Normal Sinus Rhythm • Optimal Cardiovascular Status',
      notes: 'Patient reports mild workload stress. Resting heart rate 72 bpm, BP 120/80 mmHg. Normal EKG profile.',
      prescription: 'Lifestyle maintenance • Hydration 3L/day • Regular aerobic exercise (Demo Prescription)',
      followUp: '6 Months Routine Checkup',
      recordType: 'Cardiology Consultation'
    },
    {
      id: 'REC-2025-04',
      recordId: 'REC-2025-04',
      patientId: 'PT-10245',
      patientName: 'Alex Johnson',
      doctorId: 'DR-8803',
      doctorName: 'Dr. Ananya Patel',
      appointmentId: 'APT-1006',
      date: '2026-08-15',
      visitReason: 'Seasonal skin allergy consultation',
      diagnosis: 'Seasonal Rhinitis & Mild Contact Dermatitis',
      notes: 'Patient exhibits minor skin flare-ups during spring pollen surge. Lungs clear.',
      prescription: 'Cetirizine 10mg — 1 tablet daily for 14 days (Demo Prescription)',
      followUp: 'As needed if symptoms persist',
      recordType: 'Dermatology Assessment'
    },
    {
      id: 'REC-2025-01',
      recordId: 'REC-2025-01',
      patientId: 'PT-10245',
      patientName: 'Alex Johnson',
      doctorId: 'DR-8801',
      doctorName: 'Dr. Sarah Mitchell',
      appointmentId: 'APT-0980',
      date: '2025-11-12',
      visitReason: 'Annual General Health Examination',
      diagnosis: 'General Health Clear • Mild Seasonal Allergies',
      notes: 'Complete physical assessment normal. Immunizations up to date.',
      prescription: 'Multivitamin daily supplement (Demo Prescription)',
      followUp: '12 Months Annual Health Exam',
      recordType: 'General Medicine'
    },
    {
      id: 'REC-2026-02',
      recordId: 'REC-2026-02',
      patientId: 'PT-10246',
      patientName: 'Emma Williams',
      doctorId: 'DR-8801',
      doctorName: 'Dr. Sarah Mitchell',
      appointmentId: 'APT-0995',
      date: '2026-09-15',
      visitReason: 'Thyroid panel follow-up',
      diagnosis: 'Stable Euthyroid Status on Current Dosage',
      notes: 'TSH levels within normal target range (2.1 mIU/L). Continue existing medication dose.',
      prescription: 'Levothyroxine 50mcg daily (Demo Prescription)',
      followUp: '3 Months TSH Check',
      recordType: 'Endocrinology / General Medicine'
    }
  ],

  auditLogs: [
    {
      id: 'LOG-9001',
      userId: 'usr-admin-1',
      userName: 'Chief Administrator',
      role: 'ADMIN',
      action: 'SYSTEM_INITIALIZATION',
      resource: 'Database',
      resourceId: 'CLINOVA-CORE',
      timestamp: '2026-10-05T11:00:00+05:30',
      status: 'SUCCESS',
      metadata: 'Seeded synthetic demo sandbox environment'
    },
    {
      id: 'LOG-9002',
      userId: 'usr-patient-1',
      userName: 'Alex Johnson',
      role: 'PATIENT',
      action: 'LOGIN',
      resource: 'AuthService',
      resourceId: 'patient@clinova.demo',
      timestamp: '2026-10-05T11:15:22+05:30',
      status: 'SUCCESS',
      metadata: 'Session token issued via secure guard'
    },
    {
      id: 'LOG-9003',
      userId: 'usr-patient-1',
      userName: 'Alex Johnson',
      role: 'PATIENT',
      action: 'BOOK_APPOINTMENT',
      resource: 'Appointment',
      resourceId: 'APT-1001',
      timestamp: '2026-10-05T11:20:00+05:30',
      status: 'SUCCESS',
      metadata: 'Booked General Medicine with Dr. Sarah Mitchell'
    }
  ]
};

class ClinovaDB {
  constructor() {
    this.init();
  }

  init() {
    // Check if db initialized in localStorage
    if (!localStorage.getItem(DB_KEY_PREFIX + 'initialized')) {
      this.resetToSeed();
    }
  }

  resetToSeed() {
    Object.keys(INITIAL_SEED).forEach(table => {
      localStorage.setItem(DB_KEY_PREFIX + table, JSON.stringify(INITIAL_SEED[table]));
    });
    localStorage.setItem(DB_KEY_PREFIX + 'initialized', 'true');
  }

  get(table) {
    const data = localStorage.getItem(DB_KEY_PREFIX + table);
    return data ? JSON.parse(data) : [];
  }

  save(table, data) {
    localStorage.setItem(DB_KEY_PREFIX + table, JSON.stringify(data));
  }

  findOne(table, predicate) {
    const items = this.get(table);
    return items.find(predicate) || null;
  }

  filter(table, predicate) {
    const items = this.get(table);
    return items.filter(predicate);
  }

  insert(table, item) {
    const items = this.get(table);
    items.push(item);
    this.save(table, items);
    return item;
  }

  update(table, idField, idValue, updates) {
    const items = this.get(table);
    const index = items.findIndex(i => i[idField] === idValue);
    if (index !== -1) {
      items[index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() };
      this.save(table, items);
      return items[index];
    }
    return null;
  }

  delete(table, idField, idValue) {
    const items = this.get(table);
    const filtered = items.filter(i => i[idField] !== idValue);
    this.save(table, filtered);
    return true;
  }

  logAudit(userId, userName, role, action, resource, resourceId, status = 'SUCCESS', metadata = '') {
    const logEntry = {
      id: 'LOG-' + Math.floor(1000 + Math.random() * 9000),
      userId,
      userName,
      role,
      action,
      resource,
      resourceId,
      timestamp: new Date().toISOString(),
      status,
      metadata
    };
    this.insert('auditLogs', logEntry);
    return logEntry;
  }
}

window.clinovaDB = new ClinovaDB();
