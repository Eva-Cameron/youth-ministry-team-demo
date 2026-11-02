/* Site settings. Fill these in before launch; anything left empty is switched off on the page.
   Never put secret keys here: this file is public. Payment and form secrets belong on the server. */
window.YMT_CONFIG = Object.freeze({
  // Enquiries are emailed here (Eve's address).
  enquiryTo: 'admin@ymt.org',
  // Booking enquiries are copied here.
  bookingsTo: 'bookings@ymt.org',

  // Optional HTTPS endpoint that receives form submissions as JSON (for example a serverless
  // function that emails the team). It must use HTTPS and be added to connect-src in the CSP.
  // Left empty, forms open the visitor's email app instead.
  formEndpoint: '',

  // Stripe Payment Link (https://buy.stripe.com/...). The donation reference is passed as
  // client_reference_id so the webhook can match the payment. Left empty, card payments are hidden.
  stripePaymentLink: '',

  // Bank details for transfers. Left null, the bank transfer panel is hidden.
  bank: null, // { name: 'Youth Ministry Team', sortCode: '00-00-00', account: '00000000' }

  // Email domains of schools YMT already works with: they are filed as "School Enquiry",
  // other school addresses as "New School Enquiry".
  knownSchoolDomains: [],
});
