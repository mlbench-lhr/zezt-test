const crypto = require("crypto");
const { addOffer, listOffers } = require("../data/offersStore");

function parseIsoDate(value) {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function normalizeBoolean(value) {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return null;
}

function validateCreateOfferBody(body) {
  const restaurantName = body?.restaurant_name;
  const startTime = parseIsoDate(body?.start_time);
  const endTime = parseIsoDate(body?.end_time);
  const discountPercent = body?.discount_percent;

  const errors = [];

  if (typeof restaurantName !== "string" || restaurantName.trim().length === 0) {
    errors.push({ field: "restaurant_name", message: "restaurant_name must be a non-empty string" });
  }

  if (!startTime) {
    errors.push({ field: "start_time", message: "start_time must be a valid ISO datetime string" });
  }

  if (!endTime) {
    errors.push({ field: "end_time", message: "end_time must be a valid ISO datetime string" });
  }

  if (startTime && endTime && startTime.getTime() > endTime.getTime()) {
    errors.push({ field: "time_range", message: "start_time must be before or equal to end_time" });
  }

  if (typeof discountPercent !== "number" || !Number.isFinite(discountPercent)) {
    errors.push({ field: "discount_percent", message: "discount_percent must be a finite number" });
  } else if (discountPercent < 0 || discountPercent > 100) {
    errors.push({ field: "discount_percent", message: "discount_percent must be between 0 and 100" });
  }

  if (errors.length > 0) {
    const error = new Error("Invalid request body");
    error.statusCode = 400;
    error.details = errors;
    throw error;
  }

  return {
    restaurant_name: restaurantName.trim(),
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString(),
    discount_percent: discountPercent
  };
}

function createOffer(body) {
  const normalized = validateCreateOfferBody(body);
  const now = new Date();

  const offer = {
    id: crypto.randomUUID(),
    ...normalized,
    created_at: now.toISOString()
  };

  addOffer(offer);
  return offer;
}

function isActiveOffer(offer, now) {
  const start = new Date(offer.start_time);
  const end = new Date(offer.end_time);
  const nowTime = now.getTime();
  return start.getTime() <= nowTime && nowTime <= end.getTime();
}

function getActiveOffers({ enableSmartRecommendations, now = new Date() }) {
  const active = listOffers().filter((offer) => isActiveOffer(offer, now));

  if (enableSmartRecommendations) {
    return active
      .slice()
      .sort((a, b) => b.discount_percent - a.discount_percent || a.created_at.localeCompare(b.created_at));
  }

  return active;
}

function seedInitialOffers() {
  if (listOffers().length > 0) return;

  const now = Date.now();
  const minutesFromNow = (minutes) => new Date(now + minutes * 60 * 1000).toISOString();

  const seed = [
    { restaurant_name: "Golden Spoon", discount_percent: 25, start: -45, end: 75 },
    { restaurant_name: "Sushi Place", discount_percent: 15, start: -30, end: 90 },
    { restaurant_name: "Burger Spot", discount_percent: 40, start: -20, end: 60 },
    { restaurant_name: "Pasta House", discount_percent: 30, start: -10, end: 110 },
    { restaurant_name: "Taco Corner", discount_percent: 20, start: -60, end: 30 },
    { restaurant_name: "Green Bowl", discount_percent: 10, start: -15, end: 45 },
    { restaurant_name: "Curry Kitchen", discount_percent: 35, start: -25, end: 120 },
    { restaurant_name: "Pizza Oven", discount_percent: 18, start: -5, end: 55 }
  ];

  for (const item of seed) {
    createOffer({
      restaurant_name: item.restaurant_name,
      start_time: minutesFromNow(item.start),
      end_time: minutesFromNow(item.end),
      discount_percent: item.discount_percent
    });
  }
}

module.exports = {
  createOffer,
  getActiveOffers,
  normalizeBoolean,
  seedInitialOffers
};
