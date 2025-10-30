# SEO Quick Start Checklist

## 🚀 Immediate Actions (Do This Today)

### 1. Get Search Engine Verification (15 minutes)

**Google Search Console:**
1. Visit: https://search.google.com/search-console
2. Click "Add Property" → Enter `https://guapital.com`
3. Choose "HTML tag" method
4. Copy the code from the meta tag (format: `google-site-verification=ABC123...`)
5. Update `src/app/layout.tsx` line 92 with your code
6. Deploy to production
7. Return to Search Console and click "Verify"

**Bing Webmaster Tools:**
1. Visit: https://www.bing.com/webmasters
2. Click "Add a site" → Enter `https://guapital.com`
3. Choose "HTML Meta Tag" method
4. Copy the verification code
5. Update `src/app/layout.tsx` line 93 with your code
6. Deploy to production
7. Return to Bing and click "Verify"

### 2. Submit Your Sitemap (5 minutes)

**After verification codes are live:**

Google Search Console:
- Go to "Sitemaps" in left sidebar
- Enter: `sitemap.xml`
- Click "Submit"

Bing Webmaster Tools:
- Go to "Sitemaps" in left sidebar
- Enter: `https://guapital.com/sitemap.xml`
- Click "Submit"

### 3. Create Social Sharing Images (30 minutes)

You need these images for proper SEO:

**Required:**
- `/public/og-image.jpg` (1200x630px)
- `/public/twitter-image.jpg` (1200x675px)
- `/public/assets/logo.png` (512x512px)

**Quick Design Tips:**
- Use Canva (free templates available)
- Brand colors: Dark Teal (#004D40), Gold (#FFC107)
- Include "Guapital" logo + tagline
- Keep text large (readable at small sizes)

**Validation:**
- Test with Facebook Debugger: https://developers.facebook.com/tools/debug/
- Test with Twitter Card Validator: https://cards-dev.twitter.com/validator

---

## 📝 Priority Content (First 30 Days)

Write these articles in order (based on search volume + difficulty):

### Article 1: "How to Calculate Net Worth: Complete Guide + Free Tracker"
- **Target keyword:** "how to calculate net worth" (18,000 searches/month)
- **Length:** 2,500 words
- **Include:**
  - Formula: Assets - Liabilities = Net Worth
  - Step-by-step examples
  - Common assets people forget (401k, HSA, stock options)
  - Free calculator/tracker CTA
- **Timeline:** Week 1-2

### Article 2: "Net Worth Percentile by Age: Where Do You Rank?"
- **Target keyword:** "net worth percentile by age" (12,000 searches/month)
- **Length:** 2,800 words
- **Include:**
  - SCF 2022 data by age bracket
  - Interactive percentile tables
  - Real examples by age (25, 30, 35, 40)
  - CTA to Guapital's percentile tracker
- **Timeline:** Week 2-3 (or update existing post)

### Article 3: "Am I Wealthy for My Age? Net Worth Comparison Tool"
- **Target keyword:** "am i wealthy for my age" (8,500 searches/month)
- **Length:** 2,200 words
- **Include:**
  - Quick self-assessment quiz
  - Percentile calculator
  - What "wealthy" means at different ages
  - Steps to improve your ranking
- **Timeline:** Week 3-4

---

## ✅ Technical SEO Checklist

### Completed ✓
- [x] robots.txt created
- [x] Dynamic sitemap.xml implemented
- [x] Meta tags optimized (title, description, keywords)
- [x] Open Graph tags configured
- [x] Twitter Card tags configured
- [x] Structured data (JSON-LD) added
- [x] Canonical URLs set
- [x] Robot directives configured

### To Do
- [ ] Add verification codes (Google + Bing)
- [ ] Create social images
- [ ] Submit sitemap to search engines
- [ ] Run Lighthouse audit (target >90)
- [ ] Test mobile responsiveness
- [ ] Validate structured data: https://search.google.com/test/rich-results

---

## 📊 Weekly Monitoring (Once Live)

### Google Search Console (Check Every Monday)
1. Go to Performance report
2. Note these metrics:
   - Total impressions (goal: growing week-over-week)
   - Total clicks (goal: 3-5% CTR)
   - Average position (goal: <20, then <10)
3. Check Coverage report for errors
4. Look at top queries → content ideas

### Bing Webmaster Tools (Check Monthly)
1. Review SEO reports
2. Check crawl stats
3. Monitor indexed pages
4. Review keyword rankings

---

## 🎯 Success Milestones

### Week 1
- [ ] All pages indexed by Google (verify with `site:guapital.com`)
- [ ] Sitemap shows no errors
- [ ] First blog article published

### Month 1
- [ ] 500+ impressions in Search Console
- [ ] 15+ organic clicks
- [ ] 3 high-quality blog articles live
- [ ] Core Web Vitals all green

### Month 3
- [ ] 2,000+ impressions
- [ ] 60+ organic clicks
- [ ] 5+ blog articles
- [ ] First organic signup from SEO

### Month 6
- [ ] 8,000+ impressions
- [ ] 240+ organic clicks
- [ ] 8+ blog articles
- [ ] 3-5% organic conversion rate

---

## 🚨 Common Issues & Quick Fixes

### "My pages aren't indexed"
**Fix:**
1. Go to Google Search Console → URL Inspection
2. Enter your page URL
3. Click "Request Indexing"
4. Wait 3-7 days, check again

### "I have impressions but no clicks"
**Fix:**
1. Improve title tags (add year, numbers, questions)
2. Rewrite meta descriptions (add call-to-action)
3. Example: "Net Worth Tracker" → "Best Net Worth Tracker 2025 (Free + Paid)"

### "My rankings dropped"
**Fix:**
1. Check for technical errors in Search Console
2. Ensure content is still fresh (update dates)
3. Check if competitors published better content
4. Add more internal links to affected page

---

## 📞 Need Help?

**Resources:**
- Full guide: `/documentations/SEO_IMPLEMENTATION_GUIDE.md`
- SEO strategy: See `CLAUDE.md` section on "SEO & Content Strategy"
- Blog setup: `/src/app/blog/README.md`

**External Help:**
- Google Search Central: https://developers.google.com/search
- Moz Beginner's Guide: https://moz.com/beginners-guide-to-seo
- Next.js SEO Docs: https://nextjs.org/learn/seo/introduction-to-seo

---

## 🎉 You're Ready to Launch!

**Before going live, verify:**
- [ ] Verification codes added to layout.tsx
- [ ] Social images created and uploaded
- [ ] At least 1 blog article published
- [ ] Lighthouse score >85
- [ ] All links tested and working
- [ ] Mobile version tested on real device

**After going live:**
- [ ] Submit sitemaps (Google + Bing)
- [ ] Request indexing for homepage + pricing
- [ ] Share first blog article on social media
- [ ] Monitor Search Console daily for first week

**Remember:** SEO takes 3-6 months to show results. Focus on creating genuinely helpful content that targets real search queries. Consistency wins.
