import dotenv from "dotenv";
import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import nodemailer from 'nodemailer';
import { generateToken } from "./jwtService.js";
import { authenticate } from "./middleware.js";
dotenv.config({ path: "../.env" });


const app = express();

// Environment variables (you can move these to a .env file)
const PORT = process.env.PORT || 5050;
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'asset_mgmt_tkt_sysm'
};

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true
}));

app.use(express.json());

// Database connection
const db = mysql.createConnection(DB_CONFIG);

db.connect((err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.stack);
    process.exit(1); // Exit if database connection fails
  } else {
    console.log('✅ Connected to database as id', db.threadId);
  }
});

// Input validation helper
const validateRequiredFields = (fields, data) => {
  const missing = fields.filter(field => !data[field]);
  if (missing.length > 0) {
    return { valid: false, message: `Missing required fields: ${missing.join(', ')}` };
  }
  return { valid: true };
};

// Error handling helper
const handleDatabaseError = (err, res) => {
  console.error('Database error:', err);
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(400).json({ 
      success: false, 
      message: 'Username or email already exists' 
    });
  }
  return res.status(500).json({ 
    success: false, 
    error: err.message 
  });
};

// Authentication endpoints
app.post('/api/login', (req, res) => {
  const { email, password, role, company, team } = req.body;
  
  const validation = validateRequiredFields(['email', 'password', 'role', 'company'], req.body);
  if (!validation.valid) {
    return res.status(400).json({ success: false, message: validation.message });
  }
  
  let query, params;
  
 if (role === 'admin') {
  query = 'SELECT * FROM users WHERE email = ? AND password = ? AND role = ?';
  params = [email, password, role];
} else if (role === 'employee') {
    query = 'SELECT * FROM employee WHERE email = ? AND password = ? AND role = ? AND company = ?';
    params = [email, password, role, company];
    
    if (team) {
      query += ' AND team = ?';
      params.push(team);
    }
  } else {
    return res.status(400).json({ success: false, message: 'Invalid role' });
  }
  
  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Login error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
    
    if (results.length > 0) {
      const user = results[0];
      const userPayload = {
    id: user.id,
    username: user.username,
    role: user.role,
    company: user.company,
    team: user.team || null
  };
      const token = generateToken(userPayload);
      res.json({ 
        success: true,
        token, 
        user: {
          id: user.id,
          username: user.username,
          empId: user.empId || user.username,
          role: user.role,
          company: user.company,
          team: user.team || null,
          email: user.email || null
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  });
});

// Registration endpoint
app.post('/api/register', (req, res) => {
  const { username, password, role, company } = req.body;

  const validation = validateRequiredFields(['username', 'password', 'role', 'company'], req.body);
  if (!validation.valid) {
    return res.status(400).json({ success: false, message: validation.message });
  }

  const query = 'INSERT INTO users (username, password, role, company) VALUES (?, ?, ?, ?)';

  db.query(query, [username, password, role, company], (err, results) => {
    if (err) return handleDatabaseError(err, res);
    res.status(201).json({ 
      success: true, 
      message: 'User registered successfully', 
      userId: results.insertId 
    });
  });
});

// Employee management endpoints
app.post('/api/users', (req, res) => {
  const { username, empId, email, password, company, role, team } = req.body;

  const validation = validateRequiredFields(['username', 'empId', 'email', 'password', 'company', 'role', 'team'], req.body);
  if (!validation.valid) {
    return res.status(400).json({ success: false, message: validation.message });
  }

  const query = 'INSERT INTO employee (username, empId, email, password, company, role, team) VALUES (?, ?, ?, ?, ?, ?, ?)';

  db.query(query, [username, empId, email, password, company, role, team], (err, results) => {
    if (err) return handleDatabaseError(err, res);
    
    res.status(201).json({ 
      success: true, 
      message: 'Employee added successfully', 
      userId: results.insertId 
    });
  });
});

app.get('/api/users', (req, res) => {
  const { company, role } = req.query;
  const isAdmin = role === 'admin';

  const usersQuery = isAdmin
    ? 'SELECT id, username, company, role FROM users'
    : (company ? 'SELECT id, username, company, role FROM users WHERE company = ?' : 'SELECT id, username, company, role FROM users');
  const usersParams = isAdmin ? [] : (company ? [company] : []);

  const employeeQuery = isAdmin
    ? 'SELECT id, username, empId, email, company, role, team FROM employee'
    : (company ? 'SELECT id, username, empId, email, company, role, team FROM employee WHERE company = ?' : 'SELECT id, username, empId, email, company, role, team FROM employee');
  const employeeParams = isAdmin ? [] : (company ? [company] : []);

  db.query(usersQuery, usersParams, (err, usersResults) => {
    if (err) {
      console.error('Users table error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
    db.query(employeeQuery, employeeParams, (err, employeeResults) => {
      if (err) {
        console.error('Employee table error:', err);
        return res.status(500).json({ success: false, error: err.message });
      }
      const normalizedUsers = [
        ...usersResults.map(user => ({
          id: user.id,
          username: user.username,
          empId: user.username,
          email: null,
          company: user.company,
          role: user.role,
          team: null
        })),
        ...employeeResults.map(emp => ({
          id: emp.id,
          username: emp.username,
          empId: emp.empId,
          email: emp.email,
          company: emp.company,
          role: emp.role,
          team: emp.team
        }))
      ];
      res.json({ success: true, users: normalizedUsers });
    });
  });
});

app.get('/api/employees', authenticate,(req, res) => {
  const { company, role } = req.user;
  const isAdmin = role === 'admin';
  const query = isAdmin
    ? 'SELECT id, username, empId, email, company, role, team FROM employee'
    : (company ? 'SELECT id, username, empId, email, company, role, team FROM employee WHERE company = ?' : 'SELECT id, username, empId, email, company, role, team FROM employee');
  const params = isAdmin ? [] : (company ? [company] : []);
  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Employee table error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, employees: results });
  });
});

app.put('/api/employees/:id', (req, res) => {
  const { id } = req.params;
  const { username, empId, email, company, role, team } = req.body;

  const validation = validateRequiredFields(['username', 'empId', 'email', 'company', 'role', 'team'], req.body);
  if (!validation.valid) {
    return res.status(400).json({ success: false, message: validation.message });
  }

  const query = 'UPDATE employee SET username = ?, empId = ?, email = ?, company = ?, role = ?, team = ? WHERE id = ?';

  db.query(query, [username, empId, email, company, role, team, id], (err, results) => {
    if (err) return handleDatabaseError(err, res);
    
    if (results.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    
    res.json({ success: true, message: 'Employee updated successfully' });
  });
});

app.delete('/api/employees/:id', (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ success: false, message: 'Employee ID is required' });
  }

  const query = 'DELETE FROM employee WHERE id = ?';

  db.query(query, [id], (err, results) => {
    if (err) return handleDatabaseError(err, res);
    
    if (results.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    
    res.json({ success: true, message: 'Employee deleted successfully' });
  });
});

// Asset management endpoints
app.get('/api/assets', authenticate,(req, res) => {
  const { company, role } = req.user;
  const isAdmin = role === 'admin';
  const query = isAdmin
    ? 'SELECT * FROM assets'
    : (company ? 'SELECT * FROM assets WHERE company = ?' : 'SELECT * FROM assets');
  const params = isAdmin ? [] : (company ? [company] : []);
  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Assets table error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
    // Map assigned_user_id to assignedTo for frontend consistency
    const mappedAssets = results.map(asset => ({
      ...asset,
      assignedTo: asset.assigned_user_id,
      peripherals: asset.other_peripherals ? JSON.parse(asset.other_peripherals) : []
    }));
    res.json({ success: true, assets: mappedAssets });
  });
});

app.post('/api/assets', (req, res) => {
  const { 
    name, 
    tagNo, 
    company, 
    team, 
    mobileNumber, 
    os, 
    model, 
    ram, 
    drive, 
    serialNumber, 
    condition, 
    status, 
    purchaseDate, 
    peripherals, 
    assignedTo 
  } = req.body;

  const validation = validateRequiredFields(['name', 'tagNo', 'company'], req.body);
  if (!validation.valid) {
    return res.status(400).json({ success: false, message: validation.message });
  }

  const query = `
    INSERT INTO assets (
      name, tagNo, company, team, mobile_number, os, model, ram, drive, 
      serialNumber, issue_condition, status, dop, other_peripherals, assigned_user_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    name, 
    tagNo, 
    company, 
    team || null, 
    mobileNumber || null, 
    os || null, 
    model || null, 
    ram || null, 
    drive || null, 
    serialNumber || null, 
    condition || null, 
    status || 'In Stock', 
    purchaseDate || null, 
    JSON.stringify(peripherals || []),
    assignedTo || null
  ];

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ 
          success: false, 
          message: 'Tag number already exists' 
        });
      }
      return res.status(500).json({ 
        success: false, 
        error: err.message 
      });
    }
    
    res.status(201).json({ 
      success: true, 
      message: 'Asset added successfully', 
      assetId: results.insertId 
    });
  });
});

app.put('/api/assets/:id', (req, res) => {
  const { id } = req.params;
  const { 
    name, 
    tagNo, 
    company, 
    team, 
    mobileNumber, 
    os, 
    model, 
    ram, 
    drive, 
    serialNumber, 
    condition, 
    status, 
    purchaseDate, 
    peripherals, 
    assignedTo 
  } = req.body;

  const validation = validateRequiredFields(['name', 'tagNo', 'company'], req.body);
  if (!validation.valid) {
    return res.status(400).json({ success: false, message: validation.message });
  }

  const query = `
    UPDATE assets SET 
      name = ?, tagNo = ?, company = ?, team = ?, mobile_number = ?, 
      os = ?, model = ?, ram = ?, drive = ?, serialNumber = ?, 
      issue_condition = ?, status = ?, dop = ?, other_peripherals = ?, assigned_user_id = ?
    WHERE id = ?
  `;

  const params = [
    name, 
    tagNo, 
    company, 
    team || null, 
    mobileNumber || null, 
    os || null, 
    model || null, 
    ram || null, 
    drive || null, 
    serialNumber || null, 
    condition || null, 
    status || 'In Stock', 
    purchaseDate || null, 
    JSON.stringify(peripherals || []),
    assignedTo || null,
    id
  ];

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ 
          success: false, 
          message: 'Tag number already exists' 
        });
      }
      return res.status(500).json({ 
        success: false, 
        error: err.message 
      });
    }
    
    if (results.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }
    
    res.json({ success: true, message: 'Asset updated successfully' });
  });
});

app.delete('/api/assets/:id', (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ success: false, message: 'Asset ID is required' });
  }

  const query = 'DELETE FROM assets WHERE id = ?';

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ 
        success: false, 
        error: err.message 
      });
    }
    
    if (results.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }
    
    res.json({ success: true, message: 'Asset deleted successfully' });
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    database: db.state === 'authenticated' ? 'connected' : 'disconnected'
  });
});

app.get('/api/tickets', (req, res) => {
  // No company filter in your table, so just return all tickets
  const query = 'SELECT * FROM tickets';
  db.query(query, [], (err, results) => {
    if (err) {
      console.error('Tickets table error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, tickets: results });
  });
});

app.post('/api/tickets', (req, res) => {
  const { empId, serialNo, issue_description, status} = req.body;

  console.log('Received Ticket:', req.body);

  // Validate required fields
  const validation = validateRequiredFields(['empId', 'serialNo', 'issue_description'], req.body);
  if (!validation.valid) {
    return res.status(400).json({ success: false, message: validation.message });
  }

  const query = 'INSERT INTO tickets (empId, serialNo, description, status) VALUES (?, ?, ?, ?)';
  db.query(query, [empId, serialNo, issue_description, status || 'Open'], async (err, results) => {
    if (err) return handleDatabaseError(err, res);

    const ticketId = results.insertId;

   try {
      // 1️⃣ Get employee details
      const [employeeRows] = await db.promise().query(
        'SELECT email, username FROM employee WHERE empId = ? LIMIT 1',
        [empId]
      );
      const employee = employeeRows[0];

      // 2️⃣ Get all admin users
      const [adminRows] = await db.promise().query(
        'SELECT email, username FROM users WHERE role = "admin"'
      );

      // 3️⃣ Configure mail transporter
     const transporter = nodemailer.createTransport({
          service: 'gmail', // or your SMTP
          secure:true,
          auth: {
            user: process.env.EMAIL_USER, // your email
            pass: process.env.EMAIL_PASS  // your app password
          }
        });

      console.log("EMAIL_USER:", process.env.EMAIL_USER);
      console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "Loaded ✅" : "Missing ❌");

      // 4️⃣ Send email to employee (confirmation)
      if (employee?.email) {
        await transporter.sendMail({
          from: `"Ticket System" <${process.env.EMAIL_USER}>`,
          to: employee.email,
          subject: `Ticket Submitted (#${ticketId})`,
          html: `
            <h3>Your Ticket has been submitted successfully</h3>
            <p>Hi ${employee.username || empId},</p>
            <p>Your ticket has been raised successfully. Below are the details:</p>
            <p><strong>Ticket ID:</strong> ${ticketId}</p>
            <p><strong>Asset Serial:</strong> ${serialNo}</p>
            <p><strong>Description:</strong> ${issue_description}</p>
            <p><strong>Status:</strong> ${status || 'Open'}</p>
            <p>We will notify you when there are updates.</p>
          `
        });
      }

      // 5️⃣ Send email to all admins (notification)
      const adminEmails = adminRows.map(a => a.email).filter(Boolean);
      if (adminEmails.length > 0) {
        await transporter.sendMail({
          from: `"Ticket System" <${process.env.EMAIL_USER}>`,
          to: adminEmails.join(','),
          subject: `New Ticket Raised (#${ticketId})`,
          html: `
            <h3>New Ticket Raised</h3>
            <p><strong>Ticket ID:</strong> ${ticketId}</p>
            <p><strong>Raised By:</strong> ${employee?.username || empId} (${employee?.email || 'N/A'})</p>
            <p><strong>Asset Serial:</strong> ${serialNo}</p>
            <p><strong>Description:</strong> ${issue_description}</p>
            <p><strong>Status:</strong> ${status || 'Open'}</p>
          `
        });
      }

      res.status(201).json({
        success: true,
        message: 'Ticket created successfully and emails sent',
        ticketId
      });

    } catch (mailErr) {
      console.error('Email send error:', mailErr);
      res.status(201).json({
        success: true,
        message: 'Ticket created but failed to send email',
        ticketId
      });
    }
  });
});

app.put('/api/tickets/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // Validate required fields
  const validation = validateRequiredFields(['status'], req.body);
  if (!validation.valid) {
    return res.status(400).json({ success: false, message: validation.message });
  }

  const query = 'UPDATE tickets SET status = ? WHERE id = ?';
  db.query(query, [status, id], (err, results) => {
    if (err) return handleDatabaseError(err, res);

    if (results.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    res.json({ success: true, message: 'Ticket updated successfully' });
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  db.end((err) => {
    if (err) {
      console.error('Error closing database connection:', err);
    } else {
      console.log('✅ Database connection closed');
    }
    process.exit(0);
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`🗄️  Database: ${DB_CONFIG.database}@${DB_CONFIG.host}`);
});
