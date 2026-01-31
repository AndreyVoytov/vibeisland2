import { storage } from './storage.js';
import { createRenderer } from './render.js';
import { createIsland } from './island.js';

const MONEY_KEY = 'player:money';
const BASE_MONEY = 100000;
const UPGRADE_CONFIG_URL = './upgrades.json';

const tileSources = {
  tile1: './assets/tile1',
  tile2: './assets/tile2',
};

const formatMoney = (value) => value.toLocaleString('ru-RU');

const loadUpgrades = async () => {
  const response = await fetch(UPGRADE_CONFIG_URL);
  if (!response.ok) {
    throw new Error('Не удалось загрузить конфигурацию апгрейдов.');
  }
  return response.json();
};

const init = async () => {
  const islandContainer = document.querySelector('#island');
  const moneyEl = document.querySelector('#money');
  const upgradeTrigger = document.querySelector('#upgrade-trigger');
  const upgradePanel = document.querySelector('#upgrade-panel');
  const upgradeList = document.querySelector('#upgrade-list');
  const upgradeClose = document.querySelector('#upgrade-close');

  const renderer = createRenderer({ doc: document });
  const createImage = (type) =>
    renderer.createImageElement({ source: tileSources[type], alt: type });

  const upgrades = await loadUpgrades();
  let money = storage.getJSON(MONEY_KEY, BASE_MONEY);

  const island = createIsland({
    container: islandContainer,
    storage,
    createImage,
    defaultTileType: upgrades?.[0]?.tileType ?? 'tile1',
  });

  const updateMoney = (value) => {
    money = value;
    storage.setJSON(MONEY_KEY, money);
    moneyEl.textContent = `${formatMoney(money)} мон.`;
  };

  const openPanel = () => {
    upgradePanel.classList.add('is-visible');
  };

  const closePanel = () => {
    upgradePanel.classList.remove('is-visible');
  };

  const renderUpgrades = () => {
    upgradeList.innerHTML = '';
    upgrades.forEach((upgrade) => {
      const button = document.createElement('button');
      button.className = 'upgrade-panel__button';
      button.type = 'button';
      button.disabled = upgrade.level !== island.getLevel() + 1;

      const label = document.createElement('span');
      label.textContent = upgrade.label;

      const price = document.createElement('span');
      price.textContent = `${formatMoney(upgrade.cost)} мон.`;

      const icon = document.createElement('span');
      icon.className = 'upgrade-panel__icon';
      icon.textContent = '+';

      const left = document.createElement('span');
      left.style.display = 'flex';
      left.style.alignItems = 'center';
      left.style.gap = '10px';
      left.append(icon, label);

      button.append(left, price);

      button.addEventListener('click', async () => {
        if (money < upgrade.cost || upgrade.level !== island.getLevel() + 1) {
          return;
        }
        updateMoney(money - upgrade.cost);
        closePanel();
        upgradeTrigger.disabled = true;
        await island.expand({
          sizeIncrease: upgrade.sizeIncrease,
          tileType: upgrade.tileType,
        });
        upgradeTrigger.disabled = false;
        renderUpgrades();
      });

      upgradeList.append(button);
    });
  };

  upgradeTrigger.addEventListener('click', () => {
    if (upgradePanel.classList.contains('is-visible')) {
      closePanel();
      return;
    }
    renderUpgrades();
    openPanel();
  });

  upgradePanel.addEventListener('click', (event) => {
    if (event.target === upgradePanel) {
      closePanel();
    }
  });

  upgradeClose.addEventListener('click', () => {
    closePanel();
  });

  updateMoney(money);
  renderUpgrades();
  window.addEventListener('resize', island.refreshLayout);
};

init();
