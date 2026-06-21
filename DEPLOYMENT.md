# 🚀 Deployment Guide

This guide walks through deploying the AI Signature Generator as a Cloudflare Worker using the checked-in `wrangler.jsonc` configuration.

## 📋 Prerequisites

Before you begin, make sure you have:

- ✅ [GitHub Account](https://github.com/signup) (Free)
- ✅ [Cloudflare Account](https://dash.cloudflare.com/sign-up) (Free)
- ✅ [OpenAI API Key](https://platform.openai.com/api-keys) (Pay-per-use)
- ✅ [Node.js](https://nodejs.org/) installed (v16+)

## 🎯 Quick Deployment (5 minutes)

### Step 1: Clone and install

```bash
git clone https://github.com/zytakeshi/signature.git
cd signature
npm install
```

### Step 2: Login to Cloudflare

   ```bash
   npx wrangler login
   ```

### Step 3: Add the OpenAI secret

```bash
npx wrangler secret put OPENAI_API_KEY
```

### Step 4: Deploy

```bash
npm run deploy
```

The Worker name defaults to `ai-signature-generator` in `wrangler.jsonc`. To use a different Cloudflare Worker name, update the `name` field before deploying.

### Local development

For local testing, create `.dev.vars`:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

Then run:

```bash
npm run dev
```

## 🧪 Testing Your Deployment

### 1. Test the Application
- Visit your deployed URL
- Enter a name (e.g., "John Smith")
- Click "Proceed to Payment"
- Enter PIN: `Signature2024!`
- Verify signature generation works

### 2. Test Different Languages
- Change your browser language to Chinese
- Verify the UI switches to Chinese
- Test with Chinese names (e.g., "张三")

### 3. Test Mobile Responsiveness
- Open your app on mobile device
- Verify all features work correctly
- Check touch interactions

## 🔒 Security Checklist

Before going live, ensure:

- ✅ **PIN Changed**: Update the PIN in `src/index.ts`
- ✅ **API Key Secured**: Environment variable is set
- ✅ **HTTPS Enabled**: Cloudflare provides this automatically
- ✅ **Error Handling**: No sensitive data in error messages
- ✅ **Input Validation**: Names are properly validated

## 📊 Monitoring & Analytics

### Cloudflare Analytics
- Go to your Cloudflare Dashboard
- View analytics in the "Analytics" tab
- Monitor request volume and performance

### OpenAI Usage
- Check [OpenAI Usage Dashboard](https://platform.openai.com/usage)
- Monitor API costs and usage patterns

## 🚨 Troubleshooting

### Common Issues

**1. "Failed to generate signature"**
- Check OpenAI API key is correct
- Verify API key has sufficient credits
- Check OpenAI API status

**2. "Environment variable not found"**
- Ensure `OPENAI_API_KEY` is set with `npx wrangler secret put OPENAI_API_KEY`
- Redeploy after adding the secret

**3. "Deploy failed"**
- Verify `wrangler.jsonc` exists and points at `src/index.ts`
- Run `npm install` before deploying

**4. "PIN not working"**
- Verify PIN is `Signature2024!` (or your custom PIN)
- Check for typos in the PIN input

### Getting Help

- 📖 [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- 📖 [OpenAI API Docs](https://platform.openai.com/docs)
- 🐛 [Create GitHub Issue](https://github.com/zytakeshi/signature/issues)

## 💰 Cost Optimization

### Free Tier Limits
- **Cloudflare Workers**: 100,000 requests/day
- **OpenAI API**: Pay per request (~$0.04/image)

### Cost Reduction Tips
1. **Implement Caching**: Cache generated signatures
2. **Add Rate Limiting**: Prevent abuse
3. **Use Lower Resolution**: For testing/development
4. **Monitor Usage**: Set up alerts for high costs

## 🎉 Success!

Your AI Signature Generator is now live and ready to use! 

**Next Steps:**
- Share your app with friends and family
- Monitor usage and costs
- Consider adding more features
- Implement user feedback

---

**Need help?** Create an issue on GitHub or check the troubleshooting section above.
