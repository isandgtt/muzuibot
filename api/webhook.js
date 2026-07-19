import express from 'express';
import bot from '../src/bot.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const url = process.env.WEBHOOK_URL;
const token = process.env.BOT_TOKEN;

// Set webhook if WEBHOOK_URL is provided
if (url) {
    bot.setWebHook(`${url}/api/webhook`)
        .then(() => console.log(`Webhook set to: ${url}/api/webhook`))
        .catch(err => console.error("Error setting webhook:", err));
}

app.post('/api/webhook', (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

app.get('/', (req, res) => {
    res.send('MuzuiBot is running!');
});

// For local testing of express server (if not deployed to Vercel and WEBHOOK_URL is provided)
if (process.env.NODE_ENV !== 'production' && url) {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`Express server is listening on port ${port}`);
    });
}

export default app;
