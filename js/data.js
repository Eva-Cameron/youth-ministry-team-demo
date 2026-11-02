/* Events and downloads. The Latest panel, timelines and download lists read from here, so each
   item is entered once. sample: true marks entries still to be confirmed by the team. */
window.YMT = {
  audiences: {
    primary: { name: 'Primary', page: 'primary.html' },
    secondary: { name: 'Secondary', page: 'secondary.html' },
    volunteer: { name: '16+ and volunteers', page: 'volunteer.html' },
    everyone: { name: 'Everyone else', page: 'everyone.html' },
    school: { name: 'Schools', page: 'retreats.html' },
  },

  events: [
    { id: 'behold-y6-2026', prog: 'festival', title: 'Behold: Year 6 Festival 2026', date: '2026-06-22', end: '2026-06-29', place: 'Emmaus Youth Village', aud: ['primary'], img: 'ph-festival-crowd' },
    { id: 'behold-sec-2026', prog: 'festival', title: 'Behold: Secondary Festival 2026', date: '2026-07-01', end: '2026-07-03', place: 'Emmaus Youth Village', aud: ['secondary'], img: 'ph-festival-worship' },
    { id: 'significance-2026', prog: 'youth-village', title: 'Significance Festival', date: '2026-06-27', place: 'Emmaus Youth Village', aud: ['everyone'], img: 'ph-village-event' },

    { id: 'source-hartlepool', prog: 'the-source', title: 'The Source on tour: Hartlepool', date: '2026-11-10', time: 'Doors 6.30pm', place: 'Hartlepool', aud: ['secondary'], who: ['Year 9+', 'Students'], how: 'Free. Come on your own, with friends or with your parish group.', status: 'Free', img: 'tt-7698868037683842326', link: 'the-source.html' },
    { id: 'youth-council-nov', prog: 'youth-council', title: 'Youth Council gathering', date: '2026-11-21', place: 'Emmaus Youth Village', aud: ['secondary'], who: ['Year 9+'], how: 'A parent or carer reserves your place.', status: 'Reserve a place', img: 'ph-youth-group', link: 'youth-council.html', sample: true },
    { id: 'advent-retreats', prog: 'retreats', title: 'Advent retreats', date: '2026-12-01', end: '2026-12-18', place: 'Emmaus Youth Village', aud: ['primary', 'secondary'], who: ['Year groups'], how: 'Booked by your school.', status: 'Booking open', img: 'ph-retreat-prayer', link: 'retreats.html', sample: true },
    { id: 'lent-retreats', prog: 'retreats', title: 'Lent retreats', date: '2027-02-15', end: '2027-03-26', place: 'Emmaus Youth Village', aud: ['primary', 'secondary'], who: ['Year groups'], how: 'Booked by your school.', status: 'Booking open', img: 'ph-candid-1', link: 'retreats.html', sample: true },
    { id: 'flame-2027', prog: 'flame', title: 'Flame 2027 at Wembley', date: '2027-03-06', place: 'OVO Arena Wembley', aud: ['secondary', 'volunteer'], who: ['Secondary', 'Sixth form'], how: 'Hexham & Newcastle travels as a group. Ask your school or parish about places.', status: 'Sold out nationally', img: 'tt-7690975318466710806', link: 'learn-flame.html' },
    { id: 'internship-apps', prog: 'internship', title: 'Internship 2027–28 applications', date: '2027-03-01', place: 'Emmaus Youth Village', aud: ['volunteer'], who: ['Ages 18–30'], how: 'Apply with the brochure and application form.', status: 'Opens in spring', img: 'ph-interns', link: 'internship.html', sample: true },
    { id: 'village-weekends', prog: 'youth-village', title: 'Group weekends at the Village', date: '2027-01-15', place: 'Emmaus Youth Village', aud: ['everyone'], who: ['Parishes', 'Groups', 'Families'], how: 'Book the lodges for your group.', status: 'Booking open', img: 'ph-village-chalet', link: 'youth-village.html', sample: true },
    { id: 'behold-y6-2027', prog: 'festival', title: 'Year 6 Festival 2027', date: '2027-06-21', place: 'Emmaus Youth Village', aud: ['primary'], who: ['Year 6'], how: 'Booked by your school.', status: 'Dates to be confirmed', img: 'ph-festival-crowd', link: 'festival.html', sample: true },
    { id: 'sec-festival-2027', prog: 'festival', title: 'Secondary Festival 2027', date: '2027-06-30', end: '2027-07-02', place: 'Emmaus Youth Village', aud: ['secondary', 'volunteer'], who: ['Secondary', 'Crew 16+'], how: 'With your school, or sign up as crew.', status: 'Dates to be confirmed', img: 'ph-festival-stage', link: 'festival.html', sample: true },
    { id: 'lourdes-2027', prog: 'lourdes', title: 'Lourdes 2027: youth helpers', date: '2027-07-24', end: '2027-07-31', place: 'Lourdes, France', aud: ['volunteer'], who: ['Young people'], how: 'Apply as a youth helper.', status: 'Applications open', img: 'ph-sacraments', link: 'lourdes.html', sample: true },
  ],

  /* Downloads. Replace the PDFs in resources/ with final versions as they are ready. */
  resources: [
    { id: 'prepare-your-class', prog: 'retreats', title: 'Prepare your class', type: 'Guide', level: 'Before', aud: 'school', time: 'Teachers', summary: 'What to expect, the kit list and ground rules.' },
    { id: 'themes-scripture', prog: 'retreats', title: 'Themes and scripture pack', type: 'Pack', level: 'Before', aud: 'school', time: 'Teachers', summary: 'Prayers and passages to introduce before the retreat.' },
    { id: 'staff-briefing', prog: 'retreats', title: 'Staff briefing sheet', type: 'Guide', level: 'Before', aud: 'school', time: 'Staff', summary: 'Roles, ratios and the timetable.' },
    { id: 'parent-letter', prog: 'retreats', title: 'Parent and carer letter', type: 'Form', level: 'Before', aud: 'school', time: 'Editable', summary: 'Letter home with a consent slip.' },
    { id: 'follow-up-assembly', prog: 'retreats', title: 'Follow-up assembly', type: 'Session', level: 'After', aud: 'school', time: 'Assembly', summary: 'Bring the retreat back to the whole year group.' },
    { id: 'reflection-worksheets', prog: 'retreats', title: 'Reflection worksheets', type: 'Activity', level: 'After', aud: 'school', time: 'RE lesson', summary: 'Keep the conversation going in RE.' },
    { id: 'prayer-liturgy', prog: 'retreats', title: 'Prayer and liturgy ideas', type: 'Prayer', level: 'After', aud: 'school', time: 'Form time', summary: 'For chaplaincy and form time.' },
    { id: 'behold-y6-pack', prog: 'festival', title: 'Behold: Year 6 Festival pack', type: 'Pack', level: 'KS2', aud: 'primary', time: 'Teachers', event: 'behold-y6-2026', summary: 'Sessions for before and after the festival day.', sample: true },
    { id: 'what-is-adoration', prog: 'the-source', title: 'What is Adoration?', type: 'Formation', level: 'Year 9+', aud: 'secondary', time: '5 min read', event: 'source-hartlepool', summary: 'A short explainer to read before your first night at The Source.', article: 'learn-adoration.html' },
    { id: 'flame-prep', prog: 'flame', title: 'Getting ready for Flame', type: 'Session', level: 'KS4–KS5', aud: 'secondary', time: '40 min', event: 'flame-2027', summary: 'A session for your group in the weeks before Wembley.', sample: true },
    { id: 'safeguarding-helpers', prog: 'volunteer', title: 'Safeguarding basics for helpers', type: 'Formation', level: '16+', aud: 'volunteer', time: '15 min read', summary: 'What every volunteer needs to know before an event.', sample: true },
    { id: 'serving-lourdes', prog: 'lourdes', title: 'Serving in Lourdes', type: 'Formation', level: '16+', aud: 'volunteer', time: '10 min read', event: 'lourdes-2027', summary: 'What youth helpers do and how to prepare.', article: 'learn-lourdes.html' },
    { id: 'village-pack', prog: 'youth-village', title: 'Bringing your group to the Village', type: 'Guide', level: 'Groups', aud: 'everyone', time: 'Group leaders', event: 'village-weekends', summary: 'Lodges, meals, spaces and a sample weekend.', sample: true },
  ],
};
