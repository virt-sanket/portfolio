import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { defaultPortfolio } from "./src/data/defaultPortfolio"; // note: node resolving
import { PortfolioData, ContactMessage } from "./src/types";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Ensure files storage directories exist
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const PORTFOLIO_FILE = path.join(DATA_DIR, "portfolio.json");
const MESSAGES_FILE = path.join(DATA_DIR, "messages.json");

// Helper to get portfolio data
function getPortfolioData(): PortfolioData {
  if (!fs.existsSync(PORTFOLIO_FILE)) {
    fs.writeFileSync(PORTFOLIO_FILE, JSON.stringify(defaultPortfolio, null, 2));
    return defaultPortfolio;
  }
  try {
    const raw = fs.readFileSync(PORTFOLIO_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("Error reading portfolio file, returning default:", error);
    return defaultPortfolio;
  }
}

// Helper to save portfolio data
function savePortfolioData(data: PortfolioData) {
  fs.writeFileSync(PORTFOLIO_FILE, JSON.stringify(data, null, 2));
}

// Helper to get contact messages
function getMessages(): ContactMessage[] {
  if (!fs.existsSync(MESSAGES_FILE)) {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify([], null, 2));
    return [];
  }
  try {
    const raw = fs.readFileSync(MESSAGES_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("Error reading messages file, returning empty:", error);
    return [];
  }
}

// Helper to save contact messages
function saveMessages(messages: ContactMessage[]) {
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
}

// Get Admin Password (fallback to default)
const getAdminPassword = () => {
  return process.env.ADMIN_PASSWORD || "sanketadmin";
};

// Middleware for Admin Auth
const checkAdminAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized: Missing credentials" });
  }
  
  const token = authHeader.replace("Bearer ", "");
  if (token === getAdminPassword()) {
    next();
  } else {
    res.status(403).json({ error: "Forbidden: Invalid admin password" });
  }
};

// --- API Endpoints ---

// Get public portfolio content
app.get("/api/portfolio", (req, res) => {
  try {
    const data = getPortfolioData();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Login
app.post("/api/admin/login", (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }
  
  if (password === getAdminPassword()) {
    // Return the password itself as token for stateless authentication
    res.json({ success: true, token: password });
  } else {
    res.status(401).json({ success: false, error: "Incorrect password" });
  }
});

// Update portfolio elements (Admin-only)
app.post("/api/portfolio", checkAdminAuth, (req, res) => {
  try {
    const newData = req.body as PortfolioData;
    if (!newData || !newData.header || !newData.about || !newData.services || !newData.portfolio || !newData.contact) {
      return res.status(400).json({ error: "Invalid layout structure" });
    }
    savePortfolioData(newData);
    res.json({ success: true, message: "Portfolio elements successfully updated!", data: newData });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Submit Contact Message (Public)
app.post("/api/contact", (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: "Name, email and message are required" });
    }
    
    const messages = getMessages();
    const newMessage: ContactMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      message: String(message).trim(),
      createdAt: new Date().toISOString()
    };
    
    messages.push(newMessage);
    saveMessages(messages);
    
    res.json({ success: true, message: "Your message has been sent successfully!" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// View Contact Messages (Admin-only)
app.get("/api/admin/messages", checkAdminAuth, (req, res) => {
  try {
    const messages = getMessages();
    res.json(messages);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a Contact Message (Admin-only)
app.delete("/api/admin/messages/:id", checkAdminAuth, (req, res) => {
  try {
    const { id } = req.params;
    let messages = getMessages();
    const lenBefore = messages.length;
    messages = messages.filter((m) => m.id !== id);
    
    if (messages.length === lenBefore) {
      return res.status(401).json({ error: "Message not found" });
    }
    
    saveMessages(messages);
    res.json({ success: true, message: "Message deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Set up Vite / static server depending on environment
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    // Support file watching and hot reloading on index.html during design phase
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Serve index.html for all other paths to provide robust client-side SPA routing
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Portfolio Server running on http://0.0.0.0:${PORT}`);
  });
}

setupServer().catch((e) => {
  console.error("Failed to start server", e);
});
