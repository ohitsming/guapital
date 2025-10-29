# Email Setup Guide: Free Domain Email for Guapital

**Cost: $0/month**
**Time to Complete: 15-20 minutes**
**Difficulty: Beginner**

This guide shows you how to set up professional domain email (`support@guapital.com`, `hello@guapital.com`) completely free using Cloudflare Email Routing and Resend.

## 📋 What You'll Get

- ✅ **Receive emails** at any address (`support@guapital.com`, `hello@guapital.com`, etc.)
- ✅ **Send transactional emails** from Supabase (`noreply@guapital.com`)
- ✅ **Reply to users** from `support@guapital.com` via Gmail
- ✅ **3,000 emails/month** free on Resend (enough for early stage)
- ✅ **Professional appearance** and deliverability

## 🛠️ Prerequisites

- [ ] Domain name registered (e.g., `guapital.com`)
- [ ] Access to domain DNS settings
- [ ] Gmail account (for receiving/replying)
- [ ] Supabase project (for transactional emails)

---

## Part 1: Cloudflare Email Routing (Receiving Emails)

**Goal:** Forward `support@guapital.com` → your personal Gmail inbox

### Step 1: Transfer Domain to Cloudflare (Recommended)

**Why?** Cloudflare offers the cheapest domain registration ($8-10/year vs $12-20 elsewhere)

1. **Sign up for Cloudflare** (if you haven't already)
   - Go to [cloudflare.com](https://cloudflare.com)
   - Create a free account

2. **Add your domain**
   ```
   Cloudflare Dashboard → Add Site → Enter guapital.com → Select Free Plan
   ```

3. **Update nameservers** at your current registrar
   - Cloudflare will show you 2 nameservers (e.g., `bob.ns.cloudflare.com`)
   - Go to your current registrar (GoDaddy, Namecheap, etc.)
   - Update nameservers to Cloudflare's nameservers
   - **Wait 5-60 minutes** for DNS propagation

4. **Optional: Transfer domain to Cloudflare** (saves $5-10/year)
   ```
   Cloudflare Dashboard → Domain Registration → Transfer → Unlock domain at old registrar
   ```

### Step 2: Enable Email Routing

1. **Navigate to Email Routing**
   ```
   Cloudflare Dashboard → Select guapital.com → Email → Email Routing
   ```

2. **Click "Get Started"** or "Enable Email Routing"

3. **Add destination address** (your personal Gmail)
   ```
   Enter: your.personal@gmail.com
   Click: Send verification code
   Check Gmail and copy the code
   Paste code and verify
   ```

### Step 3: Create Email Routes

1. **Add email routes** (forwards)
   ```
   Click: Create address

   Route 1:
   Custom address: support
   Action: Send to an email → your.personal@gmail.com

   Route 2:
   Custom address: hello
   Action: Send to an email → your.personal@gmail.com

   Route 3:
   Custom address: founders
   Action: Send to an email → your.personal@gmail.com

   Route 4:
   Custom address: noreply
   Action: Send to an email → your.personal@gmail.com
   ```

2. **Enable Catch-All** (optional but recommended)
   ```
   Settings → Catch-all address → Enable
   Action: Send to → your.personal@gmail.com
   ```

   This forwards any email to `anything@guapital.com` to your inbox

### Step 4: Verify DNS Records

Cloudflare automatically adds the required DNS records:

```
MX record: @  →  route.mx.cloudflare.net
TXT record: @  →  "v=spf1 include:_spf.mx.cloudflare.net ~all"
```

**Check:** Email Routing dashboard should show **"Active"** status

### Step 5: Test Receiving

1. Send a test email from your personal Gmail to `support@guapital.com`
2. Check your Gmail inbox (should arrive in 10-30 seconds)
3. ✅ If received, Part 1 is complete!

**Troubleshooting:**
- If not received after 5 minutes, check spam folder
- Verify DNS records propagated: [dnschecker.org](https://dnschecker.org)
- Check Cloudflare Email Routing logs for errors

---

## Part 2: Resend (Sending Transactional Emails)

**Goal:** Send emails from Supabase auth using `noreply@guapital.com`

### Step 1: Sign Up for Resend

1. **Create account**
   - Go to [resend.com](https://resend.com)
   - Sign up with GitHub or email
   - **Free tier:** 3,000 emails/month, 100 emails/day

### Step 2: Add Your Domain

1. **Navigate to Domains**
   ```
   Resend Dashboard → Domains → Add Domain
   ```

2. **Enter your domain**
   ```
   Domain: guapital.com
   Click: Add
   ```

### Step 3: Configure DNS Records

Resend will show you 3 DNS records to add. Go to Cloudflare:

```
Cloudflare Dashboard → guapital.com → DNS → Records → Add record
```

**Add these 3 records:**

1. **SPF Record (TXT)**
   ```
   Type: TXT
   Name: @
   Content: v=spf1 include:spf.resend.com ~all
   TTL: Auto
   Proxy: DNS only (gray cloud)
   ```

   **Note:** If you already have an SPF record from Cloudflare Email Routing, merge them:
   ```
   v=spf1 include:_spf.mx.cloudflare.net include:spf.resend.com ~all
   ```

2. **DKIM Record (CNAME)**
   ```
   Type: CNAME
   Name: resend._domainkey
   Target: [shown in Resend dashboard, e.g., resend1.resend.com]
   TTL: Auto
   Proxy: DNS only (gray cloud)
   ```

3. **Tracking Domain (CNAME)** - Optional
   ```
   Type: CNAME
   Name: r
   Target: track.resend.com
   TTL: Auto
   Proxy: DNS only (gray cloud)
   ```

### Step 4: Verify Domain in Resend

1. **Wait 5-10 minutes** for DNS propagation
2. **Go back to Resend Dashboard** → Domains
3. **Click "Verify"** next to guapital.com
4. **Status should change to "Verified"** ✅

**Troubleshooting:**
- If verification fails, check DNS records in Cloudflare
- Use [MXToolbox](https://mxtoolbox.com/spf.aspx) to validate SPF
- Wait 30+ minutes for full DNS propagation

### Step 5: Create API Key

1. **Navigate to API Keys**
   ```
   Resend Dashboard → API Keys → Create API Key
   ```

2. **Create key**
   ```
   Name: Guapital Production
   Permission: Full Access (or "Sending access" only)
   Click: Create
   ```

3. **Copy the API key** (starts with `re_`)
   ```
   Example: re_123abc456def789ghi
   ```

   ⚠️ **Important:** Save this key securely. You won't see it again!

### Step 6: Test Sending

**Option A: Test via Resend Dashboard**
```
Resend Dashboard → Emails → Send test email

From: noreply@guapital.com
To: your.personal@gmail.com
Subject: Test Email
Body: Hello from Guapital!

Click: Send
```

**Option B: Test via cURL**
```bash
curl -X POST 'https://api.resend.com/emails' \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "from": "noreply@guapital.com",
    "to": ["your.personal@gmail.com"],
    "subject": "Test Email from Guapital",
    "html": "<strong>Hello</strong> from Guapital!"
  }'
```

✅ Check your Gmail inbox for the test email

---

## Part 3: Configure Supabase to Use Resend

**Goal:** Send auth emails (signup, password reset) via Resend instead of Supabase's default email

### Step 1: Add Resend API Key to Environment Variables

1. **Open your `.env.local` file**
   ```bash
   # Email (Resend)
   RESEND_API_KEY=re_your_api_key_here
   ```

2. **Add to production environment** (AWS Amplify, Vercel, etc.)
   ```
   AWS Amplify Console → Environment Variables

   Key: RESEND_API_KEY
   Value: re_your_api_key_here
   ```

### Step 2: Configure Supabase SMTP Settings

1. **Go to Supabase Dashboard**
   ```
   Supabase Dashboard → Project Settings → Authentication
   ```

2. **Scroll to "SMTP Settings"**

3. **Enable Custom SMTP**
   ```
   Enable Custom SMTP: Toggle ON

   Sender email: noreply@guapital.com
   Sender name: Guapital

   Host: smtp.resend.com
   Port number: 587
   Minimum interval between emails (seconds): 60

   Username: resend
   Password: [Your Resend API Key - re_123abc...]
   ```

4. **Click "Save"**

### Step 3: Apply Email Templates

You already have beautiful email templates! Now ensure they're applied:

1. **Go to Authentication → Email Templates**

2. **Apply templates for:**
   - Confirm signup
   - Reset password
   - Magic link (if using passwordless auth)

3. **Update logo URLs** in templates:
   ```html
   Replace: https://guapital.com/assets/logo4.png

   With: https://[your-project].supabase.co/storage/v1/object/public/public-assets/logo4.png
   ```

   (Or your production URL once deployed)

### Step 4: Test Supabase Auth Emails

1. **Sign up with a test email** on your app
   ```
   http://localhost:3000/signup
   ```

2. **Check your inbox** for confirmation email

3. **Verify:**
   - [ ] Email sent from `noreply@guapital.com`
   - [ ] Logo displays correctly
   - [ ] Button links work
   - [ ] Styling looks professional
   - [ ] Not in spam folder

4. **Test password reset flow:**
   ```
   http://localhost:3000/login/forgot-password
   ```

**Troubleshooting:**
- If emails not arriving, check Supabase logs: `Authentication → Logs`
- Check Resend logs: `Resend Dashboard → Emails`
- Verify SMTP credentials are correct
- Check spam folder

---

## Part 4: Reply to Users from Gmail

**Goal:** Reply to customer emails from `support@guapital.com` using Gmail's interface

### Step 1: Configure Gmail "Send As"

1. **Open Gmail Settings**
   ```
   Gmail → Click gear icon → See all settings → Accounts and Import
   ```

2. **Add "Send mail as" address**
   ```
   Send mail as → Add another email address

   Name: Guapital Support
   Email: support@guapital.com
   ☐ Treat as an alias (leave unchecked)

   Click: Next Step
   ```

### Step 2: Configure SMTP Server

1. **Enter SMTP settings**
   ```
   SMTP Server: smtp.resend.com
   Port: 587
   Username: resend
   Password: [Your Resend API Key - re_123abc...]

   ☑ Secured connection using TLS

   Click: Add Account
   ```

2. **Verify email address**
   - Gmail sends a verification code to `support@guapital.com`
   - Check your Gmail inbox (forwarded from Cloudflare)
   - Copy the code
   - Paste and confirm

### Step 3: Set as Default (Optional)

```
Gmail Settings → Accounts and Import → Send mail as

○ Your Name <your.personal@gmail.com>
● Guapital Support <support@guapital.com>  ← Select this

☑ Reply from the same address the message was sent to (recommended)
```

### Step 4: Test Replying

1. **Send yourself an email** to `support@guapital.com`
2. **Reply from Gmail**
3. **Verify "From" address** shows `support@guapital.com`
4. **Check recipient** sees professional sender

✅ You can now handle customer support from Gmail with professional branding!

---

## 📊 Summary: What You've Set Up

| Feature | Tool | Cost | Capacity |
|---------|------|------|----------|
| **Receiving emails** | Cloudflare Email Routing | FREE | Unlimited |
| **Sending transactional emails** | Resend | FREE | 3,000/month |
| **Replying to users** | Gmail + Resend SMTP | FREE | Unlimited replies |
| **Domain registration** | Cloudflare (optional) | $8-10/year | - |

**Total Monthly Cost: $0**

---

## 🚀 Email Addresses You Now Have

| Email Address | Purpose | How It Works |
|---------------|---------|--------------|
| `support@guapital.com` | Customer support | Forwarded to Gmail, reply from Gmail |
| `hello@guapital.com` | General inquiries | Forwarded to Gmail |
| `founders@guapital.com` | Founder contact | Forwarded to Gmail |
| `noreply@guapital.com` | Supabase auth emails | Sent via Resend API |
| `*@guapital.com` | Catch-all (optional) | Forwarded to Gmail |

---

## 🔄 When to Upgrade

### **Upgrade to Zoho Mail ($1/month) when:**
- You need a dedicated inbox (not forwarding)
- You want mobile app access
- You need IMAP/POP for email clients
- You're sending 100+ support emails/day

### **Upgrade Resend to $20/month when:**
- You exceed 3,000 emails/month (around 1,000-1,500 users)
- You need 50,000 emails/month
- You need dedicated IP for deliverability

### **Upgrade to Google Workspace ($6/user/month) when:**
- You have a team (2+ people)
- You need Google Drive, Calendar, Meet
- You want professional credibility with investors

---

## 📈 Scaling Projections

| Users | Emails/Month | Cost | Recommendation |
|-------|--------------|------|----------------|
| 0-500 | <3,000 | **$0** | Free tier (this guide) |
| 500-2,000 | 3,000-10,000 | **$20** | Upgrade Resend only |
| 2,000-5,000 | 10,000-50,000 | **$20-40** | Resend Pro tier |
| 5,000+ | 50,000+ | **$52** | Google Workspace + Resend |

---

## 🛡️ Security Best Practices

### **SPF/DKIM/DMARC Setup**

Your setup already includes:
- ✅ **SPF:** Configured via Cloudflare + Resend
- ✅ **DKIM:** Configured via Resend
- ⚠️ **DMARC:** Recommended to add

**Add DMARC Record (Optional but Recommended):**

```
Cloudflare DNS → Add record

Type: TXT
Name: _dmarc
Content: v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@guapital.com
TTL: Auto
Proxy: DNS only
```

This tells email servers to quarantine emails that fail SPF/DKIM checks.

### **API Key Security**

- ⚠️ **Never commit** Resend API key to Git
- ✅ Store in `.env.local` (already in `.gitignore`)
- ✅ Add to AWS Amplify environment variables
- ✅ Rotate keys every 6-12 months

### **Rate Limiting**

Resend free tier limits:
- 100 emails/day
- 3,000 emails/month

**Monitor usage:**
```
Resend Dashboard → Usage
```

If you hit limits, upgrade to $20/month for 50,000/month.

---

## 🧪 Testing Checklist

Before launching to production:

- [ ] Send test email to `support@guapital.com` (should arrive in Gmail)
- [ ] Reply from Gmail as `support@guapital.com` (verify sender)
- [ ] Sign up with test account (verify confirmation email)
- [ ] Reset password (verify reset email)
- [ ] Test magic link (if enabled)
- [ ] Check emails not in spam folder
- [ ] Test on mobile (iOS Mail, Gmail app)
- [ ] Verify logo displays in all email clients
- [ ] Check email deliverability: [mail-tester.com](https://www.mail-tester.com)

---

## ❓ Troubleshooting

### **Emails not arriving**

1. **Check Cloudflare Email Routing logs:**
   ```
   Cloudflare Dashboard → Email → Email Routing → Logs
   ```

2. **Check Resend logs:**
   ```
   Resend Dashboard → Emails → Filter by status
   ```

3. **Verify DNS records:**
   ```
   https://dnschecker.org
   Search: guapital.com
   Record type: MX, TXT
   ```

4. **Test deliverability:**
   ```
   https://www.mail-tester.com
   Send test email, check score (aim for 8-10/10)
   ```

### **Emails going to spam**

1. **Warm up your domain** (send emails gradually)
2. **Improve email content** (avoid spam trigger words)
3. **Add DMARC record** (see Security Best Practices)
4. **Check sender reputation:** [senderscore.org](https://senderscore.org)

### **DNS not propagating**

- Wait 30-60 minutes
- Clear DNS cache: `sudo dscacheutil -flushcache` (Mac)
- Use different DNS checker: [whatsmydns.net](https://whatsmydns.net)

### **Resend verification failing**

- Ensure DNS records exactly match (copy-paste from Resend)
- Disable Cloudflare proxy (orange cloud → gray cloud)
- Check for duplicate records in Cloudflare DNS

---

## 📚 Additional Resources

- **Cloudflare Email Routing Docs:** https://developers.cloudflare.com/email-routing/
- **Resend Documentation:** https://resend.com/docs
- **Supabase SMTP Setup:** https://supabase.com/docs/guides/auth/auth-smtp
- **Email Deliverability Guide:** https://postmarkapp.com/guides/email-deliverability

---

## 🎉 You're Done!

You now have:
- ✅ Professional domain email at zero cost
- ✅ Reliable transactional email delivery
- ✅ Beautiful branded email templates
- ✅ Customer support inbox via Gmail
- ✅ Scalable infrastructure (upgrade as you grow)

**Next Steps:**
1. Update your website footer with `support@guapital.com`
2. Add email to Privacy Policy / Contact page
3. Set up auto-responder for `support@` (optional)
4. Monitor Resend usage as you grow

**Questions?** Reply to this guide or check the troubleshooting section.

Happy emailing! 📧
