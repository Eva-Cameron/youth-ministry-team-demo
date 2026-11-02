# Enquiry form: routing and setup

The form on `enquire.html` replaces the email-only booking buttons. Every booking or sign-up button on the site now opens the form with its topic already chosen, for example `enquire.html?topic=retreat&about=Primary`. The email addresses stay on the page as a fallback.

## Where each enquiry goes

| Topic on the form | Buttons that lead to it | Sent to | Subject line |
|---|---|---|---|
| Book a retreat | Primary, Retreats | bookings (`FORM_TO_BOOKINGS`) | `[YMT] Booking enquiry · Retreat · <about> · <name>` |
| Stay at the Village | Youth Village, Everyone | bookings (`FORM_TO_BOOKINGS`) | `[YMT] Booking enquiry · Village stay · <name>` |
| Come to an event | Festival, The Source, Youth Council, Secondary "details" | office (`FORM_TO_ADMIN`) | `[YMT] Event enquiry · <about> · <name>` |
| Volunteer | Volunteer roles, Lourdes | office (`FORM_TO_ADMIN`) | `[YMT] Volunteering · <about> · <name>` |
| Something else | the Contact page | office (`FORM_TO_ADMIN`) | `[YMT] General enquiry · <name>` |

Each email's reply-to is the enquirer's address, so the team can simply press Reply.

## What the form asks

It asks for a name, an email address and a message, plus a tick-box: "I'm 18 or over, or a parent, carer or teacher knows I'm sending this."

The optional fields are phone, school/parish/group, roughly how many, and preferred dates. The last two show only for the topics that need them.

There is a note asking people not to include young people's names, dates of birth or medical details. Nothing is stored on the website: each enquiry goes straight into an email.

**Draft copy for the client to approve:** the consent line, the safeguarding note, and "They'll reply by email, usually within a few working days."

## Spam protection

- A hidden field that only bots fill in.
- Forms sent back within 2.5 seconds are ignored, because no person types that fast.
- Cloudflare Turnstile switches on automatically once both Turnstile keys are set.

## Setup (Eva)

Do this once in Cloudflare Pages, under Settings → Environment variables:

1. Make a free Resend account at resend.com, create an API key, and add it as `RESEND_KEY`.
2. Add `FORM_TO_BOOKINGS` and `FORM_TO_ADMIN`, the team addresses that should receive enquiries.
3. To test first, add `FORM_TO_ALL` set to your own address, and every enquiry goes to you instead. Delete it when you're done.
4. Until the YMT domain is verified in Resend, emails come from `onboarding@resend.dev`. Resend only delivers those to the email you signed up with, so testing with `FORM_TO_ALL` set to that address works straight away. After verifying ymt.org in Resend, set `FORM_FROM` to something like `YMT website <website@ymt.org>`.

To run it locally, put the same keys in `.dev.vars`, which is git-ignored. Alternatively, set `FORM_DEV_LOG=1` to print each enquiry in the wrangler terminal instead of sending it.

## Where it doesn't send

The form needs the Cloudflare server code, so it can't send from the GitHub Pages preview or any plain static host. There, and whenever the keys aren't set, the visitor sees "Send it by email instead", which opens their email app with their answers already written in.
