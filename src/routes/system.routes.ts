import { Router } from "express";
import { vectorDatabase } from "../services/vector.service"; 
const router = Router();

/**
 * Health check
 */
router.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

/**
 * Reset database (dangerous, dev only)
 */
router.delete("/reset", async (req, res) => {
    try {
        await vectorDatabase.cleanDatabase();
        return res.json({ message: "Database cleared" });
    } catch (err: any) {
        return res.status(500).json({
            message: "Reset failed",
            error: err.message,
        });
    }
});

/**
 * Get all documents
 */
router.get("/documents", async (req, res) => {
    try {
        const docs = await vectorDatabase.getDocuments();
        return res.status(200).json({ message: "Here are your documents", docs });
    } catch (err: any) {
        return res.status(500).json({
            message: "Reset failed",
            error: err.message,
        });
    }
});

/**
 * Get all chunks
 */
router.post("/chunks", async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) {
            return res.status(400).json({ message: "Id of document is required" });
        }
        
        const chunks = await vectorDatabase.getDocumentChunks(id);
        return res.status(200).json({ message: "Here are your chunks",chunks });
    } catch (err: any) {
        return res.status(500).json({
            message: "Reset failed",
            error: err.message,
        });
    }
});

export default router;