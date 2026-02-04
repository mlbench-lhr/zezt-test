const express = require("express");
const cors = require("cors");
const offersRoutes = require("./routes/offersRoutes");
const { seedInitialOffers } = require("./services/offersService");

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

seedInitialOffers();

app.use("/offers", offersRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

app.use((err, req, res, next) => {
  const status = Number.isInteger(err.statusCode) ? err.statusCode : 500;
  const payload = {
    error: status === 500 ? "Internal Server Error" : err.message
  };

  if (err.details) payload.details = err.details;

  res.status(status).json(payload);
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  process.stdout.write(`Backend listening on http://localhost:${port}\n`);
});
