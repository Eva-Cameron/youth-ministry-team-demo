/* Site settings. Never put secret keys here: this file is public.
   Bookings and enquiries go through the form on enquire.html (sent by functions/api/enquire.js, whose
   addresses and keys live in Cloudflare settings, not here); these addresses are the email fallback.
   The site takes no payments: giving happens on an external fundraising page. */
window.YMT_CONFIG = Object.freeze({
  // Enquiries are emailed here (Eve's address).
  enquiryTo: 'admin@ymt.org',
  // Booking enquiries go here, with the enquiries address copied in.
  bookingsTo: 'bookings@ymt.org',

  // PLACEHOLDER_GIVING_URL: the external fundraising page (https://…). Until it is filled in,
  // the Give button on donate.html is hidden and visitors are asked to email instead.
  givingUrl: 'PLACEHOLDER_GIVING_URL',
});
