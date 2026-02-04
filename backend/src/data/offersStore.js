const offers = [];

function addOffer(offer) {
  offers.push(offer);
  return offer;
}

function listOffers() {
  return offers;
}

module.exports = {
  addOffer,
  listOffers
};
