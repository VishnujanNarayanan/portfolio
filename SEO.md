# SEO Strategy & Architecture

## Core SEO Rules (apply to every page)

### Meta tags — every page must have
- Unique <title> tag: "Page Name | Vishnujan Narayanan"
- Unique meta description: 150-160 chars, includes primary keyword
- Canonical URL: <link rel="canonical" href="https://yourdomain.com/page">
- Open Graph: og:title, og:description, og:image, og:url, og:type
- Twitter card: twitter:card, twitter:title, twitter:description, twitter:image
- meta robots: index, follow on all public pages

### Structured data (JSON-LD — add to every page)
- Person schema on homepage (name, jobTitle, url, sameAs for github/linkedin)
- BreadcrumbList on all sub-pages
- Article schema on every blog post (headline, datePublished, dateModified, author)
- WebSite schema on homepage with SearchAction if search is added later

### Performance (affects ranking)
- All images use width + height attributes to prevent layout shift
- Lazy load all images below the fold
- Preconnect to Google Fonts in <head>
- No render-blocking scripts — all JS deferred or at bottom of body
- Target Lighthouse performance score > 90

### Sitemap & crawlability
- /sitemap.xml listing all pages with lastmod and priority
- /robots.txt allowing all crawlers, pointing to sitemap
- No orphan pages — every page reachable from nav or internal link

---

## Page Architecture for SEO

### Homepage (index.html)
- Target keyword: "data engineer India" / "backend engineer Python"
- H1: one instance only — hero title
- H2s: one per section (Projects, Skills, Services, Blog)
- Internal links to every project page and blog post

### Projects — each project gets its own page
Path: /projects/market-data-pipeline/
Path: /projects/fraud-detection/
Path: /projects/product-explorer/
Path: /projects/nse-stock-prediction/

Each project page must have:
- Unique <title>: "Project Name — Vishnujan Narayanan"
- Meta description mentioning tech stack and outcome
- H1: project name
- Full project description from master_profile.yaml bullet_pool
- Tech stack listed as a visible tag list (not hidden in JS)
- GitHub link with rel="noopener" (do NOT use nofollow — GitHub is trusted)
- Breadcrumb: Home > Projects > Project Name
- Link back to homepage and projects section
- Article or main schema with datePublished

### Blog — each post gets its own page
Path: /blog/how-i-scraped-nse-insider-filings/
Path: /blog/building-resumable-etl-pipelines/
Path: /blog/minute-level-stock-prediction/

Each blog post page must have:
- Unique <title>: "Post Title — Vishnujan Narayanan"
- Meta description: first 155 chars of post intro
- H1: post title (exact match to title tag)
- Article JSON-LD with datePublished, dateModified, author Person schema
- Estimated read time in visible text
- Tags/categories visible on page and linking to tag index eventually
- At least 800 words per post — thin content does not rank
- Internal links to relevant project pages within post body
- Canonical URL

### Blog index page
Path: /blog/
- Lists all posts with title, date, excerpt, read time
- Paginate if more than 10 posts eventually
- No duplicate content — excerpts only, not full post text

---

## URL Structure
- All lowercase, hyphen-separated, no underscores
- Short and descriptive: /projects/fraud-detection/ not /projects/Fraud_Transaction_Detection/
- No trailing parameters or session IDs
- Permanent — never change a URL once published (301 redirect if you must)

## Internal Linking Rules
- Every project card on homepage links to its own project page
- Every blog preview on homepage links to its own blog post page
- Blog posts link to related project pages where relevant
- Footer contains links to all top-level pages
- Nav contains: Projects, Skills, Services, Blog

## What NOT to do
- Do not use #hash-only links for project/blog content (not indexable as separate pages)
- Do not put important content only inside JS — Google crawls it inconsistently
- Do not duplicate meta descriptions across pages
- Do not stuff keywords — write for humans first
- Do not block CSS or JS in robots.txt — Google needs them to render the page

## Page priority for sitemap.xml
- Homepage: 1.0
- Project pages: 0.8
- Blog posts: 0.8
- Blog index: 0.7
- Skills/Services (if separate pages): 0.6

## Future additions when ready
- Add /sitemap.xml generation script
- Add /rss.xml feed for blog
- Submit sitemap to Google Search Console
- Set up Google Search Console and monitor Core Web Vitals
- Add hreflang if multilingual content added later
