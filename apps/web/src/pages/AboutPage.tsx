// About/brand page (board task E5, spec docs/design/about.md — D4). Copy-led, single
// column, no motion, no interactive component — per D4 §1, this page is deliberately
// simpler than the lookbook page.
//
// Hard rule (D4, carried from D1/the project brief): every [PLACEHOLDER: ...] marker
// below is rendered VERBATIM, brackets included. Nothing here is invented, hidden,
// stripped, or paraphrased around — the owner reviewing the live page should see at a
// glance what's still missing. Do not "fill in" a placeholder in this file.
export function AboutPage() {
  return (
    <section className="page page-about">
      <p className="lookbook-kicker"># about.md</p>
      <h1 className="about-hero__title">About ZeroJance</h1>

      <p className="about-copy">
        ZeroJance makes workwear for people who live inside terminals, tickets, and
        on-call rotations. Not costumes for people who think that sounds cool — clothes
        for people who already know what a 2am stack trace looks like.
      </p>
      <p className="about-copy">
        Software work has its own folklore. Not the sci-fi kind — the specific,
        unglamorous kind: a <code>git blame</code> that only ever finds your own name, a
        cron job nobody remembers writing, the gap between &quot;works on my machine&quot;
        and &quot;works in prod.&quot; We&apos;re not interested in hacking the mainframe.
        We&apos;re interested in the stuff that&apos;s actually true.
      </p>

      <h2 className="about-section__heading">The name</h2>
      <p className="about-copy">
        We tend to read it near &quot;zero&quot; — exit code 0, index 0, a null result —
        against something that rhymes with &quot;riddance,&quot; or &quot;chance.&quot;
        Take that as a style note, not an origin story. [PLACEHOLDER: the real meaning or
        origin of the name &quot;ZeroJance&quot;, if there is one beyond the style note
        above — do not present the style note as fact if a real origin is supplied later]
      </p>

      <h2 className="about-section__heading">Where this started</h2>
      <p className="about-copy">
        Founded in [PLACEHOLDER: year] by [PLACEHOLDER: founder name or detail], in
        [PLACEHOLDER: location]. [PLACEHOLDER: the specific reason ZeroJance exists — what
        problem, whose idea, why apparel]
      </p>

      <h2 className="about-section__heading">What we make</h2>
      <p className="about-copy">
        Shirts, sweatshirts, and hats. Every care label, hangtag, and size note is styled
        like something a computer would actually output — a config file, a crontab
        listing, an access log, a <code>git blame</code> trace. If a detail isn&apos;t
        technically accurate, it doesn&apos;t ship. We&apos;d rather cut a joke than get
        the syntax wrong.
      </p>

      <h2 className="about-section__heading">Who this is for</h2>
      <p className="about-copy">
        People who&apos;ve read a stack trace out loud to nobody. People who know the
        difference between 403 and 404 without looking it up. If that&apos;s not you yet,
        the shirts still fit.
      </p>
    </section>
  );
}
