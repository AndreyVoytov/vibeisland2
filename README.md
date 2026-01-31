# Vibeisland 2

Портретная HTML + JS игра без сборки и фреймворков. Состояние игрока хранится в `localStorage`.

## Основные правила проекта

- **Без сборки**: проект запускается напрямую в браузере через `index.html` и обычные `<script>`.
- **Без фреймворков**: используется только чистый JavaScript и Web API.
- **Портретная ориентация**: вся логика и верстка рассчитаны на portrait-режим.
- **Хранилище**: доступ к `localStorage` идёт только через `storage.js`.
- **Отрисовка**: работа с канвасом и HTML-изображениями идёт только через `render.js`.
- **Графика**: каждый ассет имеет SVG-версию. PNG будет добавлен позже с тем же базовым URL.
- **Чистый код**: избегаем дублирования и временных решений.

## Структура

- `storage.js` — обертки над локальным хранилищем.
- `render.js` — обертки для отрисовки в canvas и HTML, включая fallback PNG → SVG.
- `assets/` — все текущие SVG-ассеты (PNG будут добавлены позже).

## Ассеты

Список текущих игровых и UI-элементов (SVG):

- `assets/player.svg`
- `assets/enemy.svg`
- `assets/npc.svg`
- `assets/coin.svg`
- `assets/heart.svg`
- `assets/tile-grass.svg`
- `assets/button-primary.svg`
- `assets/panel.svg`
- `assets/icon-play.svg`
- `assets/icon-settings.svg`

PNG-версии будут добавляться позднее с тем же именем файла (например, `player.png`).

## Использование storage.js

```js
import { storage } from './storage.js';

storage.setJSON('player', { hp: 3, coins: 12 });
const playerState = storage.getJSON('player', { hp: 3, coins: 0 });
```

## Использование render.js

```js
import { createRenderer } from './render.js';

const canvas = document.querySelector('canvas');
const renderer = createRenderer({ canvas });

await renderer.drawImage('./assets/player', { x: 10, y: 20, width: 64, height: 64 });
const icon = renderer.createImageElement({ source: './assets/icon-play', alt: 'Play' });
```

`render.js` сначала пытается загрузить PNG, а если его нет — использует SVG.
