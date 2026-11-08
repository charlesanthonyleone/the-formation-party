# The Formation Party — static publication build

Unpublished local site. No git, GitHub, hosting, registration, or deployment has been used.

## Preview
From this directory, run `python3 -m http.server 8080 --bind 127.0.0.1`, then open `http://127.0.0.1:8080/`. This command is optional; no server is required for ordinary file browsing.

## Pages
- index.html — home
- about.html — party identity and boundaries
- philosophy.html — platform overview and preamble
- civilization.html — Part I, chapters 1–5
- the-commons.html — Part II, chapters 6–9
- stewardship.html — Part III, chapters 10–13
- republic-and-household.html — Part IV, chapters 14–17
- knowledge-and-technology.html — Part V, chapters 18–21
- common-life.html — Part VI, chapters 22–25, including unfinished obligations
- join.html — founding participation, with honest intake status

## Content and behavior
All 25 chapter bodies are preserved from ../PARTY-PHILOSOPHY.md. The preamble identifies the intellectual inheritance without displaying its source brand outside the footer. Chapter numbers and anchors are stable. No analytics, forms, third-party scripts, tracking, payments, fabricated contacts, or membership counts. The founding worksheet is a local text download, not enrollment.

Shared styles.css and site.js provide responsive layout and progressive mobile navigation. Without JavaScript all navigation remains visible. No external font or image requests. Keyboard skip link, visible focus, reduced-motion support, print styles, and meaningful landmarks included.

## Publication prerequisites
Membership intake and verified organizing contacts are deliberately absent until established. Obtain authorization and verify organizational/legal status before public deployment. Do not imply registration or ballot access. The footer does not claim either. The other party sites were not used as templates and were not modified.

Validation details: ../formation-validation.json. Preview PNGs, if present, are in ../previews/.

### Validation scope
The supplied PNG previews are cropped WeasyPrint static screen renderings, not browser captures. Automated comparison verifies that all 25 chapter bodies and their substantive subheads match the source, and that local files and fragment links resolve. Four-width static-render box checks cover 1440, 768, 390, and 320 pixels. Node unit tests cover menu opening and closing on link activation, Escape, outside click, hash changes, and viewport changes. A sanctioned live browser tool was not available in this executor; live browser verification of horizontal overflow and interaction remains outstanding before publication.
