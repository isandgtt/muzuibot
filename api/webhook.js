import 'dotenv/config';
import express from 'express';
import bot from '../src/bot.js';
import { SessionManager } from '../src/services/SessionManager.js';

const app = express();
app.use(express.json());

const url = process.env.WEBHOOK_URL;
const token = process.env.BOT_TOKEN;

if (url) {
    bot.setWebHook(`${url}/api/webhook`)
        .then(() => console.log(`Webhook set to: ${url}/api/webhook`))
        .catch(err => console.error("Error setting webhook:", err));
}

app.post('/api/webhook', (req, res) => {
    bot.processUpdate(req.body);
    SessionManager.checkTimeouts(bot).catch(()=>{});
    res.sendStatus(200);
});

app.get('/', (req, res) => {
    res.send('MuzuiBot is running!');
});

if (process.env.NODE_ENV !== 'production' && url) {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`Express server is listening on port ${port}`);
    });
}

export default app;
