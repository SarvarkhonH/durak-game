import { Player } from './models/Player';
import { GameRecord } from './models/GameRecord';

const BOT_TOKEN = process.env.BOT_TOKEN!;
const CLIENT_URL = process.env.CLIENT_URL!;
const SERVER_URL = process.env.SERVER_URL!;

async function tgApi(method: string, body: object): Promise<unknown> {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

export { tgApi };

export async function setupWebhook() {
  const result = await tgApi('setWebhook', {
    url: `${SERVER_URL}/webhook`,
    drop_pending_updates: true,
    allowed_updates: ['message', 'callback_query'],
  });
  // Set bot commands menu
  await tgApi('setMyCommands', {
    commands: [
      { command: 'start',       description: '🃏 Открыть игру Козырь' },
      { command: 'balance',     description: '💰 Мой баланс и статистика' },
      { command: 'leaderboard', description: '🏆 Топ игроков' },
      { command: 'bonus',       description: '🎁 Ежедневный бонус +50 монет' },
      { command: 'invite',      description: '🔗 Пригласить друга (+50 монет)' },
      { command: 'help',        description: '📖 Правила игры' },
    ],
  });
  console.log('Webhook set:', result);
}

export async function handleUpdate(update: Record<string, unknown>) {
  const message = update.message as Record<string, unknown> | undefined;
  const callbackQuery = update.callback_query as Record<string, unknown> | undefined;

  if (callbackQuery) {
    await handleCallback(callbackQuery);
    return;
  }

  if (!message) return;
  const chatId = (message.chat as Record<string, unknown>)?.id as number;
  const text = (message.text as string | undefined) ?? '';
  const from = message.from as Record<string, unknown> | undefined;
  const firstName = (from?.first_name as string) ?? 'Игрок';
  const username = (from?.username as string) ?? '';
  const telegramId = from?.id as number;

  // ── /start [refCode] ──────────────────────────────────────────────────────
  if (text.startsWith('/start')) {
    const parts = text.split(' ');
    const payload = parts[1] ?? '';
    let referrerId: number | null = null;

    // Referral: payload = "ref_12345678"
    if (payload.startsWith('ref_')) {
      const refId = Number(payload.replace('ref_', ''));
      if (refId && refId !== telegramId) referrerId = refId;
    }

    // Create or update player
    let player = await Player.findOne({ telegramId });
    if (!player) {
      player = await Player.create({
        telegramId,
        firstName,
        username,
        balance: 100,
        referredBy: referrerId,
      });

      // Reward referrer
      if (referrerId) {
        await Player.findOneAndUpdate(
          { telegramId: referrerId },
          { $inc: { balance: 50, referralCount: 1 } }
        );
        // Notify referrer
        await tgApi('sendMessage', {
          chat_id: referrerId,
          text: `🎉 *${firstName}* зарегистрировался по вашей ссылке!\nВы получили *+50 монет* в награду! 🪙`,
          parse_mode: 'Markdown',
        }).catch(() => {});
      }

      await sendWelcome(chatId, firstName, true);
    } else {
      player.lastActive = new Date();
      if (firstName) player.firstName = firstName;
      await player.save();
      await sendWelcome(chatId, firstName, false);
    }
    return;
  }

  // ── /balance ──────────────────────────────────────────────────────────────
  if (text === '/balance') {
    await sendBalance(chatId, telegramId);
    return;
  }

  // ── /leaderboard ─────────────────────────────────────────────────────────
  if (text === '/leaderboard') {
    await sendLeaderboard(chatId);
    return;
  }

  // ── /bonus ────────────────────────────────────────────────────────────────
  if (text === '/bonus') {
    const player = await Player.findOne({ telegramId });
    if (!player) {
      await tgApi('sendMessage', { chat_id: chatId, text: '❌ Сначала запусти игру: /start' });
      return;
    }
    const now = Date.now();
    const lastClaim = player.lastBonusClaim?.getTime() ?? 0;
    const INTERVAL = 24 * 3600 * 1000;
    if (now - lastClaim >= INTERVAL) {
      player.balance += 50;
      player.lastBonusClaim = new Date();
      await player.save();
      await tgApi('sendMessage', {
        chat_id: chatId,
        text: `🎁 *Бонус получен!*\n\n+50 монет зачислено на счёт 🪙\nТекущий баланс: *${player.balance} монет*\n\nСледующий бонус через 24 часа.`,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[{ text: '🎮 Играть сейчас', web_app: { url: CLIENT_URL } }]] },
      });
    } else {
      const nextMs = lastClaim + INTERVAL - now;
      const h = Math.floor(nextMs / 3600000);
      const m = Math.floor((nextMs % 3600000) / 60000);
      await tgApi('sendMessage', {
        chat_id: chatId,
        text: `⏰ Бонус уже получен!\n\nСледующий через *${h}ч ${m}м*\nБаланс: *${player.balance} монет* 🪙`,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[{ text: '🎮 Играть', web_app: { url: CLIENT_URL } }]] },
      });
    }
    return;
  }

  // ── /invite ───────────────────────────────────────────────────────────────
  if (text === '/invite') {
    const player = await Player.findOne({ telegramId });
    const refCount = player?.referralCount ?? 0;
    const botUsername = 'soliaireheartsbot'; // your bot's username
    const inviteLink = `https://t.me/${botUsername}?start=ref_${telegramId}`;
    await tgApi('sendMessage', {
      chat_id: chatId,
      text: [
        `🔗 *Ваша реферальная ссылка:*`,
        ``,
        inviteLink,
        ``,
        `💰 Вы получаете *+50 монет* за каждого друга, который присоединится по вашей ссылке!`,
        ``,
        `👥 Уже пригласили: *${refCount}* ${refCount === 1 ? 'человека' : refCount < 5 ? 'человека' : 'человек'}`,
      ].join('\n'),
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          { text: '📤 Поделиться ссылкой', url: `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent('Играй в Козырь — карточная игра! Получи 100 монет при регистрации 🃏')}` },
        ]],
      },
    });
    return;
  }

  // ── /help ─────────────────────────────────────────────────────────────────
  if (text === '/help') {
    await tgApi('sendMessage', {
      chat_id: chatId,
      text: [
        `📖 *Правила Козыря (Дурак)*`,
        ``,
        `🃏 Игра на 36 картах с 6 по туз`,
        `🎯 Цель: избавиться от всех карт раньше соперника`,
        ``,
        `*Подкидной (Classic):*`,
        `• Атакующий бросает карту`,
        `• Защищающийся отбивает старшей картой той же масти или козырем`,
        `• Если не смог — берёт все карты`,
        `• Бито — карты уходят в сброс, ходит следующий`,
        ``,
        `*Переводной (Transfer):*`,
        `• Всё то же самое, плюс:`,
        `• Защищающийся может перевести атаку картой того же ранга`,
        `• Тогда бывший атакующий должен защищаться!`,
        ``,
        `♠ Козыри бьют любые карты других мастей`,
        `👑 Сначала ходит тот, у кого меньший козырь`,
        ``,
        `💰 Победитель получает ставку, проигравший теряет`,
      ].join('\n'),
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: [[{ text: '🎮 Играть', web_app: { url: CLIENT_URL } }]] },
    });
    return;
  }

  // ── /stats (legacy) ───────────────────────────────────────────────────────
  if (text === '/stats') {
    await tgApi('sendMessage', {
      chat_id: chatId,
      text: '📊 Открой игру для просмотра статистики:',
      reply_markup: { inline_keyboard: [[{ text: '📈 Моя статистика', web_app: { url: `${CLIENT_URL}/stats` } }]] },
    });
    return;
  }
}

async function handleCallback(query: Record<string, unknown>) {
  const chatId = ((query.message as Record<string, unknown>)?.chat as Record<string, unknown>)?.id as number;
  const telegramId = ((query.from as Record<string, unknown>)?.id) as number;
  const data = query.data as string;

  if (data === 'leaderboard') {
    await sendLeaderboard(chatId);
  } else if (data === 'balance') {
    await sendBalance(chatId, telegramId);
  } else if (data === 'bonus_link') {
    await sendBonusCallback(chatId, telegramId);
  }

  await tgApi('answerCallbackQuery', { callback_query_id: query.id });
}

async function sendBalance(chatId: number, telegramId: number) {
  const player = await Player.findOne({ telegramId });
  if (!player) {
    await tgApi('sendMessage', { chat_id: chatId, text: '❌ Сначала запусти игру: /start' });
    return;
  }
  const winRate = player.gamesPlayed > 0
    ? Math.round((player.wins / player.gamesPlayed) * 100)
    : 0;
  await tgApi('sendMessage', {
    chat_id: chatId,
    text: [
      `💼 *Профиль игрока*`,
      ``,
      `👤 ${player.firstName}`,
      `💰 Баланс: *${player.balance} монет* 🪙`,
      ``,
      `🏆 Победы: ${player.wins}`,
      `💀 Поражения: ${player.losses}`,
      `🎮 Игр сыграно: ${player.gamesPlayed}`,
      `📊 Процент побед: *${winRate}%*`,
      player.consecutiveWins > 1 ? `🔥 Серия побед: ${player.consecutiveWins}` : '',
      player.consecutiveLosses > 1 ? `❄️ Серия поражений: ${player.consecutiveLosses}` : '',
    ].filter(Boolean).join('\n'),
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [[
        { text: '🎮 Играть', web_app: { url: CLIENT_URL } },
        { text: '🏆 Рейтинг', callback_data: 'leaderboard' },
      ]],
    },
  });
}

async function sendBonusCallback(chatId: number, telegramId: number) {
  const player = await Player.findOne({ telegramId });
  if (!player) {
    await tgApi('sendMessage', { chat_id: chatId, text: '❌ Сначала запусти игру: /start' });
    return;
  }
  const now = Date.now();
  const lastClaim = player.lastBonusClaim?.getTime() ?? 0;
  const INTERVAL = 24 * 3600 * 1000;
  if (now - lastClaim >= INTERVAL) {
    player.balance += 50;
    player.lastBonusClaim = new Date();
    await player.save();
    await tgApi('sendMessage', {
      chat_id: chatId,
      text: `🎁 *Бонус получен!*\n\n+50 монет зачислено на счёт 🪙\nТекущий баланс: *${player.balance} монет*\n\nСледующий бонус через 24 часа.`,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: [[{ text: '🎮 Играть сейчас', web_app: { url: CLIENT_URL } }]] },
    });
  } else {
    const nextMs = lastClaim + INTERVAL - now;
    const h = Math.floor(nextMs / 3600000);
    const m = Math.floor((nextMs % 3600000) / 60000);
    await tgApi('sendMessage', {
      chat_id: chatId,
      text: `⏰ Бонус уже получен!\n\nСледующий через *${h}ч ${m}м*\nБаланс: *${player.balance} монет* 🪙`,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: [[{ text: '🎮 Играть', web_app: { url: CLIENT_URL } }]] },
    });
  }
}

async function sendWelcome(chatId: number, name: string, isNew: boolean) {
  const text = isNew
    ? [
        `🃏 *Добро пожаловать в Козырь, ${name}!*`,
        ``,
        `🎮 Карточная игра в лучших традициях русского Дурака`,
        ``,
        `💰 Твой стартовый баланс: *100 монет*`,
        `🎁 Ежедневный бонус: *+50 монет* каждые 24 часа`,
        `🔗 Приглашай друзей: *+50 монет* за каждого`,
        ``,
        `Выбери режим игры:`,
        `• 🃏 *Подкидной* — классический Дурак`,
        `• 🔄 *Переводной* — можно перевести атаку!`,
      ].join('\n')
    : [
        `👋 *С возвращением, ${name}!*`,
        ``,
        `🎮 Козырь ждёт тебя — пора сыграть!`,
      ].join('\n');

  await tgApi('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🃏 Играть в Козырь', web_app: { url: CLIENT_URL } }],
        [
          { text: '💰 Баланс', callback_data: 'balance' },
          { text: '🏆 Рейтинг', callback_data: 'leaderboard' },
          { text: '🎁 Бонус', callback_data: 'bonus_link' },
        ],
      ],
    },
  });
}

async function sendLeaderboard(chatId: number) {
  const top = await Player.find({ gamesPlayed: { $gte: 1 } })
    .sort({ wins: -1 })
    .limit(10)
    .select('firstName username wins losses gamesPlayed balance');

  const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
  const lines = top.map((p, i) => {
    const wr = p.gamesPlayed > 0 ? Math.round((p.wins / p.gamesPlayed) * 100) : 0;
    const handle = p.username ? `@${p.username}` : p.firstName;
    return `${medals[i]} *${handle}* — ${p.wins}W · ${wr}% · ${p.balance}🪙`;
  });

  await tgApi('sendMessage', {
    chat_id: chatId,
    text: lines.length
      ? `🏆 *Топ игроков Козыря*\n\n${lines.join('\n')}`
      : '🏆 Рейтинг пуст. Сыграй первым!',
    parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: [[{ text: '🎮 Играть', web_app: { url: CLIENT_URL } }]] },
  });
}

// ── Re-engagement: send bonus reminder to players inactive 3+ days ─────────
export async function sendReEngagementMessages() {
  const cutoff3d = new Date(Date.now() - 3 * 24 * 3600 * 1000);
  const cutoff7d = new Date(Date.now() - 7 * 24 * 3600 * 1000);

  // Players inactive 3-7 days
  const sleeping = await Player.find({
    lastActive: { $lt: cutoff3d, $gte: cutoff7d },
    isBanned: { $ne: true },
  }).select('telegramId firstName balance');

  const messages = [
    (name: string, bal: number) =>
      `👋 *${name}*, давно не играл!\n\n💰 Твой баланс: *${bal} монет*\n🎁 Забери ежедневный бонус +50 монет!`,
    (name: string, _: number) =>
      `🃏 *${name}*, противник ждёт тебя!\n\nПришло время сыграть партию в Козырь!`,
    (name: string, bal: number) =>
      `🔥 *${name}*, не теряй форму!\n\nБаланс: *${bal}🪙* — рискни!`,
  ];

  for (const player of sleeping) {
    const msg = messages[Math.floor(Math.random() * messages.length)];
    await tgApi('sendMessage', {
      chat_id: player.telegramId,
      text: msg(player.firstName, player.balance),
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: [[{ text: '🎮 Играть сейчас', web_app: { url: CLIENT_URL } }]] },
    }).catch(() => {});
    await new Promise(r => setTimeout(r, 55)); // ~18 msg/sec rate limit
  }
  return sleeping.length;
}

// ── Broadcast to all active players ──────────────────────────────────────────
export async function broadcastToAll(message: string, activeDays = 30): Promise<number> {
  const cutoff = new Date(Date.now() - activeDays * 24 * 3600 * 1000);
  const players = await Player.find({ lastActive: { $gte: cutoff }, isBanned: { $ne: true } })
    .select('telegramId');

  for (const p of players) {
    await tgApi('sendMessage', {
      chat_id: p.telegramId,
      text: message,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: [[{ text: '🎮 Козырь', web_app: { url: CLIENT_URL } }]] },
    }).catch(() => {});
    await new Promise(r => setTimeout(r, 55));
  }
  return players.length;
}
