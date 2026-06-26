const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase;
let isMock = false;

// In-Memory Database Fallback for development without Supabase keys
const mockDb = {
  websites: [],
  leads: [],
  payments: [],
  subscriptions: [],
  generation_sessions: [],
  users: [
    // Pre-create an admin user
    { id: 'admin-uuid-1234', email: 'admin@nexsite.com', user_metadata: { role: 'admin' } }
  ]
};

if (supabaseUrl && supabaseServiceKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    console.log('✅ Connected to Supabase Database successfully.');
  } catch (error) {
    console.error('❌ Failed to initialize Supabase client:', error.message);
    isMock = true;
  }
} else {
  console.warn('⚠️ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured. Running in MOCK DATABASE mode.');
  isMock = true;
}

// Wrapper class to abstract Supabase calls and fallback to Mock DB
class SupabaseService {
  constructor() {
    this.isMock = isMock;
    this.client = supabase;
  }

  // --- Websites CRUD ---
  async getWebsiteBySlug(slug) {
    if (isMock) {
      const site = mockDb.websites.find(w => w.slug === slug);
      return { data: site || null, error: null };
    }
    return await supabase
      .from('websites')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
  }

  async getWebsitesByUserId(userId) {
    if (isMock) {
      const sites = mockDb.websites.filter(w => w.user_id === userId);
      return { data: sites, error: null };
    }
    return await supabase
      .from('websites')
      .select('*')
      .eq('user_id', userId);
  }

  async getAllWebsites() {
    if (isMock) {
      return { data: mockDb.websites, error: null };
    }
    return await supabase
      .from('websites')
      .select('*')
      .order('created_at', { ascending: false });
  }

  async createWebsite(siteData) {
    if (isMock) {
      const newSite = {
        id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'draft',
        payment_status: 'pending',
        ...siteData
      };
      mockDb.websites.push(newSite);
      return { data: newSite, error: null };
    }
    return await supabase
      .from('websites')
      .insert([siteData])
      .select()
      .single();
  }

  async updateWebsite(id, updateData) {
    if (isMock) {
      const index = mockDb.websites.findIndex(w => w.id === id);
      if (index !== -1) {
        mockDb.websites[index] = {
          ...mockDb.websites[index],
          ...updateData,
          updated_at: new Date().toISOString()
        };
        return { data: mockDb.websites[index], error: null };
      }
      return { data: null, error: { message: 'Website not found' } };
    }
    return await supabase
      .from('websites')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
  }

  // --- Leads ---
  async createLead(leadData) {
    if (isMock) {
      const newLead = {
        id: 'lead-' + Math.random().toString(36).substring(2, 9),
        created_at: new Date().toISOString(),
        ...leadData
      };
      mockDb.leads.push(newLead);
      return { data: newLead, error: null };
    }
    return await supabase
      .from('leads')
      .insert([leadData])
      .select()
      .single();
  }

  async getLeadsByWebsiteId(websiteId) {
    if (isMock) {
      const leads = mockDb.leads.filter(l => l.website_id === websiteId);
      return { data: leads, error: null };
    }
    return await supabase
      .from('leads')
      .select('*')
      .eq('website_id', websiteId)
      .order('created_at', { ascending: false });
  }

  async getAllLeads() {
    if (isMock) {
      // Return leads joined with website name
      const leadsWithWebsites = mockDb.leads.map(lead => {
        const site = mockDb.websites.find(w => w.id === lead.website_id);
        return {
          ...lead,
          websites: site ? { business_name: site.business_name } : null
        };
      });
      return { data: leadsWithWebsites, error: null };
    }
    return await supabase
      .from('leads')
      .select('*, websites(business_name)')
      .order('created_at', { ascending: false });
  }

  // --- Generation Sessions ---
  async createSession(sessionData) {
    if (isMock) {
      const newSession = {
        id: 'session-' + Math.random().toString(36).substring(2, 12),
        created_at: new Date().toISOString(),
        ...sessionData
      };
      mockDb.generation_sessions.push(newSession);
      return { data: newSession, error: null };
    }
    return await supabase
      .from('generation_sessions')
      .insert([sessionData])
      .select()
      .single();
  }

  async getSessionById(id) {
    if (isMock) {
      const sess = mockDb.generation_sessions.find(s => s.id === id);
      return { data: sess || null, error: null };
    }
    return await supabase
      .from('generation_sessions')
      .select('*')
      .eq('id', id)
      .maybeSingle();
  }

  async updateSession(id, updateData) {
    if (isMock) {
      const index = mockDb.generation_sessions.findIndex(s => s.id === id);
      if (index !== -1) {
        mockDb.generation_sessions[index] = {
          ...mockDb.generation_sessions[index],
          ...updateData
        };
        return { data: mockDb.generation_sessions[index], error: null };
      }
      return { data: null, error: { message: 'Session not found' } };
    }
    return await supabase
      .from('generation_sessions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
  }

  // --- Payments & Subscriptions ---
  async createPayment(paymentData) {
    if (isMock) {
      const newPayment = {
        id: 'pay-' + Math.random().toString(36).substring(2, 9),
        created_at: new Date().toISOString(),
        ...paymentData
      };
      mockDb.payments.push(newPayment);
      return { data: newPayment, error: null };
    }
    return await supabase
      .from('payments')
      .insert([paymentData])
      .select()
      .single();
  }

  async getAllPayments() {
    if (isMock) {
      const paymentsWithWebsites = mockDb.payments.map(payment => {
        const site = mockDb.websites.find(w => w.id === payment.website_id);
        return {
          ...payment,
          websites: site ? { business_name: site.business_name } : null
        };
      });
      return { data: paymentsWithWebsites, error: null };
    }
    return await supabase
      .from('payments')
      .select('*, websites(business_name)')
      .order('created_at', { ascending: false });
  }

  // --- Auth Verification / Session Admin Checks ---
  async verifyUserToken(token) {
    if (isMock) {
      // Mock validation: accept tokens that start with "mock-token-"
      if (token && token.startsWith('mock-token-')) {
        const email = token.replace('mock-token-', '');
        const role = email.includes('admin') ? 'admin' : 'user';
        return {
          data: {
            user: {
              id: 'user-' + email.split('@')[0],
              email: email,
              user_metadata: { role }
            }
          },
          error: null
        };
      }
      return { data: { user: null }, error: { message: 'Invalid token' } };
    }

    // Verify token with Supabase Client
    return await supabase.auth.getUser(token);
  }

  // Helper to add fake signups/logins in mock mode
  async mockSignupOrLogin(email, password) {
    // Basic mock auth helper
    const user = {
      id: 'user-' + email.split('@')[0],
      email: email,
      user_metadata: { role: email.includes('admin') ? 'admin' : 'user' }
    };
    return {
      user,
      session: {
        access_token: 'mock-token-' + email,
        user
      }
    };
  }
}

module.exports = new SupabaseService();
module.exports.mockDb = mockDb; // Expose mock DB for verification/tests
