const express = require("express");
const { createOffer, getActiveOffers, normalizeBoolean } = require("../services/offersService");

const router = express.Router();

router.post("/", (req, res, next) => {
  try {
    const offer = createOffer(req.body);
    res.status(201).json(offer);
  } catch (err) {
    next(err);
  }
});

router.get("/", (req, res, next) => {
  try {
    const enableSmart = normalizeBoolean(req.query.enable_smart_recommendations);
    const enableSmartRecommendations = enableSmart === null ? false : enableSmart;

    const offers = getActiveOffers({ enableSmartRecommendations });
    res.json({
      enable_smart_recommendations: enableSmartRecommendations,
      server_time: new Date().toISOString(),
      offers
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
