# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The Youth Ministry Team (YMT) serves the Catholic Diocese of Hexham and Newcastle. Each audience route has its own primary user, and the home page stays neutral and routes people (confirmed by Eva, 2 Nov 2026):

- **Primary (ages 4–11):** primary school staff booking residential retreats and Behold, the Year 6 Festival, and downloading classroom resources. Children see the site with their teacher.
- **Secondary (ages 11–18):** secondary school staff booking retreats, and students themselves finding The Source worship nights, Flame at Wembley and the Youth Council.
- **16+ and volunteers:** young adults and sixth-formers looking for festival crew, Lourdes youth helper places, retreat teams and the year-long Internship.
- **Everyone else:** parishes, families and groups booking stays at the Emmaus Youth Village, and people coming to Significance and open events.
- Parents and carers read across every route: they consent for under-18s and want to know the team is safe and trustworthy.
- Donors and supporters reach the site through Donate.

## Product Purpose

The site is YMT's front door. It shows what YMT runs, who each thing is for, and how to take part, then hands the visitor to an email to the right person. Success means a teacher, young person, volunteer or group leader leaves knowing what is on and emails the team about it.

YMT's mission: "We aim to encourage young people into a relationship with Christ and fully into the life of the Church."

## Positioning

The diocesan youth service since 1994, with its own residential base, the Emmaus Youth Village in the Derwent Valley near Consett (opened 2010: five lodges, an auditorium, a dining hall and a fire pit, for up to 90 guests). Its ethos is the road to Emmaus: walking alongside young people. It has four pillars: Encounter, Belong, Grow and Serve.

## Operating Context

- Many visitors open the site on school networks that block YouTube and Vimeo, and often on phones.
- Bookings and enquiries are handled by email: `admin@ymt.org` for enquiries and `bookings@ymt.org` for bookings. Subjects follow a `[YMT] …` pattern so the team can file them.
- Events and downloads are entered once in `js/data.js`. Entries marked `sample: true` are not yet confirmed by the client.
- Hosting: Cloudflare Pages, with video on Cloudflare R2.

## Capabilities and Constraints

- Plain HTML, CSS and JS with no build step. It must stay that way.
- **No web forms.** Bookings and enquiries are email only, through routed `mailto:` links with pre-filled subjects. The site never collects anyone's details.
- **No payments on the site.** Giving links out to an external fundraising page. That URL is not yet decided (`PLACEHOLDER_GIVING_URL` in `js/config.js`).
- **No YouTube or Vimeo embeds.** All video is self-hosted. A plain link to the YouTube channel is fine.
- **No logins of any kind.**
- **CMS-ready markup.** Phase 2 adds editable templates with text and image slots, so repeated blocks (cards, shots, timeline items, downloads) stay as consistent components.
- Undecided: the external giving URL; which `sample: true` events are real; photo consent status for existing images; the registered charity number (the Charity Commission lists the Youth Ministry Trust as no. 1146158, to be confirmed by the client).

## Brand Commitments

- Name: Youth Ministry Team, YMT. Diocese of Hexham and Newcastle.
- Voice: "we" (the team) talking to "you". Warm, honest, joyful and rooted. Never corporate, never preachy.
- Four audience routes, each with its own accent, switched by `body[data-aud]`.
- Fonts signed off with the client: Space Grotesk (display), Satoshi (body), Space Mono (labels).
- Logo: `assets/images/logo.png`, `assets/images/logo-white.png`.
- Social: TikTok `@ymttiktok`, Instagram and Facebook `youthministryteam`, and a YouTube channel.

## Evidence on Hand

- Real YMT photography in `assets/web` (worship nights, retreats, festival, the Village, Lourdes, crew) and self-hosted clips (`assets/web/*.mp4`).
- Resource PDFs in `resources/`.
- Events and downloads in `js/data.js`. Some are `sample: true` and unconfirmed.
- No testimonials, statistics or quotes beyond those already in the content. Don't invent events, dates, quotes or claims.

## Product Principles

1. **Route first.** Every visitor should find their own door within one tap, and each route speaks to its own primary user.
2. **Email is the action.** Every call to action ends in a clear, pre-addressed email to the right person. Nothing is collected on the site.
3. **Safe by default.** No logins, no full names next to children's faces, no new photos of identifiable young people, and safeguarding is always one link away.
4. **The client's content, the client's claims.** Unconfirmed data stays marked, and new copy is flagged as draft.
5. **Works in a school.** Self-hosted media, fast on modest connections, usable on classroom screens and phones.

## Accessibility & Inclusion

WCAG 2.2 AA: every text and background pair passes contrast, tap targets are at least 44px, and `prefers-reduced-motion` is respected. The audience includes children, so reading level stays plain.
