/* Site settings. Never put secret keys here: this file is public.
   The site has no forms and takes no payments: bookings and enquiries are email links,
   and giving happens on an external fundraising page. */
window.YMT_CONFIG = Object.freeze({
  // Enquiries are emailed here (Eve's address).
  enquiryTo: 'admin@ymt.org',
  // Booking enquiries go here, with the enquiries address copied in.
  bookingsTo: 'bookings@ymt.org',

  // PLACEHOLDER_GIVING_URL: the external fundraising page (https://…). Until it is filled in,
  // the Give button on donate.html is hidden and visitors are asked to email instead.
  givingUrl: 'PLACEHOLDER_GIVING_URL',
});
