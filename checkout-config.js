// PowerBand checkout configuration.
//
// Card payments run through Stripe Payment Links, so card numbers never touch this site.
// To turn on real payments:
//   1. In the Stripe Dashboard go to Payment Links > New, and create one link per bundle
//      (1x $149, 2x $278, 3x $387). Turn on "Collect shipping addresses" and "Allow promotion codes" if you like.
//   2. Paste each link's URL below.
// Until a link is set, the "Pay with card" button shows a "checkout opens soon" message instead of charging anyone.
window.POWERBAND_CHECKOUT = {
  links: {
    1: '', // e.g. 'https://buy.stripe.com/xxxxxxxx'
    2: '',
    3: '',
  },
};
