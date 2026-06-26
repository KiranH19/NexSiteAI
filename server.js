const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const supabaseService = require('./services/supabaseService');

// Load env variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and json body parsing
app.use(cors());
app.use(express.json());

// Import Sub-routes
const aiRouter = require('./routes/ai');
const websitesRouter = require('./routes/websites');
const leadsRouter = require('./routes/leads');
const paymentsRouter = require('./routes/payments');
const adminRouter = require('./routes/admin');

// Register API Routes
app.use('/api', aiRouter);
app.use('/api/websites', websitesRouter);
app.use('/api/leads', leadsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/admin', adminRouter);

// Register Auth Routes (Sign up / Login)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    if (supabaseService.isMock) {
      const authData = await supabaseService.mockSignupOrLogin(email, password);
      // In mock mode, add the user to our mock users list if not already there
      const exists = supabaseService.mockDb.users.find(u => u.email === email);
      if (!exists) {
        supabaseService.mockDb.users.push(authData.user);
      }
      return res.json({
        success: true,
        token: authData.session.access_token,
        user: authData.user
      });
    }

    // Call Supabase native SignUp client API
    const { data, error } = await supabaseService.client.auth.signUp({
      email,
      password,
      options: {
        data: { role: 'user' }
      }
    });

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    res.json({
      success: true,
      token: data.session?.access_token || '',
      user: data.user
    });

  } catch (error) {
    console.error('Registration API Error:', error);
    res.status(500).json({ success: false, message: 'Internal server registration error.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    if (supabaseService.isMock) {
      // In mock mode, let admin login or match simulated user
      const authData = await supabaseService.mockSignupOrLogin(email, password);
      return res.json({
        success: true,
        token: authData.session.access_token,
        user: authData.user
      });
    }

    // Call Supabase native Login client API
    const { data, error } = await supabaseService.client.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    res.json({
      success: true,
      token: data.session.access_token,
      user: data.user
    });

  } catch (error) {
    console.error('Login API Error:', error);
    res.status(500).json({ success: false, message: 'Internal server login error.' });
  }
});

// Custom dashboard lead getter (for convenience in merchant panel)
app.get('/api/leads/by-website/:websiteId', async (req, res) => {
  try {
    const { websiteId } = req.params;
    const { data: leads, error } = await supabaseService.getLeadsByWebsiteId(websiteId);
    if (error) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve website leads.' });
    }
    res.json({ success: true, leads });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server lead getter error.' });
  }
});

// Serve frontend static folders
app.use(express.static(path.join(__dirname)));

// Fallback all routes to index.html for clientside styling or render site.html directly
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'An unexpected server error occurred.'
  });
});

// Launch listener
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 NexSite SaaS MVP launched successfully!`);
  console.log(`🌐 Server running at: http://localhost:${PORT}`);
  console.log(`📁 Static files served from: ${__dirname}`);
  console.log(`====================================================`);
});
