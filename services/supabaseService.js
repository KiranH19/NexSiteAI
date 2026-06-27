// services/supabaseService.js - All Supabase DB operations

const { createClient } = require('@supabase/supabase-js');

// ─── Safe client init (won't crash if env vars missing) ──────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;

function getClient() {
  if (supabase) return supabase;
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn('⚠️  SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured. Running in MOCK DATABASE mode.');
    return null;
  }
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    return supabase;
  } catch (err) {
    console.error('❌ Supabase init failed:', err.message);
    return null;
  }
}

// ─── Mock DB for when Supabase isn't configured ───────────────────────────────
const mockDB = {
  sessions:  {},
  websites:  {},
  leads:     [],
  payments:  [],
  subs:      []
};

function mockSession(data) {
  const id = 'mock-' + Date.now();
  mockDB.sessions[id] = { id, ...data, created_at: new Date().toISOString() };
  return mockDB.sessions[id];
}

// ─── Generation Sessions ──────────────────────────────────────────────────────

async function createSession(businessData, generatedContent, template, ownerId = null) {
  const db = getClient();
  if (!db) return mockSession({ business_data: businessData, generated_content: generatedContent, selected_template: template || 'business', owner_id: ownerId });

  const { data, error } = await db
    .from('generation_sessions')
    .insert([{ business_data: businessData, generated_content: generatedContent, selected_template: template || 'business', owner_id: ownerId }])
    .select()
    .single();
  if (error) throw new Error(`Session create failed: ${error.message}`);
  return data;
}

async function getSession(sessionId) {
  const db = getClient();
  if (!db) {
    const s = mockDB.sessions[sessionId];
    if (!s) throw new Error('Session not found');
    return s;
  }
  const { data, error } = await db.from('generation_sessions').select('*').eq('id', sessionId).single();
  if (error) throw new Error(`Session not found: ${error.message}`);
  return data;
}

async function updateSessionTemplate(sessionId, template) {
  const db = getClient();
  if (!db) {
    if (mockDB.sessions[sessionId]) mockDB.sessions[sessionId].selected_template = template;
    return mockDB.sessions[sessionId];
  }
  const { data, error } = await db.from('generation_sessions').update({ selected_template: template }).eq('id', sessionId).select().single();
  if (error) throw new Error(`Session update failed: ${error.message}`);
  return data;
}

// ─── Websites ─────────────────────────────────────────────────────────────────

async function createWebsite(websiteData) {
  const db = getClient();
  if (!db) {
    const id = 'mock-site-' + Date.now();
    mockDB.websites[id] = { id, ...websiteData, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    return mockDB.websites[id];
  }
  const { data, error } = await db.from('websites').insert([websiteData]).select().single();
  if (error) throw new Error(`Website create failed: ${error.message}`);
  return data;
}

async function getWebsiteBySlug(slug) {
  const db = getClient();
  if (!db) return Object.values(mockDB.websites).find(w => w.slug === slug && w.status === 'published') || null;
  const { data, error } = await db.from('websites').select('*').eq('slug', slug).eq('status', 'published').single();
  if (error) return null;
  return data;
}

async function getWebsiteById(id) {
  const db = getClient();
  if (!db) return mockDB.websites[id] || null;
  const { data, error } = await db.from('websites').select('*').eq('id', id).single();
  if (error) return null;
  return data;
}

async function updateWebsiteStatus(websiteId, status, paymentStatus) {
  const db = getClient();
  const update = { status };
  if (paymentStatus) update.payment_status = paymentStatus;
  if (!db) {
    if (mockDB.websites[websiteId]) Object.assign(mockDB.websites[websiteId], update);
    return mockDB.websites[websiteId];
  }
  const { data, error } = await db.from('websites').update(update).eq('id', websiteId).select().single();
  if (error) throw new Error(`Website update failed: ${error.message}`);
  return data;
}

async function getAllWebsites() {
  const db = getClient();
  if (!db) return Object.values(mockDB.websites).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
  const { data, error } = await db.from('websites').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(`Fetch websites failed: ${error.message}`);
  return data;
}

// ─── Leads ────────────────────────────────────────────────────────────────────

async function createLead(leadData) {
  const db = getClient();
  if (!db) {
    const lead = { id: 'mock-lead-' + Date.now(), ...leadData, created_at: new Date().toISOString() };
    mockDB.leads.push(lead);
    return lead;
  }
  const { data, error } = await db.from('leads').insert([leadData]).select().single();
  if (error) throw new Error(`Lead create failed: ${error.message}`);
  return data;
}

async function getLeadsByWebsite(websiteId) {
  const db = getClient();
  if (!db) return mockDB.leads.filter(l => l.website_id === websiteId);
  const { data, error } = await db.from('leads').select('*').eq('website_id', websiteId).order('created_at', { ascending: false });
  if (error) throw new Error(`Fetch leads failed: ${error.message}`);
  return data;
}

async function getAllLeads() {
  const db = getClient();
  if (!db) return mockDB.leads.slice().reverse();
  const { data, error } = await db.from('leads').select('*, websites(business_name, slug)').order('created_at', { ascending: false });
  if (error) throw new Error(`Fetch all leads failed: ${error.message}`);
  return data;
}

// ─── Payments ─────────────────────────────────────────────────────────────────

async function createPaymentRecord(paymentData) {
  const db = getClient();
  if (!db) {
    const p = { id: 'mock-pay-' + Date.now(), ...paymentData, created_at: new Date().toISOString() };
    mockDB.payments.push(p);
    return p;
  }
  const { data, error } = await db.from('payments').insert([paymentData]).select().single();
  if (error) throw new Error(`Payment record failed: ${error.message}`);
  return data;
}

async function updatePaymentRecord(orderId, updates) {
  const db = getClient();
  if (!db) {
    const p = mockDB.payments.find(p => p.razorpay_order_id === orderId);
    if (p) Object.assign(p, updates);
    return p;
  }
  const { data, error } = await db.from('payments').update(updates).eq('razorpay_order_id', orderId).select().single();
  if (error) throw new Error(`Payment update failed: ${error.message}`);
  return data;
}

async function getPaymentByOrderId(orderId) {
  const db = getClient();
  if (!db) return mockDB.payments.find(p => p.razorpay_order_id === orderId) || null;
  const { data, error } = await db.from('payments').select('*').eq('razorpay_order_id', orderId).single();
  if (error) return null;
  return data;
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

async function createSubscription(subData) {
  const db = getClient();
  if (!db) {
    const s = { id: 'mock-sub-' + Date.now(), ...subData, created_at: new Date().toISOString() };
    mockDB.subs.push(s);
    return s;
  }
  const { data, error } = await db.from('subscriptions').insert([subData]).select().single();
  if (error) throw new Error(`Subscription create failed: ${error.message}`);
  return data;
}

// ─── Admin Stats ──────────────────────────────────────────────────────────────

async function getAdminStats() {
  const db = getClient();
  if (!db) {
    const sites = Object.values(mockDB.websites);
    return {
      totalWebsites:   sites.length,
      totalLeads:      mockDB.leads.length,
      paidWebsites:    sites.filter(w => w.payment_status === 'paid').length,
      pendingWebsites: sites.filter(w => w.payment_status === 'pending').length
    };
  }
  const [websitesRes, leadsRes, paidRes, pendingRes] = await Promise.all([
    db.from('websites').select('id', { count: 'exact', head: true }),
    db.from('leads').select('id', { count: 'exact', head: true }),
    db.from('websites').select('id', { count: 'exact', head: true }).eq('payment_status', 'paid'),
    db.from('websites').select('id', { count: 'exact', head: true }).eq('payment_status', 'pending')
  ]);
  return {
    totalWebsites:   websitesRes.count || 0,
    totalLeads:      leadsRes.count    || 0,
    paidWebsites:    paidRes.count     || 0,
    pendingWebsites: pendingRes.count  || 0
  };
}

module.exports = {
  createSession, getSession, updateSessionTemplate,
  createWebsite, getWebsiteBySlug, getWebsiteById, updateWebsiteStatus, getAllWebsites,
  createLead, getLeadsByWebsite, getAllLeads,
  createPaymentRecord, updatePaymentRecord, getPaymentByOrderId,
  createSubscription,
  getAdminStats
};
