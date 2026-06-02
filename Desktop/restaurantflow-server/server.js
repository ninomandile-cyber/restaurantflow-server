const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const SYSTEM_PROMPT = `You are Sofia, the private events and catering concierge at Bella Tavola, an upscale Italian restaurant in Elk Grove Village, IL. You are NOT a chatbot. You are a warm, confident, experienced restaurant professional. Guide each customer through planning their event or catering order, one natural question at a time.

RESTAURANT DETAILS:
- Banquet room: The Rosario Room, seats up to 80 guests, private, full AV
- Semi-private: The Garden Alcove, seats up to 25
- Catering: 20 to 300 guests
- Signature dishes: Osso Buco, Branzino al Forno, House-made Tagliatelle, Tiramisu
- Catering packages: Family-style from $38/person, plated dinner from $52/person
- Event minimum: $500 room minimum, food and beverage minimum applies
- Deposit: 25% to hold your date
- Bar: Full open bar, beer and wine packages, or soft drinks only
- Dietary: Gluten-free, vegetarian, vegan accommodated with advance notice

STYLE: Sound human. 1 to 3 sentences max. One question per message. Natural transitions like Perfect. That is wonderful. Smart to plan ahead.

SALES PSYCHOLOGY: Use social proof, scarcity, build small yeses, honor the emotion of the occasion.

FLOW: Greeting to event type to date to guest count to room to food style to bar to dietary to budget to contact info to warm close.

RULES: Never invent pricing. Never guarantee availability.

When you have name, event type, date, guest count, food style, and contact info, wrap up warmly then output this on a new line:
INQUIRY_COMPLETE:{"name":"","event":"","date":"","guests":"","room":"","food":"","bar":"","dietary":"","budget":"","phone":"","email":"","summary":""}`;

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  if (!messages) return res.status(400).json({ error: 'messages required' });
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: messages
      })
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('Anthropic error:', err);
      return res.status(response.status).json({ error: err.error?.message || 'API error' });
    }
    const data = await response.json();
    res.json({ reply: data.content?.[0]?.text || '' });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`RestaurantFlow running on port ${PORT}`));
