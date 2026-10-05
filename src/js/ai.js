/**
 * CLINOVA - AI Assistant ("Clinova Assistant") Engine (Stage 5 Enhanced)
 * Interactive conversational assistant for FAQs, synthetic application data queries, and navigation.
 * STRICT SECURITY RULE: Refuses real medical diagnosis with mandated disclaimer.
 * STRICT PRIVACY RULE: Respects active user session role & patient data boundaries.
 */

class ClinovaAIAssistant {
  constructor() {
    this.messages = [];
  }

  getSuggestedPrompts(role = 'PATIENT') {
    if (role === 'DOCTOR') {
      return [
        'Show my consultation queue',
        'How do I update an appointment status?',
        'How to add a synthetic medical record?'
      ];
    } else if (role === 'ADMIN') {
      return [
        'Show clinic analytics overview',
        'Where are system audit logs?',
        'How to add a new doctor?'
      ];
    }
    return [
      'Show my next appointment',
      'How do I reschedule?',
      'Find my medical records',
      'Which doctors are available?',
      'Explain my demo record'
    ];
  }

  async processUserMessage(userQuery, userSession = null) {
    const query = userQuery.trim().toLowerCase();
    const role = userSession ? userSession.role : 'GUEST';

    // 1. MANDATORY MEDICAL DIAGNOSIS SAFETY GUARDRAIL
    const medicalDiagnosisKeywords = [
      'diagnose', 'symptom', 'chest pain', 'fever', 'headache', 'cancer',
      'treatment advice', 'medicine should i take', 'what illness do i have', 'disease', 'cure',
      'what is wrong with me', 'prescribe me'
    ];
    
    if (medicalDiagnosisKeywords.some(k => query.includes(k)) && !query.includes('demo blood pressure') && !query.includes('explain my demo record')) {
      return {
        reply: `⚠️ **Medical Safety Disclaimer**:\n\n**“I can explain information shown in this demo application, but I cannot provide medical diagnosis or treatment advice.”**\n\nFor any real medical concerns or health emergencies, please consult a licensed physician or emergency medical services immediately.`,
        type: 'DISCLAIMER'
      };
    }

    // 2. APPOINTMENTS & SCHEDULE QUERYING
    if (query.includes('next appointment') || query.includes('upcoming') || query.includes('tomorrow') || query.includes('my schedule')) {
      if (!userSession) {
        return { reply: '🔒 Please sign in to your CLINOVA account to view your scheduled appointments.' };
      }
      
      const apptsRes = await window.clinovaAPI.getAppointments(userSession);
      if (apptsRes.success) {
        const appts = apptsRes.data.filter(a => a.status !== 'CANCELLED');
        if (appts.length === 0) {
          return { reply: '📅 You currently have no upcoming appointments scheduled. Click **"Book Appointment"** in the top navigation to schedule one!' };
        }
        
        const next = appts[0];
        return {
          reply: `📅 **Your Next Scheduled Appointment**:\n\n• **Doctor**: ${next.doctorName} (${next.specialization})\n• **Date & Time**: ${next.date} at ${next.time}\n• **Location**: ${next.location}\n• **Status**: *${next.status}*\n\nYou can manage or reschedule this visit under the **Appointments** tab.`
        };
      }
    }

    // 3. AVAILABLE DOCTORS QUERY
    if (query.includes('doctor') || query.includes('available') || query.includes('physician')) {
      const docRes = await window.clinovaAPI.getDoctors();
      if (docRes.success) {
        const docList = docRes.data.map(d => `• **${d.fullName}** (${d.specialization}) — ${d.experience} exp ⭐ ${d.rating}`).join('\n');
        return {
          reply: `👨‍⚕️ **Authorized Clinical Specialists at CLINOVA**:\n\n${docList}\n\nYou can book an appointment with any doctor from the **"Discover Doctors"** tab!`
        };
      }
    }

    // 4. NAVIGATION HELPERS
    if (query.includes('find my medical records') || query.includes('where are my medical records') || query.includes('records location')) {
      return {
        reply: `📄 **Medical Records Navigation**:\nYour synthetic health history, consultation summaries, and demo prescriptions are stored securely under the **"Medical Records"** tab in your navbar.\n\n*Note: Patients can strictly only view their own synthetic records.*`
      };
    }

    if (query.includes('where is my profile') || query.includes('profile')) {
      return {
        reply: `👤 **Profile Navigation**:\nClick **"Profile"** in the top navigation bar to view and update your personal information, emergency contact, and medical overview.`
      };
    }

    if (query.includes('reschedule') || query.includes('how do i reschedule')) {
      return {
        reply: `🔄 **How to Reschedule an Appointment**:\n1. Navigate to **"Appointments"**.\n2. Locate your scheduled visit.\n3. Click the **"Reschedule"** button.\n4. Select your new preferred date and time slot!`
      };
    }

    if (query.includes('cancel') || query.includes('how do i cancel')) {
      return {
        reply: `❌ **How to Cancel an Appointment**:\n1. Open **"Appointments"**.\n2. Click the **"Cancel"** button next to your appointment.\n3. Confirm cancellation in the pop-up modal.`
      };
    }

    if (query.includes('book') || query.includes('how do i book')) {
      return {
        reply: `🚀 **How to Book an Appointment**:\n1. Click **"Book Appointment"** in the navigation bar.\n2. Choose a specialization & doctor.\n3. Select your date & time slot.\n4. Enter visit reason and click **Confirm**!`
      };
    }

    // 5. EXPLAIN DEMO MEDICAL RECORDS / HEALTH METRICS
    if (query.includes('explain my demo record') || query.includes('demo blood pressure') || query.includes('health snapshot')) {
      if (!userSession) return { reply: 'Please sign in to view your Health Snapshot explanation.' };
      
      const profileRes = await window.clinovaAPI.getPatientProfile(userSession);
      const p = profileRes.success ? profileRes.data : {};
      const bp = p.healthSnapshot?.bloodPressure || '120/80 mmHg';
      const hr = p.healthSnapshot?.heartRate || '72 bpm';

      return {
        reply: `🫀 **Explanation of Your Demo Health Snapshot**:\n\n• **Blood Pressure (${bp})**: Standard synthetic resting systolic/diastolic metric within optimal baseline target.\n• **Heart Rate (${hr})**: Normal resting pulse rate.\n• **BMI (22.4 kg/m²)**: Standard healthy weight index.\n\n*Disclaimer: All health metrics displayed in CLINOVA are 100% synthetic demo values.*`
      };
    }

    // 6. UNAUTHORIZED REQUEST DENIAL GUARD
    if (query.includes('other patient') || query.includes('admin password') || query.includes('all patients data')) {
      return {
        reply: `🛡️ **Security Policy Enforcement**:\n\n**Access Denied**: As a ${role}, you are strictly prohibited from querying or accessing unauthorized system or patient records.`
      };
    }

    // DEFAULT FALLBACK RESPONSE
    return {
      reply: `🤖 **Clinova Assistant**:\nI am your automated clinic guide! You can ask me:\n• *"Show my next appointment"*\n• *"How do I reschedule?"*\n• *"Find my medical records"*\n• *"Which doctors are available?"*\n• *"Explain my demo record"*`
    };
  }
}

window.clinovaAI = new ClinovaAIAssistant();
