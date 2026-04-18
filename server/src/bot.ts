const BOT_TOKEN = process.env.BOT_TOKEN!;
const CLIENT_URL = process.env.CLIENT_URL!;
const SERVER_URL = process.env.SERVER_URL!;

async function tgApi(method: string, body: object) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function setupWebhook() {
  const url = `${SERVER_URL}/webhook`;
  const result = await tgApi('setWebhook', { url, drop_pending_updates: true });
  console.log('Webhook set:', result);
}

export async function handleUpdate(update: Record<string, unknown>) {
  const message = update.message as Record<string, unknown> | undefined;
  if (!message) return;

  const chatId = (message.chat as Record<string, unknown>)?.id;
  const text = message.text as string | undefined;
  const from = message.from as Record<string, unknown> | undefined;
  const firstName = (from?.first_name as string) ?? 'Player';

  if (text === '/start') {
    await tgApi('sendMessage', {
      chat_id: chatId,
      text: `🃏 Привет, ${firstName}!\n\nДобро пожаловать в *Дурак* — онлайн карточная игра!\n\n💰 Начальный баланс: *100 монет*\n🎮 Играй против ИИ или живых игроков\n🏆 Побеждай и умножай монеты!\n\nНажми кнопку ниже чтобы начать:`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          { text: '🎮 Играть в Дурак', web_app: { url: CLIENT_URL } }
        ]]
      }
    });
  } else if (text === '/stats') {
    await tgApi('sendMessage', {
      chat_id: chatId,
      text: '📊 Открой игру для просмотра статистики:',
      reply_markup: {
        inline_keyboard: [[
          { text: '📈 Моя статистика', web_app: { url: `${CLIENT_URL}/stats` } }
        ]]
      }
    });
  }
}
