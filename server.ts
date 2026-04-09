
import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple in-memory storage (can be replaced with a file or database)
let formConfigs: any[] = [];
let leads: any[] = [];
let users: any[] = [];
let schedules: any[] = [];

// Try to load initial data from files if they exist
const DATA_DIR = path.join(__dirname, "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

const FORMS_FILE = path.join(DATA_DIR, "forms.json");
const LEADS_FILE = path.join(DATA_DIR, "leads.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const SCHEDULES_FILE = path.join(DATA_DIR, "schedules.json");

if (fs.existsSync(FORMS_FILE)) {
  try {
    formConfigs = JSON.parse(fs.readFileSync(FORMS_FILE, "utf-8"));
  } catch (e) {
    console.error("Error loading forms", e);
  }
}

if (fs.existsSync(LEADS_FILE)) {
  try {
    leads = JSON.parse(fs.readFileSync(LEADS_FILE, "utf-8"));
  } catch (e) {
    console.error("Error loading leads", e);
  }
}

if (fs.existsSync(USERS_FILE)) {
  try {
    users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  } catch (e) {
    console.error("Error loading users", e);
  }
}

if (fs.existsSync(SCHEDULES_FILE)) {
  try {
    schedules = JSON.parse(fs.readFileSync(SCHEDULES_FILE, "utf-8"));
  } catch (e) {
    console.error("Error loading schedules", e);
  }
}

const saveData = () => {
  fs.writeFileSync(FORMS_FILE, JSON.stringify(formConfigs, null, 2));
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  fs.writeFileSync(SCHEDULES_FILE, JSON.stringify(schedules, null, 2));
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Request logging and API prefix handling middleware
  app.use((req, res, next) => {
    console.log(`[Server] Original URL: ${req.url}`);
    
    // If the URL contains /api/, strip everything before it to handle dynamic prefixes
    if (req.url.includes('/api/')) {
      const apiIndex = req.url.indexOf('/api/');
      const newUrl = req.url.substring(apiIndex);
      console.log(`[Server] Rewriting URL: ${req.url} -> ${newUrl}`);
      req.url = newUrl;
    }
    
    next();
  });

  // API Routes - Now using standard paths thanks to the middleware above
  
  app.get('/api/forms/:id', (req, res) => {
    const { id } = req.params;
    console.log(`[API] GET Form ID: ${id}`);
    const config = formConfigs.find((c) => String(c.id) === String(id));
    if (config) {
      res.json(config);
    } else {
      console.warn(`[API] Form not found: ${id}`);
      res.status(404).json({ error: "Form not found" });
    }
  });

  app.post('/api/forms', (req, res) => {
    const config = req.body;
    console.log(`[API] POST Form ID: ${config.id}`);
    if (!config.id) {
      return res.status(400).json({ error: "Missing form ID" });
    }
    
    const index = formConfigs.findIndex((c) => String(c.id) === String(config.id));
    if (index !== -1) {
      formConfigs[index] = config;
    } else {
      formConfigs.push(config);
    }
    
    saveData();
    res.json({ success: true, config });
  });

  app.get('/api/leads', (req, res) => {
    console.log(`[API] GET Leads (Count: ${leads.length})`);
    res.json(leads);
  });

  app.get('/api/users', (req, res) => {
    console.log(`[API] GET Users (Count: ${users.length})`);
    res.json(users);
  });

  app.post('/api/users', (req, res) => {
    const updatedUsers = req.body;
    console.log(`[API] POST Users (Count: ${updatedUsers.length})`);
    users = updatedUsers;
    saveData();
    res.json({ success: true });
  });

  app.post('/api/leads', (req, res) => {
    const lead = req.body;
    console.log(`[API] POST Lead Name: ${lead.name}`);
    leads.unshift(lead);
    saveData();
    res.json({ success: true, lead });
  });

  app.delete('/api/leads/:id', (req, res) => {
    const { id } = req.params;
    console.log(`[API] DELETE Lead ID: ${id}`);
    leads = leads.filter(l => String(l.id) !== String(id));
    saveData();
    res.json({ success: true });
  });

  app.delete('/api/forms/:id', (req, res) => {
    const { id } = req.params;
    console.log(`[API] DELETE Form ID: ${id}`);
    formConfigs = formConfigs.filter(f => String(f.id) !== String(id));
    saveData();
    res.json({ success: true });
  });

  // Schedule API
  app.get('/api/schedules', (req, res) => {
    const { userId } = req.query;
    console.log(`[API] GET Schedules for User: ${userId} (Total: ${schedules.length})`);
    if (userId) {
      const userSchedules = schedules.filter(s => String(s.userId) === String(userId));
      return res.json(userSchedules);
    }
    res.json(schedules);
  });

  app.post('/api/schedules', (req, res) => {
    const schedule = req.body;
    console.log(`[API] POST Schedule: ${schedule.title} for User: ${schedule.userId}`);
    if (!schedule.id && !schedule._id) {
      schedule.id = Date.now().toString() + Math.random().toString(36).substring(2, 9);
    }
    schedules.push(schedule);
    saveData();
    res.json({ success: true, schedule });
  });

  // Bulk delete multiple schedules
  app.post('/api/schedules/delete-bulk', (req, res) => {
    const { ids, userId } = req.body;
    console.log(`[API] Bulk DELETE Schedules. IDs: ${ids?.length}, User: ${userId}`);
    
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: "Invalid IDs provided" });
    }

    const initialCount = schedules.length;
    schedules = schedules.filter(s => {
      const sId = String(s.id || s._id || '');
      const isTarget = ids.includes(sId);
      
      if (isTarget) {
        // If userId is provided, only allow deleting own schedules OR legacy schedules without userId
        if (userId) {
          const sUserId = s.userId ? String(s.userId) : null;
          const reqUserId = String(userId);
          // Keep it if it has a different userId. Delete if it matches OR has no userId.
          return sUserId !== null && sUserId !== reqUserId;
        }
        // If no userId provided, delete it (admin or system call)
        return false;
      }
      return true;
    });

    const deletedCount = initialCount - schedules.length;
    console.log(`[API] Bulk Deleted ${deletedCount} schedules. Remaining: ${schedules.length}`);
    saveData();
    res.json({ success: true, deletedCount });
  });

  // Bulk delete all schedules for a specific user
  app.delete('/api/schedules/all', (req, res) => {
    const { userId } = req.query;
    console.log(`[API] DELETE All Schedules for User: ${userId}`);
    
    const initialCount = schedules.length;
    if (userId) {
      const reqUserId = String(userId);
      // Keep items that belong to other users. Delete items that belong to this user OR have no userId.
      schedules = schedules.filter(s => {
        const sUserId = s.userId ? String(s.userId) : null;
        return sUserId !== null && sUserId !== reqUserId;
      });
    } else {
      schedules = [];
    }
    
    const deletedCount = initialCount - schedules.length;
    console.log(`[API] Deleted ${deletedCount} schedules. Remaining: ${schedules.length}`);
    saveData();
    res.json({ success: true, deletedCount });
  });

  app.delete('/api/schedules/:id', (req, res) => {
    const { id } = req.params;
    const { userId } = req.query;
    console.log(`[API] DELETE Schedule ID: ${id}, User: ${userId}`);
    
    const initialCount = schedules.length;
    schedules = schedules.filter(s => {
      const sId = String(s.id || s._id || '');
      const isMatch = sId === String(id);
      
      if (isMatch) {
        if (userId) {
          const sUserId = s.userId ? String(s.userId) : null;
          const reqUserId = String(userId);
          // Keep it if it has a different userId. Delete if it matches OR has no userId.
          return sUserId !== null && sUserId !== reqUserId;
        }
        return false;
      }
      return true;
    });
    
    const deletedCount = initialCount - schedules.length;
    console.log(`[API] Deleted ${deletedCount} schedules. Remaining: ${schedules.length}. Match found: ${deletedCount > 0}`);
    saveData();
    res.json({ success: true, deletedCount });
  });

  app.put('/api/schedules/:id', (req, res) => {
    const { id } = req.params;
    const updatedSchedule = req.body;
    console.log(`[API] PUT Schedule ID: ${id}`);
    const index = schedules.findIndex(s => String(s.id || s._id) === String(id));
    if (index !== -1) {
      schedules[index] = { ...schedules[index], ...updatedSchedule };
      saveData();
      res.json({ success: true, schedule: schedules[index] });
    } else {
      console.warn(`[API] Schedule not found for update: ${id}`);
      res.status(404).json({ error: "Schedule not found" });
    }
  });

  // Email Notification Integration (Resend)
  app.post('/api/send-email', async (req, res) => {
    const { to, subject, html, userId } = req.body;
    
    let finalTo = to;
    if (!finalTo && userId) {
      const user = users.find(u => String(u.id) === String(userId));
      if (user) {
        finalTo = user.loginId;
      }
    }

    if (!finalTo) {
      console.warn(`[API] Email Send Request failed: No recipient found for userId ${userId}`);
      return res.status(400).json({ error: "Recipient email (to) or valid userId is required" });
    }

    console.log(`[API] Email Send Request to: ${finalTo} (User: ${userId || 'system'})`);

    const RESEND_API_KEY = process.env.RESEND_API_KEY || "re_EZBxeziH_Nws9winQTcHvR15skxsXjyx3";

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: "onboarding@resend.dev",
          to: finalTo,
          subject: subject,
          html: html
        })
      });

      const result = await response.json();
      console.log("[API] Resend Result:", result);
      res.json({ success: true, result });
    } catch (error: any) {
      console.error("[API] Resend Error:", error);
      res.status(500).json({ 
        error: "Failed to send email", 
        details: error.message 
      });
    }
  });

  // Solapi (Kakao Alimtalk) Integration
  app.post('/api/kakao/send', async (req, res) => {
    const { phone, message, templateId, pfid, apiKey: userApiKey, apiSecret: userApiSecret, senderNumber: userSenderNumber, userId } = req.body;
    
    console.log(`[API] Kakao Send Request to: ${phone} (User: ${userId || 'system'})`);

    let finalApiKey = userApiKey;
    let finalApiSecret = userApiSecret;
    let finalSenderNumber = userSenderNumber;
    let finalPfid = pfid;

    // Look up user-specific config if userId is provided
    if (userId) {
      const user = users.find(u => String(u.id) === String(userId));
      if (user && user.solapiConfig) {
        finalApiKey = finalApiKey || user.solapiConfig.apiKey;
        finalApiSecret = finalApiSecret || user.solapiConfig.apiSecret;
        finalSenderNumber = finalSenderNumber || user.solapiConfig.senderNumber;
        finalPfid = finalPfid || user.solapiConfig.pfid;
      }
    }

    const apiKey = finalApiKey || process.env.SOLAPI_API_KEY;
    const apiSecret = finalApiSecret || process.env.SOLAPI_API_SECRET;
    const senderNumber = finalSenderNumber || process.env.SOLAPI_SENDER_NUMBER;
    const solapiPfid = finalPfid || process.env.SOLAPI_PFID;

    if (!apiKey || !apiSecret) {
      console.warn("[API] Solapi credentials missing. Falling back to simulation.");
      return res.json({ 
        success: true, 
        simulated: true, 
        messageId: 'sim_' + Math.random().toString(36).substr(2, 9) 
      });
    }

    try {
      // Dynamic import to avoid issues if package isn't fully ready
      const { SolapiMessageService } = await import("solapi");
      const messageService = new SolapiMessageService(apiKey, apiSecret);

      const result = await messageService.send({
        to: phone.replace(/-/g, ""),
        from: senderNumber,
        kakaoOptions: {
          pfId: solapiPfid,
          templateId: templateId,
        },
        text: message
      });

      console.log("[API] Solapi Send Result:", result);
      res.json({ success: true, result });
    } catch (error: any) {
      console.error("[API] Solapi Send Error:", error);
      res.status(500).json({ 
        error: "Failed to send Kakao message", 
        details: error.message 
      });
    }
  });

  // Vite middleware for development
  const isDev = process.env.NODE_ENV !== "production";
  const distPath = path.join(__dirname, "dist");
  const hasDist = fs.existsSync(distPath);

  if (isDev || !hasDist) {
    console.log(`[Server] Starting in ${isDev ? 'development' : 'production (no dist)'} mode with Vite middleware`);
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log(`[Server] Starting in production mode, serving from ${distPath}`);
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Error handling middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[Server Error]', err);
    res.status(500).json({ error: 'Internal Server Error' });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  });
}

startServer();
