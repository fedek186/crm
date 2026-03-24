## Local Development

This project runs inside the [`crm`](/Users/tomas/Documents/GitHub/piggy-crm/crm) folder and is expected to use Node `22.13.0`.

1. Load the expected Node version with `nvm`:

```bash
cd /Users/tomas/Documents/GitHub/piggy-crm/crm
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use || nvm install
```

2. Create a local env file for development:

```bash
cp .env.production .env.local
```

3. Install dependencies and start the development server:

```bash
npm ci
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000) with your browser.

## Environment Variables

The app expects at least:

- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_KEY`

For local development, keep them in `.env.local`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
