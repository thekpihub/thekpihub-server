import { Router, Request, Response } from "express";

const router = Router();

// Code execution endpoint
// In production this would spin up an isolated Docker container.
// For the MVP, we return a sandboxed static preview URL.
router.post("/", async (req: Request, res: Response) => {
  const { files, projectId } = req.body;

  if (!files || !Array.isArray(files)) {
    return res.status(400).json({ error: "files array required" });
  }

  try {
    // Find the entry HTML file or main file
    const htmlFile = files.find((f: { name: string }) => f.name === "index.html");

    if (htmlFile) {
      // Create a data URL for simple HTML previews
      const encoded = encodeURIComponent(htmlFile.content);
      const url = `data:text/html;charset=utf-8,${encoded}`;
      return res.json({ url, type: "static" });
    }

    // For full-stack apps, return a placeholder pointing to the dev server
    res.json({
      url: "",
      type: "server",
      message: "Full execution sandbox requires Docker. Deploy to get a live URL.",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Execution failed";
    res.status(500).json({ error: message });
  }
});

export default router;
