# 🃏 ADVANCED 3D DURAK — FULL GAME PLAN
## Версия / Version / Versiya: 2.0

---

# 🇺🇿 O'ZBEKCHA — TO'LIQ REJA

## 1. LOYIHA HAQIDA
**Nima qilmoqchimiz?**
Real kazino kabi 3D karta o'yini — "Durak" — Telegram Mini App va veb-sayt orqali. O'yinchilar pul tikadi, yutadi yoki yutqizadi. Admin hamma narsani boshqaradi.

## 2. O'YIN QANDAY KO'RINADI (3D Grafika)
- 🎯 **Yashil stol** — real hissani beruvchi 3D felt stol
- 🃏 **3D kartalar** — real karta kabi aylanadi, uchadi, tushadi
- ✨ **Animatsiyalar** — karta chiqarish, olish, yutish effektlari
- 💡 **Yorug'lik va soya** — real chiroq effekti
- 🎉 **Konfetti va portlash** — yutganda bayram effekti
- 👤 **Avatarlar** — har bir o'yinchi uchun 3D avatar
- 🎵 **Tovush** — karta surilishi, yutish/yutqizish tovuslari

## 3. O'YIN REJLARI
| Rejim | Tavsif |
|-------|--------|
| 🤖 Bot bilan | ИИ boti, qiyinlik darajasi boshqariladi |
| 👥 2 o'yinchi | Real vaqt multiplayer |
| 👥👥 3-4 o'yinchi | Ko'p o'yinchi (keyingi bosqich) |
| 🏆 Turnir | Pul tikib turnir |
| 🎭 Tez o'yin | Tez-tez round, 1-3 daqiqa |

## 4. PIVO TIZIMI (Tikish)
- 💰 Har o'yinchi **100 tanga** bilan boshlaydi
- 🎯 Tikish: 10 / 25 / 50 / 100 / 500 tanga (yozib ham kirish mumkin)
- 🏆 Yutish = tikish × 2 (ikkicha qaytadi)
- 😵 Yutqizish = tanga yo'qoladi
- 🎁 Har kuni 50 tanga bonus (login bonus)
- ♾️ Tanga tugasa = 10 tanga sovg'a (o'yin davom etsin)

## 5. ADDICTION ALGORITMI (Admin boshqaradi)
Admin paneldan har bir o'yinchi uchun:
- **AI qiyinligi** — 0% (bot doim yutqizadi) → 100% (bot yengilmas)
- **Ximoya seriyasi** — 3 marta ketma-ket yutqizsa, bot qiyinligi pasayadi
- **Uy foydasi** — ko'p yutgan o'yinchilarga bot kuchliroq bo'ladi
- **Balans ximoyasi** — tanga oz qolsa bot yengilroq o'ynaydi
- **Majburiy natija** — ma'lum o'yinda yutish/yutqizishni belgilash

## 6. TEXNOLOGIYALAR
### Frontend (O'yin interfeysi)
- **Three.js + React Three Fiber** — 3D sahna
- **GSAP** — silliq animatsiyalar
- **React** — UI va navigatsiya
- **Tailwind CSS** — stil
- **Socket.io-client** — real vaqt aloqa
- **Howler.js** — ovoz effektlari

### Backend (Server)
- **Node.js + TypeScript** — asosiy server
- **Socket.io** — real vaqt o'yin
- **Express** — REST API
- **MongoDB** — o'yinchi ma'lumotlari
- **Redis** — tezkor xona boshqaruvi
- **JWT** — autentifikatsiya

### Deploy (Joylashtirish)
- **Vercel** — frontend
- **Render yoki Railway** — backend
- **MongoDB Atlas** — ma'lumotlar bazasi
- **Cloudinary** — rasm va tekstura fayllari

## 7. ADMIN PANEL IMKONIYATLARI
### Dashboard
- Faol o'yinlar soni (real vaqt)
- Bugungi o'yinlar va daromad
- Jami o'yinchilar statistikasi
- Eng ko'p yutgan/yutqizgan o'yinchilar

### O'yinchi boshqaruvi
- Har bir o'yinchi uchun AI qiyinligi
- Balansni qo'lda o'zgartirish
- O'yinchini bloklash/blokdan chiqarish
- O'yin tarixi ko'rish
- Ma'lum o'yinda natijani belgilash

### O'yin sozlamalari
- Global AI qiyinligi
- Tikish limitlari (min/max)
- Login bonus miqdori
- Ximoya seriyasi soni

## 8. RIVOJLANISH BOSQICHLARI

### 📦 1-BOSQICH: Asosiy 3D (2-3 hafta)
- [ ] Three.js o'yin sahna
- [ ] 3D karta modeli va animatsiyalar
- [ ] Karta berish animatsiyasi
- [ ] Ataka/mudofaa vizualizatsiyasi
- [ ] Asosiy ovozlar

### 📦 2-BOSQICH: Multiplayer (1-2 hafta)
- [ ] Socket.io xona tizimi
- [ ] 2 o'yinchi real vaqt o'yini
- [ ] O'yinchi avatar va ism
- [ ] Chatbox

### 📦 3-BOSQICH: Monetizatsiya (1 hafta)
- [ ] Tanga tizimi
- [ ] Kunlik bonus
- [ ] Tikish ekrani

### 📦 4-BOSQICH: Admin va Algoritm (1 hafta)
- [ ] Admin panel
- [ ] AI qiyinlik boshqaruvi
- [ ] Statistika va tahlil

### 📦 5-BOSQICH: Premium (2 hafta)
- [ ] Karta skinlari
- [ ] Turnirlar
- [ ] Ko'p o'yinchi (3-4)
- [ ] Yutuqlar tizimi

---

---

# 🇷🇺 РУССКИЙ — ПОЛНЫЙ ПЛАН

## 1. О ПРОЕКТЕ
**Что мы делаем?**
Реалистичная 3D карточная игра «Дурак» в стиле настоящего онлайн казино — через Telegram Mini App и веб-браузер. Игроки ставят монеты, выигрывают или проигрывают. Всё контролируется через панель администратора.

## 2. КАК ВЫГЛЯДИТ ИГРА (3D Графика)
- 🎯 **Зелёное сукно** — реалистичный 3D стол как в казино
- 🃏 **3D карты** — настоящие карты, которые переворачиваются, летят и падают
- ✨ **Анимации** — раздача карт, взятие, победа/поражение
- 💡 **Свет и тени** — реальное освещение сцены
- 🎉 **Конфетти и вспышки** — при победе праздничный эффект
- 👤 **Аватары** — у каждого игрока свой персонаж
- 🎵 **Звуки** — шуршание карт, звуки победы и поражения

## 3. РЕЖИМЫ ИГРЫ
| Режим | Описание |
|-------|----------|
| 🤖 Против бота | ИИ с настраиваемой сложностью |
| 👥 2 игрока | Мультиплеер в реальном времени |
| 👥👥 3-4 игрока | Групповая игра (следующий этап) |
| 🏆 Турнир | Турнир со ставками |
| ⚡ Быстрая игра | Укороченные раунды, 1-3 минуты |

## 4. СИСТЕМА СТАВОК
- 💰 Каждый игрок начинает со **100 монет**
- 🎯 Ставки: 10 / 25 / 50 / 100 / 500 монет (можно вводить вручную)
- 🏆 Победа = ставка × 2 (возврат удвоенной суммы)
- 😵 Поражение = потеря ставки
- 🎁 Ежедневный бонус: 50 монет
- ♾️ Если монеты закончились = 10 монет в подарок (чтобы продолжал играть)

## 5. АЛГОРИТМ ВОВЛЕЧЁННОСТИ (управление из админки)
Для каждого игрока отдельно:
- **Сложность ИИ** — 0% (бот всегда проигрывает) → 100% (бот непобедим)
- **Защита от серии** — после 3 поражений подряд бот играет слабее
- **Преимущество казино** — если игрок выигрывает слишком часто, бот усиливается
- **Защита баланса** — если монет мало, бот играет легче
- **Принудительный результат** — задать конкретный результат игры вручную

## 6. ТЕХНОЛОГИИ
### Frontend (Игровой интерфейс)
- **Three.js + React Three Fiber** — 3D сцена и рендеринг
- **GSAP** — плавные анимации карт
- **React + React Router** — страницы и навигация
- **Tailwind CSS** — стили и UI
- **Socket.io-client** — связь с сервером в реальном времени
- **Howler.js** — звуковые эффекты и фоновая музыка

### Backend (Сервер)
- **Node.js + TypeScript** — основной сервер
- **Socket.io** — игра в реальном времени
- **Express** — REST API
- **MongoDB** — данные игроков и истории
- **Redis** — быстрое управление комнатами
- **JWT** — аутентификация

### Деплой
- **Vercel** — фронтенд
- **Render / Railway** — бэкенд (с поддержкой WebSocket)
- **MongoDB Atlas** — облачная база данных
- **Cloudinary** — хранение текстур и изображений

## 7. ВОЗМОЖНОСТИ ADMIN ПАНЕЛИ
### Дашборд (Главная)
- Количество активных игр (реальное время)
- Игры и доход за сегодня / за всё время
- Топ игроков по выигрышам и проигрышам
- Общая статистика

### Управление игроками
- Настройка сложности ИИ для каждого игрока
- Ручное изменение баланса
- Блокировка / разблокировка игрока
- Просмотр полной истории игр
- Назначение результата конкретной игры

### Настройки игры
- Глобальная сложность ИИ
- Лимиты ставок (мин / макс)
- Размер ежедневного бонуса
- Количество поражений до «защиты»

## 8. ЭТАПЫ РАЗРАБОТКИ

### 📦 ЭТАП 1: Базовая 3D игра (2-3 недели)
- [ ] Three.js — настройка 3D сцены и камеры
- [ ] 3D модель карты с текстурами
- [ ] Анимация раздачи карт
- [ ] Визуализация атаки и защиты
- [ ] Базовые звуковые эффекты

### 📦 ЭТАП 2: Мультиплеер (1-2 недели)
- [ ] Socket.io — комнаты и матчмейкинг
- [ ] Игра 2 игроков в реальном времени
- [ ] Аватары и имена игроков
- [ ] Чат в игре

### 📦 ЭТАП 3: Монетизация (1 неделя)
- [ ] Система монет и ставок
- [ ] Экран ежедневного бонуса
- [ ] История транзакций

### 📦 ЭТАП 4: Админ и алгоритм (1 неделя)
- [ ] Полная Admin панель
- [ ] Управление сложностью ИИ
- [ ] Статистика и аналитика

### 📦 ЭТАП 5: Премиум функции (2 недели)
- [ ] Скины карт и столов
- [ ] Турниры со ставками
- [ ] Игра 3-4 игрока
- [ ] Система достижений и наград

---

---

# 🇬🇧 ENGLISH — FULL PLAN

## 1. PROJECT OVERVIEW
**What are we building?**
A realistic 3D "Durak" card game styled like a real online casino — playable inside Telegram Mini App and web browsers. Players bet coins, win or lose. Everything is controllable from an admin panel with a powerful engagement/addiction algorithm.

## 2. HOW THE GAME LOOKS (3D Graphics)
- 🎯 **Green felt table** — realistic 3D casino-style table surface
- 🃏 **3D cards** — real cards that flip, fly through the air, land on table
- ✨ **Animations** — card dealing (flying from deck), playing, taking cards
- 💡 **Lighting & shadows** — real-time lighting for depth and realism
- 🎉 **Win effects** — confetti explosion, glow, screen shake on victory
- 👤 **Avatars** — each player has a 3D character/avatar around the table
- 🎵 **Sounds** — card shuffling, dealing, attacks, victory/defeat music

## 3. GAME MODES
| Mode | Description |
|------|-------------|
| 🤖 vs Bot | AI opponent, difficulty controlled per-player |
| 👥 2 Players | Real-time PvP multiplayer |
| 👥👥 3-4 Players | Group game (Phase 2) |
| 🏆 Tournament | Bracket tournament with entry fee |
| ⚡ Quick Game | Fast rounds, 1-3 minutes max |

## 4. BETTING SYSTEM
- 💰 Every player starts with **100 coins**
- 🎯 Bets: 10 / 25 / 50 / 100 / 500 coins (or type any amount)
- 🏆 Win = bet × 2 returned (net +bet)
- 😵 Lose = bet deducted
- 🎁 Daily login bonus: +50 coins
- ♾️ Zero balance safety net: get 10 free coins to keep playing

## 5. ADDICTION/ENGAGEMENT ALGORITHM (Admin controlled)
Per-player settings:
- **AI Difficulty** — 0% (bot always loses) → 100% (bot unbeatable)
- **Loss Streak Protection** — after N losses in a row, bot gets easier
- **House Edge** — if player wins too often, bot gets harder automatically
- **Low Balance Mode** — when coins are low, bot softens (keeps player engaged)
- **Forced Outcome** — manually force win or loss for specific game

## 6. TECHNOLOGY STACK

### Frontend (Game Interface)
| Technology | Purpose |
|-----------|---------|
| **Three.js + React Three Fiber** | 3D scene rendering (cards, table, lighting) |
| **GSAP (GreenSock)** | Smooth card flip, deal, and move animations |
| **React + React Router** | Pages, navigation, UI |
| **Tailwind CSS** | Styling, layout |
| **Socket.io-client** | Real-time game events |
| **Howler.js** | Sound effects & background music |
| **@use-gesture/react** | Touch & drag for mobile card interactions |

### Backend (Server)
| Technology | Purpose |
|-----------|---------|
| **Node.js + TypeScript** | Core server |
| **Socket.io** | Real-time multiplayer game engine |
| **Express** | REST API for stats, auth, admin |
| **MongoDB + Mongoose** | Player data, game records |
| **Redis** | Fast in-memory room & session management |
| **JWT** | Secure authentication |

### Infrastructure
| Service | Purpose |
|---------|---------|
| **Vercel** | Frontend hosting |
| **Render / Railway** | Backend (needs WebSocket support) |
| **MongoDB Atlas** | Cloud database |
| **Cloudinary** | Card textures, avatar images |
| **Telegram Bot API** | Mini App integration |

## 7. 3D SCENE BREAKDOWN

### The Table
```
Camera (top-down, slight angle)
        │
   ┌────┴────────────────────────┐
   │  OPPONENT HAND (face-down)  │
   │                             │
   │    [TRUMP] [DECK PILE]      │
   │                             │
   │     == TABLE AREA ==        │
   │   [ATK]  [ATK]  [ATK]      │
   │   [DEF]  [DEF]             │
   │                             │
   │   MY HAND (face-up, fan)   │
   └─────────────────────────────┘
```

### 3D Card Properties
- **Geometry**: PlaneGeometry with rounded corners shader
- **Textures**: Front face (suit/rank), back face (card back pattern)
- **Animations**:
  - Deal: arc trajectory from deck to hand (0.5s, ease-out)
  - Play: slide up to table (0.3s, elastic)
  - Flip: rotateY 180° to reveal face (0.4s)
  - Take: cards fly to player hand (0.6s)
  - Win: cards explode upward (1s, gravity)

### Lighting Setup
- Ambient light: soft warm (0x4a3000, intensity 0.4)
- Point light above table (white, casts shadows)
- Rim light behind opponent (blue tint, atmospheric)

## 8. FILE STRUCTURE (v2.0)
```
durak-3d/
├── client/
│   ├── src/
│   │   ├── 3d/
│   │   │   ├── Scene.tsx          ← Main Three.js canvas
│   │   │   ├── Table.tsx          ← 3D felt table mesh
│   │   │   ├── Card3D.tsx         ← Individual 3D card
│   │   │   ├── CardHand.tsx       ← Fanned hand of cards
│   │   │   ├── DeckPile.tsx       ← Deck stack visual
│   │   │   ├── TableArea.tsx      ← Attack/defense play area
│   │   │   ├── Avatar.tsx         ← Player avatar
│   │   │   ├── Particles.tsx      ← Win/lose effects
│   │   │   └── Lighting.tsx       ← Scene lighting rig
│   │   ├── game/
│   │   │   ├── useGameSocket.ts   ← Socket.io game hook
│   │   │   └── useSound.ts        ← Sound effects hook
│   │   ├── pages/
│   │   │   ├── Home.tsx           ← Lobby & bet selection
│   │   │   ├── Game3D.tsx         ← Main 3D game page
│   │   │   ├── Stats.tsx          ← Player stats
│   │   │   └── Admin.tsx          ← Admin panel
│   │   └── components/
│   │       ├── BetSelector.tsx
│   │       ├── GameResult.tsx
│   │       └── DailyBonus.tsx
├── server/
│   ├── src/
│   │   ├── game/
│   │   │   ├── DurakGame.ts       ← Game engine (fixed)
│   │   │   ├── AIPlayer.ts        ← AI with difficulty
│   │   │   └── CardDeck.ts        ← Card utilities
│   │   ├── socket/
│   │   │   └── handler.ts         ← Socket.io events
│   │   ├── models/
│   │   │   ├── Player.ts
│   │   │   └── GameRecord.ts
│   │   └── routes/
│   │       ├── api.ts
│   │       └── admin.ts
└── assets/
    ├── cards/                     ← Card face textures (SVG→PNG)
    ├── sounds/                    ← card_deal.mp3, win.mp3, etc.
    └── textures/                  ← Table felt, card back pattern
```

## 9. ADMIN PANEL FEATURES (Full)
### Dashboard
- Live active game count (WebSocket updates)
- Revenue today / this week / all time
- Player count: new today, total, active now
- Top winners & losers leaderboard
- Game duration average

### Player Management
- Search by name / Telegram ID
- Per-player: AI difficulty override (slider)
- Per-player: force next game outcome (win/lose)
- Manual balance adjustment
- Ban / unban with reason
- Full game history with replay data

### Game Settings
- Global AI difficulty (all new games)
- Min / max bet amounts
- Daily bonus amount
- Loss streak protection threshold
- House edge target (% of games bot wins)

### Analytics
- Win rate by AI difficulty level
- Average session length
- Coin flow (in vs out)
- Most active hours (heatmap)

## 10. DEVELOPMENT PHASES & TIMELINE

```
PHASE 1 — 3D Foundation (Weeks 1-2)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Set up Three.js scene + React Three Fiber
• Build 3D table mesh with felt texture
• Create Card3D component (front/back textures)
• Card deal animation (arc trajectory)
• Card play animation (slide to table)
• Basic lighting rig

PHASE 2 — Game Logic Integration (Week 3)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Fix existing game bugs (endGame, AI 0-cards)
• Connect 3D scene to Socket.io game state
• Click card → play in 3D (one-click)
• Show opponent cards (face-down fan)
• Trump indicator in 3D
• Win/lose explosion effect

PHASE 3 — Sound + Polish (Week 4)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Howler.js sound effects
• Background casino music (loop)
• Card shuffle sound
• Win/lose audio cues
• Haptic feedback (Telegram)

PHASE 4 — Multiplayer PvP (Week 5)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• 2-player matchmaking by bet size
• Opponent avatar visible
• Turn timer (30s per turn)
• Disconnect handling (forfeit)

PHASE 5 — Monetization + Admin (Week 6)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Daily bonus popup (animated)
• Full admin panel
• Engagement algorithm tuning
• Analytics dashboard

PHASE 6 — Premium (Weeks 7-8)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Card skin system (unlock with coins)
• Custom table colors
• Achievement badges
• Tournament mode
• 3-4 player support
```

## 11. QUICK BUG FIXES NEEDED NOW (Before 3D Build)
1. **MongoDB conflict** — `$inc` and `$set` on same field crashes `endGame` silently
2. **AI 0-cards** — when AI has no cards as attacker, game freezes
3. **Game-over detection** — need `forceEnd` when attacker hand is empty + deck empty

---

## 12. STACK COMPARISON: Current vs 3D v2.0

| Feature | Current v1 | 3D v2.0 |
|---------|-----------|---------|
| Graphics | 2D HTML/CSS | Three.js 3D |
| Cards | CSS divs | 3D meshes with textures |
| Animations | CSS transitions | GSAP + Three.js |
| Sound | None | Howler.js full audio |
| Multiplayer | ✅ Socket.io | ✅ Enhanced Socket.io |
| Admin | ✅ Basic | ✅ Advanced analytics |
| Bot AI | ✅ Difficulty | ✅ Enhanced algorithm |
| Mobile | ✅ OK | ✅ Optimized WebGL |
| Daily bonus | ❌ | ✅ |
| Card skins | ❌ | ✅ |
| Tournaments | ❌ | ✅ |

---

*Plan created: April 2026*
*Next step: Fix current v1 bugs → then build 3D v2.0 Phase 1*
