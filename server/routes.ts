import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import fs from "fs";
import path from "path";
import csv from "csv-parser";

// Set up multer for file uploads
const upload = multer({ dest: "uploads/" });

export async function registerRoutes(app: Express): Promise<Server> {
  // Create uploads directory if it doesn't exist
  const uploadDir = path.resolve(process.cwd(), "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // API routes
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/campaigns", async (req, res) => {
    try {
      const campaigns = await storage.getCampaigns();
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });

  app.post("/api/upload", upload.single("file"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileType = req.body.type;
    const month = req.body.month;
    const year = req.body.year;

    if (!fileType || !month || !year) {
      return res.status(400).json({ 
        error: "Missing required parameters (type, month, year)" 
      });
    }

    const filePath = req.file.path;
    const results: any[] = [];

    try {
      // Process the CSV file
      await new Promise<void>((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv({ separator: ';' }))
          .on('data', (data) => results.push(data))
          .on('end', () => {
            resolve();
          })
          .on('error', (error) => {
            reject(error);
          });
      });

      // Save results to storage
      if (fileType === 'orders') {
        await storage.saveOrders(results);
      } else if (fileType === 'ads') {
        await storage.saveCampaigns(results);
      } else {
        return res.status(400).json({ error: "Invalid file type" });
      }

      // Clean up the temporary file
      fs.unlinkSync(filePath);

      // Return success response
      res.status(200).json({
        success: true,
        message: "File processed successfully",
        file: {
          id: Date.now(),
          filename: req.file.originalname,
          type: fileType,
          date: new Date().toISOString(),
          period: { month, year },
          status: "processed"
        }
      });
    } catch (error) {
      // Clean up the temporary file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      res.status(500).json({ error: "Failed to process the file" });
    }
  });

  // Load initial data if storage is empty
  try {
    const orders = await storage.getOrders();
    if (orders.length === 0) {
      // Load orders from the sample data file
      const ordersPath = path.resolve(process.cwd(), "attached_assets", "pedidosabril.csv");
      if (fs.existsSync(ordersPath)) {
        const orders: any[] = [];
        await new Promise<void>((resolve) => {
          fs.createReadStream(ordersPath)
            .pipe(csv({ separator: ';' }))
            .on('data', (data) => orders.push(data))
            .on('end', () => {
              storage.saveOrders(orders).then(() => resolve());
            });
        });
        console.log(`Loaded ${orders.length} orders from sample data`);
      }
    }

    const campaigns = await storage.getCampaigns();
    if (campaigns.length === 0) {
      // Load campaigns from the sample data file
      const campaignsPath = path.resolve(process.cwd(), "attached_assets", "adsabril.csv");
      if (fs.existsSync(campaignsPath)) {
        const campaigns: any[] = [];
        await new Promise<void>((resolve) => {
          fs.createReadStream(campaignsPath)
            .pipe(csv({ separator: ';' }))
            .on('data', (data) => campaigns.push(data))
            .on('end', () => {
              storage.saveCampaigns(campaigns).then(() => resolve());
            });
        });
        console.log(`Loaded ${campaigns.length} campaigns from sample data`);
      }
    }
  } catch (error) {
    console.error("Error loading initial data:", error);
  }

  const httpServer = createServer(app);
  return httpServer;
}
