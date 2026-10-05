/**
 * CLINOVA - Prisma Database Seed Script
 * Populates database with synthetic demo data for Patients, Doctors, Appointments, and Audit Logs.
 */

// Synthetic Demo Data Configuration
export const SEED_DATA = {
  admin: {
    email: 'admin@clinova.demo',
    passwordHash: '$2b$10$e8Z4w1bHq3d09J...[Hashed: Admin@123]',
    role: 'ADMIN',
    fullName: 'Chief Administrator'
  },
  doctors: [
    {
      email: 'doctor@clinova.demo',
      doctorId: 'DR-DEMO-001',
      fullName: 'Dr. Sarah Mitchell',
      specialization: 'General Medicine',
      experience: '12 Years',
      rating: 4.9,
      availabilityStatus: 'Available Today'
    },
    {
      email: 'dr.chen@clinova.demo',
      doctorId: 'DR-DEMO-002',
      fullName: 'Dr. David Chen',
      specialization: 'Cardiology',
      experience: '15 Years',
      rating: 4.95,
      availabilityStatus: 'Available Today'
    },
    {
      email: 'dr.patel@clinova.demo',
      doctorId: 'DR-DEMO-003',
      fullName: 'Dr. Ananya Patel',
      specialization: 'Dermatology',
      experience: '9 Years',
      rating: 4.88,
      availabilityStatus: 'Available Tomorrow'
    }
  ],
  patients: [
    {
      email: 'patient@clinova.demo',
      patientId: 'PT-DEMO-001',
      fullName: 'Alex Johnson',
      dateOfBirth: '2002-05-14',
      gender: 'Male',
      phone: '+1 (555) 234-5678',
      address: '742 Cyber Avenue, Tech City'
    },
    {
      email: 'emma.williams@clinova.demo',
      patientId: 'PT-DEMO-002',
      fullName: 'Emma Williams',
      dateOfBirth: '1995-08-22',
      gender: 'Female',
      phone: '+1 (555) 345-6789',
      address: '108 Innovation Way, San Francisco'
    },
    {
      email: 'michael.brown@clinova.demo',
      patientId: 'PT-DEMO-003',
      fullName: 'Michael Brown',
      dateOfBirth: '1988-12-03',
      gender: 'Male',
      phone: '+1 (555) 456-7890',
      address: '350 Silicon Boulevard, Austin'
    }
  ],
  appointments: [
    {
      appointmentId: 'APT-DEMO-001',
      patientId: 'PT-DEMO-001',
      doctorId: 'DR-DEMO-001',
      date: '2026-10-14',
      time: '10:30 AM',
      reason: 'Routine seasonal checkup and medication refill review.',
      status: 'CONFIRMED'
    },
    {
      appointmentId: 'APT-DEMO-002',
      patientId: 'PT-DEMO-002',
      doctorId: 'DR-DEMO-001',
      date: '2026-10-05',
      time: '10:30 AM',
      reason: 'Follow-up consultation for thyroid panel metrics.',
      status: 'WAITING'
    },
    {
      appointmentId: 'APT-DEMO-003',
      patientId: 'PT-DEMO-003',
      doctorId: 'DR-DEMO-002',
      date: '2026-10-05',
      time: '11:30 AM',
      reason: 'Blood pressure tracking and routine ECG review.',
      status: 'CONFIRMED'
    },
    {
      appointmentId: 'APT-DEMO-004',
      patientId: 'PT-DEMO-001',
      doctorId: 'DR-DEMO-002',
      date: '2026-09-28',
      time: '02:00 PM',
      reason: 'Preventive baseline cardiovascular evaluation.',
      status: 'COMPLETED'
    },
    {
      appointmentId: 'APT-DEMO-005',
      patientId: 'PT-DEMO-001',
      doctorId: 'DR-DEMO-003',
      date: '2026-08-15',
      time: '11:00 AM',
      reason: 'Seasonal skin allergy consultation.',
      status: 'COMPLETED'
    }
  ],
  medicalRecords: [
    {
      recordId: 'REC-DEMO-001',
      patientId: 'PT-DEMO-001',
      doctorId: 'DR-DEMO-002',
      appointmentId: 'APT-DEMO-004',
      date: '2026-09-28',
      visitReason: 'Preventive baseline cardiovascular evaluation',
      diagnosis: 'Normal Sinus Rhythm • Optimal Cardiovascular Status',
      notes: 'Resting heart rate 72 bpm, BP 120/80 mmHg. Normal EKG profile.',
      prescription: 'Lifestyle maintenance • Hydration 3L/day (Demo Prescription)',
      followUp: '6 Months Routine Checkup'
    },
    {
      recordId: 'REC-DEMO-002',
      patientId: 'PT-DEMO-001',
      doctorId: 'DR-DEMO-003',
      appointmentId: 'APT-DEMO-005',
      date: '2026-08-15',
      visitReason: 'Seasonal skin allergy consultation',
      diagnosis: 'Seasonal Rhinitis & Mild Contact Dermatitis',
      notes: 'Patient exhibits minor skin flare-ups during spring pollen surge.',
      prescription: 'Cetirizine 10mg — 1 tablet daily for 14 days (Demo Prescription)',
      followUp: 'As needed'
    },
    {
      recordId: 'REC-DEMO-003',
      patientId: 'PT-DEMO-002',
      doctorId: 'DR-DEMO-001',
      date: '2026-09-15',
      visitReason: 'Thyroid panel follow-up',
      diagnosis: 'Stable Euthyroid Status',
      notes: 'TSH levels within normal target range.',
      prescription: 'Levothyroxine 50mcg daily (Demo Prescription)',
      followUp: '3 Months TSH Check'
    }
  ]
};

console.log("CLINOVA Database Seed Configuration Loaded.");
