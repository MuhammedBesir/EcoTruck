import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { errorHandler, notFound } from "./middleware/errorHandler";
import authRouter from "./routes/auth";
import companiesRouter from "./routes/companies";
import emissionsRouter from "./routes/emissions";
import suppliersRouter from "./routes/suppliers";
import offsetsRouter from "./routes/offsets";
import complianceRouter from "./routes/compliance";
import shipmentsRouter from "./routes/shipments";
import auditRouter from "./routes/audit";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const ALLOWED_ORIGINS = [
  process.env.CLIENT_URL || "http://localhost:5173",
  "http://localhost:5173",
  "http://10.66.234.122:5173",
];
app.use(
  cors({
    origin: (origin, cb) =>
      cb(null, !origin || ALLOWED_ORIGINS.includes(origin)),
  })
);
app.use(express.json());

// Routes
app.use("/api/auth", authRouter);
app.use("/api/companies", companiesRouter);
app.use("/api/emissions", emissionsRouter);
app.use("/api/suppliers", suppliersRouter);
app.use("/api/offsets", offsetsRouter);
app.use("/api/compliance", complianceRouter);
app.use("/api/shipments", shipmentsRouter);
app.use("/api/audit", auditRouter);

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`EcoTrack API running on port ${PORT}`);
});

export default app;
