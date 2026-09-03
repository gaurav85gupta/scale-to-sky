# Northfield & Co. — Marketing Website

A 5-page premium marketing website built with vanilla HTML5, CSS3, and JavaScript. No frameworks or build step required.

## Structure

```
index.html          Home
about.html           About
services.html        Services
portfolio.html       Portfolio (with working category filters)
contact.html         Contact (with client-side form validation)
css/style.css        All styles, using CSS custom properties for theming
js/main.js           All interactivity, organized into isolated init functions
assets/              Empty folders for your own images/icons/logos
```

## Running locally

No build tools needed. Open `index.html` directly in a browser, or serve the folder with any static server, e.g.:

```
npx serve .
```

## Notes

- **Images**: hero, work, and portfolio images currently point to Unsplash URLs as stand-ins. Replace `src` attributes in `index.html` and `portfolio.html` with your own assets in `assets/images/`.
- **Contact form**: fully validated client-side (required fields, email format, message length) with an inline error and success state. No backend is wired up — see the comment block in `js/main.js` inside `initContactForm()` for the exact spot to add a real `fetch()` call to your API or form service.
- **Content**: all copy (team names, stats, testimonials, case studies) is placeholder written for a fictional agency called "Northfield & Co." — swap in your real brand, people, and results.
- **Colors/fonts**: all theme values live in `:root` at the top of `css/style.css` — change `--primary` etc. to re-theme the whole site in one place.
