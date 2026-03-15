# CareerIQ — Embed Guide

**Version 1.0 · For nonprofit program staff and web admins**

---

## What is CareerIQ?

CareerIQ is a free, interactive financial literacy tool for 9th–12th grade students. It helps students explore the financial implications of their college and career choices — estimated starting salaries, projected loan burdens, school comparisons, and long-term earnings — grounded in real national data.

It requires **no login**, collects **no student data**, and is free to embed under CC BY 4.0.

---

## Option A: iFrame Embed (Recommended)

Paste this single snippet into any page on your website. Works with WordPress, Squarespace, Webflow, Wix, and any custom HTML.

```html
<iframe
  src="https://careeriqdecision.netlify.app"
  width="100%"
  height="750"
  style="border: none; border-radius: 12px; display: block;"
  title="CareerIQ Financial Literacy Tool"
  loading="lazy"
></iframe>
```

**Minimum recommended height:** 750px  
**Minimum recommended width:** 600px (the tool is responsive down to 320px but works best at 600px+)

### Auto-resizing iFrame (optional)

To make the iFrame resize automatically to fit its content, add this script after the iFrame tag:

```html
<script>
window.addEventListener('message', function(e) {
  if (e.origin !== 'https://careeriqdecision.netlify.app') return;
  if (!e.data || e.data.type !== 'careeriq:resize') return;
  document.querySelector('iframe[src*="careeriqdecision"]').style.height =
    Math.max(600, e.data.height) + 'px';
});
</script>
```

---

## Option B: JavaScript Widget (v1.1)

For tighter visual integration — mounts CareerIQ into any `<div>` on your page.

```html
<div id="careeriq-widget"></div>
<script
  src="https://careeriqdecision.netlify.app/embed.js"
  data-target="careeriq-widget">
</script>
```

**Optional attributes on the `<script>` tag:**

| Attribute | Default | Description |
|---|---|---|
| `data-target` | `"careeriq-widget"` | ID of the div to mount into |
| `data-height` | auto | Fixed height in px (omit for auto-resize) |

---

## Host Site Requirements

| Requirement | Detail |
|---|---|
| HTTPS | Your site must be served over HTTPS |
| Content Security Policy | Must allow framing from `careeriqdecision.netlify.app` |
| Minimum container width | 320px (recommended 600px+) |
| Browser support | Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ |
| Authentication | None required |
| Data sharing | None — no student data passes between CareerIQ and your site |

### WordPress

Use a Custom HTML block and paste the iFrame snippet above.

### Squarespace

Use a Code Block (in Embed or Code block) and paste the iFrame snippet.

### Webflow

Use an Embed component and paste the iFrame snippet.

---

## What's Inside the Widget

| Tool | What it does |
|---|---|
| **Predict Income** | Estimates starting salary by college, major, job title, location, experience |
| **Loan Estimator** | Breaks down cost of attendance and projects 4-year loan burden |
| **Compare Schools** | Side-by-side salary and 30-year lifetime earnings for two colleges |
| **Loan ROI** | Assesses whether salary can cover loan payments and living expenses |
| **What-If Scenarios** | All 12 location × experience salary combinations at once |
| **Export Report** | Printable one-page PDF summary for counseling sessions |

---

## License & Attribution

CareerIQ is released under **CC BY 4.0** (Creative Commons Attribution 4.0 International).  
Free for nonprofit and classroom use with attribution to **Advaith Ramanan**.

Attribution is displayed within the widget itself. You do not need to add additional credit on your page, but you must not remove or obscure the CC BY 4.0 notice inside the tool.

---

## Support

For integration questions during initial rollout, contact the CareerIQ team.  
Standalone URL: **careeriqdecision.netlify.app**
