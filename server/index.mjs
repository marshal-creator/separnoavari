import dotenv from "dotenv";

dotenv.config();

import express from "express";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import multer from "multer";
import path from "path";
import fs from "fs";
import cookieParser from "cookie-parser";

const app = express();
const port = 5000;

// Environment variables for file serving
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.resolve("./uploads");
const ADMIN_FILE_ROUTE_PREFIX = process.env.ADMIN_FILE_ROUTE_PREFIX || "/api/admin/files";

// Configure multer for file uploads
const sanitizeFilenameComponent = (value) => {
  return String(value ?? "")
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 100);
};

const toPublicPath = (p) =>
  p
    ? `/${String(p)
        .replace(path.resolve("."), "")
        .replace(/\\/g, "/")
        .replace(/^\/+/, "")}`
    : null;

const safeParseJSON = (value, fallback = null) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch (e) {
    return fallback;
  }
};


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const baseDir = path.resolve("./uploads");
    const userEmail = req.user?.email || req.body?.contact_email;
    if (!userEmail) {
      return cb(new Error("USER_EMAIL_MISSING"));
    }
    const normalizedEmail = String(userEmail).trim();
    const safeName = normalizedEmail.replace(/[^a-zA-Z0-9@._-]+/g, "_");
    if (!safeName) {
      return cb(new Error("USER_EMAIL_INVALID"));
    }
    const userDir = path.join(baseDir, safeName);
    try {
      fs.mkdirSync(userDir, { recursive: true });
    } catch (e) {
      return cb(e);
    }
    req.multerUploadDir = userDir;
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const ideaTitleRaw = req.body?.idea_title ?? "";
    const submitterRaw =
      req.body?.submitter_full_name ??
      req.user?.name ??
      req.user?.email ??
      "";
    const ideaTitle = sanitizeFilenameComponent(ideaTitleRaw) || "idea";
    const submitterName = sanitizeFilenameComponent(submitterRaw) || "user";
    const timestamp = new Date();
    const year = String(timestamp.getFullYear());
    const month = String(timestamp.getMonth() + 1).padStart(2, "0");
    const day = String(timestamp.getDate()).padStart(2, "0");
    const hours = String(timestamp.getHours()).padStart(2, "0");
    const minutes = String(timestamp.getMinutes()).padStart(2, "0");
    const seconds = String(timestamp.getSeconds()).padStart(2, "0");
    const dateStamp = year + month + day + "-" + hours + minutes + seconds;
    const baseNameArray = [ideaTitle, submitterName, dateStamp].filter(Boolean);
    const baseName = baseNameArray.join("_") || "file";
    const ext = path.extname(file.originalname) || "";
    const uploadDir = req.multerUploadDir || path.resolve("./uploads");
    let finalName = baseName + ext;
    let candidatePath = path.join(uploadDir, finalName);
    let counter = 1;
    while (fs.existsSync(candidatePath)) {
      finalName = baseName + "_" + counter + ext;
      candidatePath = path.join(uploadDir, finalName);
      counter += 1;
    }
    cb(null, finalName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB per file
  fileFilter: (req, file, cb) => {
    // Enforce per-field mime types
    if (file.fieldname === "pdf_file") {
      if (file.mimetype === "application/pdf") return cb(null, true);
      return cb(new Error("INVALID_PDF_TYPE"));
    }
    if (file.fieldname === "word_file") {
      if (
        file.mimetype === "application/msword" ||
        file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      )
        return cb(null, true);
      return cb(new Error("INVALID_WORD_TYPE"));
    }
    // Unknown field
    return cb(new Error("INVALID_FIELD"));
  },
});

// Initialize database
let db;
async function initializeDb() {
  db = await open({
    filename: "./database.db",
    driver: sqlite3.Database,
  });
  // Ensure admins table exists and seed default admins
  await db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    );
    CREATE TABLE IF NOT EXISTS judges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      username TEXT UNIQUE,
      password TEXT,
      last_login DATETIME
    );
    CREATE TABLE IF NOT EXISTS judge_projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      judge_id INTEGER NOT NULL,
      description TEXT,
      pdf_path TEXT,
      status TEXT DEFAULT 'PENDING',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME,
      decision_at DATETIME,
      final_score INTEGER,
      evaluation TEXT,
      FOREIGN KEY (judge_id) REFERENCES judges(id)
    );
  `);
  await ensureJudgeProjectSchema();
  const a1 = await db.get(`SELECT id FROM admins WHERE username = ?`, ["admin1"]);
  if (!a1) {
    await db.run(`INSERT INTO admins (username, password) VALUES (?, ?)`, ["admin1", "123456"]);
  }
  const a2 = await db.get(`SELECT id FROM admins WHERE username = ?`, ["admin2"]);
  if (!a2) {
    await db.run(`INSERT INTO admins (username, password) VALUES (?, ?)`, ["admin2", "654321"]);
  }
}

async function ensureJudgeProjectSchema() {
  const columns = await db.all(`PRAGMA table_info(judge_projects)`);
  const has = new Set(columns.map((c) => c.name));
  if (!has.has("final_score")) {
    await db.exec(`ALTER TABLE judge_projects ADD COLUMN final_score INTEGER`);
  }
  if (!has.has("evaluation")) {
    await db.exec(`ALTER TABLE judge_projects ADD COLUMN evaluation TEXT`);
  }
  if (!has.has("decision_at")) {
    await db.exec(`ALTER TABLE judge_projects ADD COLUMN decision_at DATETIME`);
  }
}

// Start server only after DB is ready to avoid race conditions
async function startServer() {
  await initializeDb();
  await ensureAdminsReady();
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}
startServer();

// Ensure admins table and defaults exist (can be reused on-demand)
async function ensureAdminsReady() {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    );
  `);
  // Upsert default admins so passwords are correct even if rows exist from before
  await db.run(
    `INSERT INTO admins (username, password) VALUES (?, ?) ON CONFLICT(username) DO UPDATE SET password=excluded.password`,
    ["admin1", "123456"]
  );
  await db.run(
    `INSERT INTO admins (username, password) VALUES (?, ?) ON CONFLICT(username) DO UPDATE SET password=excluded.password`,
    ["admin2", "654321"]
  );
}

// Middleware
const rawAllowedOrigins = (process.env.ALLOWED_ORIGINS || "https://www.separnoavari.ir,https://separnoavari.ir,http://localhost:5173,http://127.0.0.1:5173")
  .split(/[,\s]+/)
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = new Set(rawAllowedOrigins);
const isProduction = process.env.NODE_ENV === "production";

if (isProduction) {
  app.set("trust proxy", 1);
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin)) return callback(null, true);
      console.warn("Blocked CORS origin:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  session({
    secret: "stuff-happens-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // dev: false so it works on http://localhost
      httpOnly: true,
      sameSite: "lax", // with Vite proxy, requests are same-origin so Lax is fine
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Block public access to /uploads - files must be accessed through secure admin route
app.use("/uploads", (req, res) => {
  res.status(403).json({ error: "Direct access to uploads is not allowed. Use the admin file route." });
});

// Separate multer for judge project PDFs (does not rely on req.user)
const judgeProjectStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const baseDir = path.resolve("./uploads/judges");
      const judgeId = req.params?.judgeId || req.body?.judge_id;
      const folder = path.join(baseDir, String(judgeId || "unknown"));
      fs.mkdirSync(folder, { recursive: true });
      cb(null, folder);
    } catch (e) {
      cb(e);
    }
  },
  filename: (req, file, cb) => {
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const base = sanitizeFilenameComponent(
      (req.body?.description || "project") + "_" + ts
    );
    const ext = path.extname(file.originalname) || ".pdf";
    cb(null, `${base}${ext}`);
  },
});
const judgeProjectUpload = multer({
  storage: judgeProjectStorage,
  limits: { fileSize: 30 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") return cb(null, true);
    return cb(new Error("INVALID_PDF_TYPE"));
  },
});

// Passport configuration
passport.use(
  new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      console.log("Attempting login with email:", email);
      try {
        const user = await db.get("SELECT * FROM users WHERE email = ?", [
          email,
        ]);
        if (!user) {
          console.log("User not found for email:", email);
          return done(null, false, { message: "Invalid email" });
        }
        console.log("User found:", user);
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
          console.log("Password mismatch for email:", email);
          return done(null, false, { message: "Invalid password" });
        }
        console.log("Login successful for email:", email);
        return done(null, user);
      } catch (err) {
        console.error("Error during login:", err);
        return done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serializing user ID:", user.id);
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  console.log("Deserializing user with ID:", id);
  try {
    const user = await db.get("SELECT * FROM users WHERE id = ?", [id]);
    console.log("Deserialized user:", user);
    done(null, user);
  } catch (err) {
    console.error("Deserialize error:", err);
    done(err);
  }
});

// Authentication middleware with detailed logging
function ensureAuthenticated(req, res, next) {
  console.log("=== Authentication Check ===");
  console.log("Session ID:", req.sessionID);
  console.log("Session object:", req.session);
  console.log("Is authenticated:", req.isAuthenticated());
  if (req.session && req.session.passport) {
    console.log("Passport user ID in session:", req.session.passport.user);
  }
  console.log("req.user:", req.user);
  console.log("Cookies:", req.cookies);
  console.log("====================");
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized" });
}

// Admin auth middleware
function ensureAdmin(req, res, next) {
  const admin = req.session?.admin;
  if (admin && admin.id) {
    return next();
  }
  return res.status(403).json({ error: "AdminUnauthorized" });
}

// Judge auth middleware
function ensureJudge(req, res, next) {
  const judge = req.session?.judge;
  if (judge && judge.id) {
    return next();
  }
  return res.status(401).json({ error: "JudgeUnauthorized" });
}

// Routes
app.post("/api/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      console.error("Authentication error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    if (!user) {
      console.log("Authentication failed:", info.message);
      return res.status(401).json({ error: info.message });
    }
    req.logIn(user, (err) => {
      if (err) {
        console.error("Login error:", err);
        return res.status(500).json({ error: "Login failed" });
      }
      console.log("User logged in successfully, session saved");
      res.json({ id: user.id, email: user.email });
    });
  })(req, res, next);
});

app.post("/api/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: "Logout failed" });
    res.json({ message: "Logout successful" });
  });
});

// ===== Admin Auth Routes =====
app.post("/api/admin/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Missing credentials" });
  }
  try {
    // Make sure admins table and seeds exist even if init didn't run yet
    await ensureAdminsReady();

    const uname = String(username).trim();
    const p = String(password);
    const admin = await db.get("SELECT id, username, password FROM admins WHERE username = ?", [uname]);
    if (!admin) {
      console.warn("Admin login failed: user not found", { uname });
      return res.status(401).json({ error: "Invalid credentials" });
    }
    if (p !== String(admin.password)) {
      console.warn("Admin login failed: password mismatch", { uname });
      return res.status(401).json({ error: "Invalid credentials" });
    }
    // Regenerate session to avoid fixation and ensure cookie issuance
    req.session.regenerate((regenErr) => {
      if (regenErr) {
        console.error("Session regenerate failed", regenErr);
        return res.status(500).json({ error: "Session error" });
      }
      req.session.admin = { id: admin.id, username: admin.username };
      req.session.save((saveErr) => {
        if (saveErr) {
          console.error("Session save failed", saveErr);
          return res.status(500).json({ error: "Session error" });
        }
        return res.json({ id: admin.id, username: admin.username });
      });
    });
  } catch (e) {
    console.error("/api/admin/login error", e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/admin/logout", (req, res) => {
  if (req.session) {
    delete req.session.admin;
  }
  return res.json({ message: "Admin logged out" });
});

app.get("/api/admin/me", (req, res) => {
  const admin = req.session?.admin || null;
  return res.json({ admin });
});

// Example protected admin API route (can add more later)
app.get("/api/admin/protected-check", ensureAdmin, (req, res) => {
  res.json({ ok: true });
});

// Debug helper: list admins (no secrets); remove in production
app.get("/api/admin/_debug_list", async (req, res) => {
  try {
    const rows = await db.all(`SELECT id, username FROM admins ORDER BY id`);
    res.json({ admins: rows });
  } catch (e) {
    res.status(500).json({ error: "debug_failed" });
  }
});

// ===== Judges (Admin) =====
// Create judge
app.post("/api/admin/judges", ensureAdmin, async (req, res) => {
  const { name, username, password } = req.body || {};
  if (!name || !username || !password) {
    return res.status(400).json({ error: "Missing fields" });
  }
  try {
    const r = await db.run(
      `INSERT INTO judges (name, username, password) VALUES (?, ?, ?)`,
      [String(name).trim(), String(username).trim(), String(password)]
    );
    const judge = await db.get(`SELECT id, name, username FROM judges WHERE id = ?`, [r.lastID]);
    return res.status(201).json(judge);
  } catch (e) {
    if (String(e?.message || "").includes("UNIQUE")) {
      return res.status(400).json({ error: "Username already exists" });
    }
    console.error("create judge error", e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// List judges (basic info + counts)
app.get("/api/admin/judges", ensureAdmin, async (req, res) => {
  try {
    const judges = await db.all(`
      SELECT j.id, j.name, j.username,
             (SELECT COUNT(1) FROM judge_projects p WHERE p.judge_id = j.id) as projectCount
      FROM judges j
      ORDER BY j.id DESC
    `);
    res.json(judges);
  } catch (e) {
    res.status(500).json({ error: "Failed to load judges" });
  }
});

// Admin: overview of all judge projects with scores
app.get("/api/admin/projects", ensureAdmin, async (req, res) => {
  try {
    const rows = await db.all(`
      SELECT p.*, j.name as judge_name, j.username as judge_username
      FROM judge_projects p
      LEFT JOIN judges j ON j.id = p.judge_id
      ORDER BY p.created_at DESC
    `);
    const out = rows.map((r) => ({
      id: r.id,
      judgeId: r.judge_id,
      judgeName: r.judge_name,
      judgeUsername: r.judge_username,
      description: r.description,
      status: r.status,
      final_score: r.final_score ?? null,
      evaluation: safeParseJSON(r.evaluation),
      created_at: r.created_at,
      updated_at: r.updated_at,
      decision_at: r.decision_at,
      pdf_url: toPublicPath(r.pdf_path),
    }));
    res.json(out);
  } catch (e) {
    console.error("admin projects overview error", e);
    res.status(500).json({ error: "Failed to load projects" });
  }
});

// Assign project to judge with PDF
app.post(
  "/api/admin/judges/:judgeId/projects",
  ensureAdmin,
  (req, res, next) => {
    const handler = judgeProjectUpload.single("pdf");
    handler(req, res, (err) => {
      if (err) {
        if (err.message === "INVALID_PDF_TYPE") {
          return res.status(400).json({ error: "Only PDF is allowed" });
        }
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ error: "PDF must be < 30MB" });
        }
        return res.status(400).json({ error: "Upload failed" });
      }
      next();
    });
  },
  async (req, res) => {
    const { judgeId } = req.params;
    const { description } = req.body || {};
    const file = req.file;
    if (!description || !file) {
      return res.status(400).json({ error: "Missing description or file" });
    }
    try {
      const judge = await db.get(`SELECT id FROM judges WHERE id = ?`, [Number(judgeId)]);
      if (!judge) {
        return res.status(404).json({ error: "Judge not found" });
      }
      const rel = (p) =>
        p ? p.replace(path.resolve("."), "").replace(/\\/g, "/").replace(/^\//, "") : null;
      const r = await db.run(
        `INSERT INTO judge_projects (judge_id, description, pdf_path, status, final_score, evaluation, decision_at) VALUES (?, ?, ?, 'PENDING', NULL, NULL, NULL)`,
        [Number(judgeId), String(description), rel(file.path)]
      );
      const project = await db.get(`SELECT * FROM judge_projects WHERE id = ?`, [r.lastID]);
      res.status(201).json({
        ...project,
        pdf_url: toPublicPath(project.pdf_path),
      });
    } catch (e) {
      console.error("assign project error", e);
      res.status(500).json({ error: "Failed to assign project" });
    }
  }
);

// List projects for a judge (admin view)
app.get("/api/admin/judges/:judgeId/projects", ensureAdmin, async (req, res) => {
  const { judgeId } = req.params;
  try {
    const rows = await db.all(`SELECT * FROM judge_projects WHERE judge_id = ? ORDER BY created_at DESC`, [Number(judgeId)]);
    const out = rows.map((r) => ({
      ...r,
      pdf_url: toPublicPath(r.pdf_path),
      final_score: r.final_score ?? null,
      evaluation: safeParseJSON(r.evaluation),
    }));
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: "Failed to load projects" });
  }
});

// Update project (admin): status, reassign, description
app.patch("/api/admin/projects/:projectId", ensureAdmin, async (req, res) => {
  const { projectId } = req.params;
  const { status, judge_id, description } = req.body || {};
  try {
    const now = new Date().toISOString();
    await db.run(
      `UPDATE judge_projects SET 
        status = COALESCE(?, status),
        judge_id = COALESCE(?, judge_id),
        description = COALESCE(?, description),
        updated_at = ?
       WHERE id = ?`,
      [status ?? null, judge_id ?? null, description ?? null, now, Number(projectId)]
    );
    const row = await db.get(`SELECT * FROM judge_projects WHERE id = ?`, [Number(projectId)]);
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: "Failed to update project" });
  }
});

// Delete project (admin)
app.delete("/api/admin/projects/:projectId", ensureAdmin, async (req, res) => {
  const { projectId } = req.params;
  try {
    await db.run(`DELETE FROM judge_projects WHERE id = ?`, [Number(projectId)]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to delete project" });
  }
});

// ===== Secure Admin File Serving =====
// GET /api/admin/files/:owner/* - Serve files securely with admin-only access
// Use app.use with a middleware to catch all paths after /api/admin/files/:owner/
app.use(`${ADMIN_FILE_ROUTE_PREFIX}/:owner`, ensureAdmin, (req, res, next) => {
  // Only handle GET requests
  if (req.method !== 'GET') {
    return next();
  }

  try {
    // Express automatically decodes route parameters like :owner
    // So req.params.owner is already decoded (e.g., user@email.com, not user%40email.com)
    let owner = req.params.owner;
    
    // If somehow it's still encoded, decode it (shouldn't happen, but safe)
    if (owner && owner.includes('%')) {
      try {
        owner = decodeURIComponent(owner);
      } catch (e) {
        // Already decoded or invalid
      }
    }
    
    if (!owner || owner.includes('..') || owner.includes('/') || owner.includes('\\')) {
      return res.status(400).json({ error: "Invalid owner parameter" });
    }

    // Get the filename from the remaining path
    // When using app.use('/api/admin/files/:owner', ...), req.path is the remaining path
    // after the matched route. For /api/admin/files/user@email.com/filename.pdf,
    // req.path will be '/filename.pdf' (still URL-encoded by Express)
    let filenameSegment = req.path;
    
    // Remove leading slash
    if (filenameSegment.startsWith('/')) {
      filenameSegment = filenameSegment.slice(1);
    }
    
    if (!filenameSegment) {
      return res.status(400).json({ error: "Filename required" });
    }
    
    // Remove query string if present
    const queryIndex = filenameSegment.indexOf('?');
    if (queryIndex !== -1) {
      filenameSegment = filenameSegment.slice(0, queryIndex);
    }
    
    // Decode the filename ONCE
    // Files are stored with real UTF-8 Persian characters on disk
    // The URL segment should be fully URL-encoded, so we decode it once
    let filename;
    try {
      // Try decoding - this should work if the URL is properly encoded
      filename = decodeURIComponent(filenameSegment);
    } catch (e) {
      // If decoding fails, it might be:
      // 1. Already decoded (shouldn't happen but handle it)
      // 2. Malformed encoding
      // 3. Mixed encoding (some parts decoded, some encoded)
      console.warn("Failed to decode filename segment, attempting recovery:", filenameSegment);
      
      // If it contains both % and Persian chars, it's mixed - try to fix it
      if (filenameSegment.includes('%') && /[\u0600-\u06FF\u200C\u200D]/.test(filenameSegment)) {
        // Mixed encoding - decode just the encoded parts
        // This handles cases where some characters are already decoded
        filename = filenameSegment.replace(/%([0-9A-F]{2})/gi, (match) => {
          try {
            return decodeURIComponent(match);
          } catch {
            return match;
          }
        });
      } else {
        // Use as-is (might already be decoded)
        filename = filenameSegment;
      }
    }
    
    if (!filename) {
      return res.status(400).json({ error: "Filename required" });
    }

    // Sanitize filename - reject path traversal attempts
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: "Path traversal not allowed" });
    }

    // Construct file path safely within UPLOADS_DIR
    const filePath = path.join(UPLOADS_DIR, owner, filename);
    const normalizedPath = path.normalize(filePath);

    // Security check: ensure file is within UPLOADS_DIR/owner
    const ownerDir = path.join(UPLOADS_DIR, owner);
    const normalizedOwnerDir = path.normalize(ownerDir);
    if (!normalizedPath.startsWith(normalizedOwnerDir)) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Check if file exists
    // Note: fs.existsSync works with UTF-8 filenames on Windows/Linux
    if (!fs.existsSync(normalizedPath)) {
      // Log for debugging Persian filename issues
      console.warn("File not found:", {
        normalizedPath,
        filename,
        owner,
        exists: fs.existsSync(path.dirname(normalizedPath))
      });
      return res.status(404).json({ error: "File not found" });
    }

    const stats = fs.statSync(normalizedPath);
    if (!stats.isFile()) {
      return res.status(404).json({ error: "Not a file" });
    }

    // Determine MIME type from extension
    const ext = path.extname(normalizedPath).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.pdf') {
      contentType = 'application/pdf';
    } else if (ext === '.doc') {
      contentType = 'application/msword';
    } else if (ext === '.docx') {
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }

    // Determine Content-Disposition
    const forceDownload = req.query.download === '1' || req.query.download === 'true';
    const isPDF = ext === '.pdf';
    const disposition = (forceDownload || !isPDF) ? 'attachment' : 'inline';

    // Encode filename for Content-Disposition header (RFC 5987)
    // Use UTF-8 encoding for proper display of Persian characters in browsers
    const encodedFilename = encodeURIComponent(filename);
    // Escape quotes in filename for the header
    const safeFilename = filename.replace(/"/g, '\\"');
    const contentDisposition = `${disposition}; filename="${safeFilename}"; filename*=UTF-8''${encodedFilename}`;

    // Set headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', contentDisposition);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Handle HTTP Range requests for PDFs (enables seeking/scrolling)
    const range = req.headers.range;
    if (range && isPDF) {
      const fileSize = stats.size;
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(normalizedPath, { start, end });

      res.status(206); // Partial Content
      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      res.setHeader('Content-Length', chunksize);

      file.pipe(res);
    } else {
      // Full file response
      res.setHeader('Content-Length', stats.size);
      res.sendFile(normalizedPath, (err) => {
        if (err && !res.headersSent) {
          console.error("Error sending file:", err);
          res.status(500).json({ error: "Error serving file" });
        }
      });
    }
  } catch (error) {
    console.error("Error in secure file handler:", error);
    console.error("Error stack:", error.stack);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: "Internal server error",
        message: error.message 
      });
    }
  }
});

// ===== Judge Portal Auth =====
app.post("/api/judge/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: "Missing credentials" });
  try {
    const judge = await db.get(`SELECT id, name, username, password FROM judges WHERE username = ?`, [String(username).trim()]);
    if (!judge || String(judge.password) !== String(password)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    req.session.regenerate((regenErr) => {
      if (regenErr) return res.status(500).json({ error: "Session error" });
      req.session.judge = { id: judge.id, username: judge.username, name: judge.name };
      req.session.save(async (saveErr) => {
        if (saveErr) return res.status(500).json({ error: "Session error" });
        await db.run(`UPDATE judges SET last_login = CURRENT_TIMESTAMP WHERE id = ?`, [judge.id]);
        return res.json({ id: judge.id, username: judge.username, name: judge.name });
      });
    });
  } catch (e) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/judge/logout", (req, res) => {
  if (req.session) delete req.session.judge;
  return res.json({ message: "Judge logged out" });
});

app.get("/api/judge/me", (req, res) => {
  const judge = req.session?.judge || null;
  return res.json({ judge });
});

// Judge: list own projects
app.get("/api/judge/projects", ensureJudge, async (req, res) => {
  try {
    const rows = await db.all(`SELECT * FROM judge_projects WHERE judge_id = ? ORDER BY created_at DESC`, [req.session.judge.id]);
    const out = rows.map((r) => ({
      ...r,
      pdf_url: toPublicPath(r.pdf_path),
      final_score: r.final_score ?? null,
      evaluation: safeParseJSON(r.evaluation),
    }));
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: "Failed to load projects" });
  }
});

// Judge: evaluate project with decision + ratings
app.post("/api/judge/projects/:projectId/decision", ensureJudge, async (req, res) => {
  const { projectId } = req.params;
  const { decision, ratings } = req.body || {};

  const normalizedDecision = String(decision || "").toUpperCase();
  let statusValue;
  if (["APPROVED", "ACCEPTED", "APPROVE"].includes(normalizedDecision)) {
    statusValue = "APPROVED";
  } else if (["REJECTED", "REJECT"].includes(normalizedDecision)) {
    statusValue = "REJECTED";
  } else {
    return res.status(400).json({ error: "Invalid decision" });
  }

  if (!Array.isArray(ratings) || ratings.length !== 10) {
    return res.status(400).json({ error: "Ratings must contain 10 values" });
  }
  let normalizedRatings;
  try {
    normalizedRatings = ratings.map((v) => {
      const num = Number(v);
      if (!Number.isFinite(num) || num < 1 || num > 10) {
        throw new Error("Invalid rating value");
      }
      return Math.round(num);
    });
  } catch (err) {
    return res.status(400).json({ error: "Ratings must be between 1 and 10" });
  }
  const totalScore = normalizedRatings.reduce((sum, val) => sum + val, 0);

  try {
    // Ensure the project belongs to this judge
    const row = await db.get(
      `SELECT id FROM judge_projects WHERE id = ? AND judge_id = ?`,
      [Number(projectId), req.session.judge.id]
    );
    if (!row) return res.status(404).json({ error: "Not found" });

    const now = new Date().toISOString();
    await db.run(
      `UPDATE judge_projects
        SET status = ?,
            updated_at = ?,
            decision_at = ?,
            final_score = ?,
            evaluation = ?
        WHERE id = ?`,
      [
        statusValue,
        now,
        now,
        totalScore,
        JSON.stringify({ ratings: normalizedRatings }),
        Number(projectId),
      ]
    );
    const updated = await db.get(`SELECT * FROM judge_projects WHERE id = ?`, [Number(projectId)]);
    res.json({
      ...updated,
      pdf_url: toPublicPath(updated.pdf_path),
      final_score: updated.final_score ?? null,
      evaluation: safeParseJSON(updated.evaluation),
    });
  } catch (e) {
    console.error("judge decision error", e);
    res.status(500).json({ error: "Failed to update status" });
  }
});

app.get("/api/user", (req, res) => {
  console.log("=== /api/user Check ===");
  console.log("Is authenticated:", req.isAuthenticated());
  console.log("req.user:", req.user);
  console.log("Session:", req.session);
  console.log("==================");
  if (req.isAuthenticated()) {
    res.json({ user: { id: req.user.id, email: req.user.email, name: req.user.name } });
  } else {
    res.json({ user: null });
  }
});

app.post("/api/signup", async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.run(
      "INSERT INTO users (email, password, name) VALUES (?, ?, ?)",
      [email, hashedPassword, name]
    );
    const newUser = {
      id: result.lastID,
      email,
      name,
    };
    req.logIn(newUser, (loginErr) => {
      if (loginErr) {
        console.error("Auto login after signup failed:", loginErr);
        return res.status(500).json({ error: "Login after signup failed" });
      }
      res
        .status(201)
        .json({
          message: "User created",
          userId: newUser.id,
          userEmail: newUser.email,
          userName: newUser.name,
        });
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(400).json({ error: "Email already exists" });
  }
});

app.post(
  "/api/submit-idea",
  ensureAuthenticated,
  (req, res, next) => {
    // accept two different fields
    const handler = upload.fields([
      { name: "pdf_file", maxCount: 1 },
      { name: "word_file", maxCount: 1 },
    ]);
    handler(req, res, (err) => {
      if (err) {
        if (err.message === "INVALID_PDF_TYPE") {
          return res.status(400).json({ error: "Only PDF is allowed for pdf_file" });
        }
        if (err.message === "INVALID_WORD_TYPE") {
          return res.status(400).json({ error: "Only Word (.doc/.docx) is allowed for word_file" });
        }
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ error: "Each file must be smaller than 30MB" });
        }
        return res.status(400).json({ error: "Upload failed" });
      }
      next();
    });
  },
  async (req, res) => {
    console.log("=== Submit Idea Request ===");
    console.log("Request body:", req.body);
    console.log("File:", req.file);
    console.log("User:", req.user);
    const {
      contact_email,
      submitter_full_name,
      track,
      phone,
      idea_title,
      executive_summary,
    } = req.body;

    // Normalize team_members which may arrive as string | array | object
    let team_members_raw = req.body.team_members;
    let team_members_str = "";
    if (Array.isArray(team_members_raw)) {
      // from form-data with keys like team_members[0], multer parses into array
      team_members_str = team_members_raw
        .map(v => (typeof v === "string" ? v.trim() : String(v)))
        .filter(Boolean)
        .join(", ");
    } else if (typeof team_members_raw === "object" && team_members_raw !== null) {
      // object with numeric keys { '0': 'a', '1': 'b' }
      team_members_str = Object.keys(team_members_raw)
        .sort()
        .map(k => (typeof team_members_raw[k] === "string" ? team_members_raw[k].trim() : String(team_members_raw[k])))
        .filter(Boolean)
        .join(", ");
    } else if (typeof team_members_raw === "string") {
      team_members_str = team_members_raw.trim();
    } else {
      team_members_str = "";
    }
    // Extract uploaded files
    const pdf = req.files?.pdf_file?.[0] || null;
    const word = req.files?.word_file?.[0] || null;
    // Validate required files and sizes (30MB already enforced by multer)
    if (!pdf) {
      return res.status(400).json({ error: "PDF file is required" });
    }
    if (!word) {
      return res.status(400).json({ error: "Word file is required" });
    }
    // Store relative paths for client links
    const rel = (p) => (p ? p.replace(path.resolve("."), "").replace(/\\/g, "/").replace(/^\//, "") : null);
    const file_path = JSON.stringify({
      pdf: pdf ? rel(pdf.path) : null,
      word: word ? rel(word.path) : null,
    });
    try {
      const result = await db.run(
        "INSERT INTO ideas (user_id, contact_email, submitter_full_name, track, phone, team_members, idea_title, executive_summary, file_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          req.user.id,
          contact_email,
          submitter_full_name,
          track,
          phone || "",
          team_members_str,
          idea_title,
          executive_summary,
          file_path,
        ]
      );
      res
        .status(201)
        .json({ message: "Idea submitted", ideaId: result.lastID });
    } catch (err) {
      console.error("Error submitting idea:", err);
      res.status(500).json({ error: "Failed to submit idea" });
    }
  }
);

// app.get("/api/ideas", ensureAuthenticated, async (req, res) => {
//   try {
//     const rows = await db.all("SELECT * FROM ideas ORDER BY submitted_at DESC");
//     const ideas = rows.map((row) => {
//       let files = { pdf: null, word: null };
//       if (row.file_path) {
//         try {
//           const parsed = JSON.parse(row.file_path);
//           files = {
//             pdf: parsed?.pdf ? `/${String(parsed.pdf).replace(/^\/+/, "")}` : null,
//             word: parsed?.word ? `/${String(parsed.word).replace(/^\/+/, "")}` : null,
//           };
//         } catch (err) {
//           console.warn("Failed to parse file_path for idea", row.id, err);
//         }
//       }
//       return {
//         id: String(row.id),
//         title: row.idea_title || "",
//         track: row.track || null,
//         status: row.status ?? "PENDING",
//         submittedAt: row.submitted_at,
//         updatedAt: row.updated_at ?? null,
//         scoreAvg: row.score_avg ?? null,
//         contactEmail: row.contact_email || null,
//         submitterName: row.submitter_full_name || null,
//         phone: row.phone || null,
//         teamMembers: row.team_members || null,
//         executiveSummary: row.executive_summary || null,
//         files,
//       };
//     });
//     res.json(ideas);
//   } catch (err) {
//     console.error("Error fetching ideas:", err);
//     res.status(500).json({ error: "Failed to load ideas" });
//   }
// });

app.get("/api/user-ideas", ensureAuthenticated, async (req, res) => {
  try {
    const ideas = await db.all(
      "SELECT * FROM ideas WHERE user_id = ? ORDER BY submitted_at DESC",
      [req.user.id]
    );
    res.json({ ideas });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user ideas" });
  }
});

app.get("/api/recent-ideas", async (req, res) => {
  try {
    const ideas = await db.all(
      "SELECT id, submitter_full_name, track, idea_title, executive_summary, submitted_at FROM ideas ORDER BY submitted_at DESC LIMIT 10"
    );
    res.json({ ideas });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch recent ideas" });
  }
});



// List all users with idea count (admin only)
app.get("/api/users", ensureAdmin, async (req, res) => {
  try {
    const rows = await db.all(`
      SELECT 
        u.id,
        u.email,
        u.name,
        COUNT(i.id) AS ideasSubmitted
      FROM users u
      LEFT JOIN ideas i ON i.user_id = u.id
      GROUP BY u.id, u.email, u.name
      ORDER BY u.id DESC
    `);
    // Ensure numeric type in JS (SQLite returns numbers, but we’ll be explicit)
    const out = rows.map(r => ({
      id: r.id,
      email: r.email,
      name: r.name,
      ideasSubmitted: Number(r.ideasSubmitted || 0),
    }));
    res.json(out);
  } catch (e) {
    console.error("admin list users error", e);
    res.status(500).json({ error: "Failed to load users" });
  }
});


// List all ideas (admin only)
app.get("/api/ideas", ensureAdmin, async (req, res) => {
  try {
    const rows = await db.all(`
      SELECT *
      FROM ideas
      ORDER BY submitted_at DESC
    `);

    const ideas = rows.map((row) => {
      // Parse stored file paths and expose as public URLs
      let files = { pdf: null, word: null };
      if (row.file_path) {
        try {
          const parsed = JSON.parse(row.file_path);
          files = {
            pdf: parsed?.pdf ? `/${String(parsed.pdf).replace(/^\/+/, "")}` : null,
            word: parsed?.word ? `/${String(parsed.word).replace(/^\/+/, "")}` : null,
          };
        } catch (err) {
          console.warn("Failed to parse file_path for idea", row.id, err);
        }
      }

      return {
        id: String(row.id),
        userId: row.user_id,
        contactEmail: row.contact_email || null,
        submitterName: row.submitter_full_name || null,
        phone: row.phone || null,
        teamMembers: row.team_members || null,
        title: row.idea_title || "",
        track: row.track || null,
        executiveSummary: row.executive_summary || null,
        status: row.status ?? "PENDING",
        submittedAt: row.submitted_at,
        updatedAt: row.updated_at ?? null,
        scoreAvg: row.score_avg ?? null,
        files,
      };
    });

    res.json(ideas);
  } catch (e) {
    console.error("admin list ideas error", e);
    res.status(500).json({ error: "Failed to load ideas" });
  }
});

// app.listen is moved into startServer() after DB init

