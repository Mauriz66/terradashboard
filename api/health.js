// API de verificação de saúde para o Vercel
export default function handler(req, res) {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    vercel: process.env.VERCEL === "1",
    serverless: true
  });
} 