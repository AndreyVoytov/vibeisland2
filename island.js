const CELL_PREFIX = 'island:cell:';
const SIZE_KEY = 'island:size';
const LEVEL_KEY = 'island:level';

const buildCellKey = (x, y) => `${CELL_PREFIX}${x},${y}`;

const getScaleForLevel = (level) => Math.pow(0.97, level);

const getRangeForSize = (size) => {
  const offset = Math.floor(size / 2);
  const min = -offset;
  const max = size - offset - 1;
  return { min, max };
};

const createCoordList = (size) => {
  const { min, max } = getRangeForSize(size);
  const coords = [];
  for (let y = min; y <= max; y += 1) {
    for (let x = min; x <= max; x += 1) {
      coords.push({ x, y });
    }
  }
  return coords;
};

const getCenterOffset = (size) => (size % 2 === 0 ? 0.5 : 0);

const createTileElement = ({ x, y, type, createImage }) => {
  const tile = document.createElement('div');
  tile.className = 'island-tile';
  tile.dataset.x = String(x);
  tile.dataset.y = String(y);
  tile.dataset.type = type;

  const img = createImage(type);
  img.classList.add('island-tile__image');
  img.loading = 'eager';
  tile.append(img);
  return tile;
};

export const createIsland = ({
  container,
  storage,
  baseSize = 20,
  baseTileSize = 28,
  defaultTileType = 'tile1',
  createImage,
}) => {
  let level = storage.getJSON(LEVEL_KEY, 0);
  let size = storage.getJSON(SIZE_KEY, baseSize);

  const tiles = new Map();

  const getInitialResponsiveScale = () => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const isPhone = Math.max(viewportWidth, viewportHeight) <= 900;
    if (!isPhone) {
      return 1;
    }
    const targetCells = 25;
    const targetPixels = baseTileSize * targetCells;
    const isPortrait = viewportHeight >= viewportWidth;
    const availablePixels = isPortrait ? viewportWidth : viewportHeight;
    return availablePixels / targetPixels;
  };

  const responsiveScale = getInitialResponsiveScale();

  const getTileSize = () =>
    baseTileSize * getScaleForLevel(level) * responsiveScale;

  const setTilePosition = (tile, x, y, sizeValue = size) => {
    const tileSize = getTileSize();
    const offset = getCenterOffset(sizeValue);
    tile.style.left = `${(x + offset) * tileSize}px`;
    tile.style.top = `${(y + offset) * tileSize}px`;
    tile.style.zIndex = String(y);
  };

  const syncContainerSize = () => {
    container.style.setProperty('--tile-size', `${getTileSize()}px`);
  };

  const ensureCellType = (x, y, fallbackType) => {
    const stored = storage.getJSON(buildCellKey(x, y), null);
    if (stored?.type) {
      return stored.type;
    }
    const nextType = fallbackType ?? defaultTileType;
    storage.setJSON(buildCellKey(x, y), { type: nextType });
    return nextType;
  };

  const addTile = ({ x, y, type }) => {
    const tile = createTileElement({ x, y, type, createImage });
    setTilePosition(tile, x, y);
    container.append(tile);
    tiles.set(`${x},${y}`, tile);
    return tile;
  };

  const layoutTiles = () => {
    tiles.forEach((tile) => {
      const x = Number(tile.dataset.x);
      const y = Number(tile.dataset.y);
      setTilePosition(tile, x, y);
    });
  };

  const hydrate = () => {
    syncContainerSize();
    container.innerHTML = '';
    tiles.clear();
    createCoordList(size).forEach(({ x, y }) => {
      const type = ensureCellType(x, y, defaultTileType);
      addTile({ x, y, type });
    });
  };

  const expand = async ({ sizeIncrease, tileType }) => {
    const nextSize = size + sizeIncrease;
    const nextLevel = level + 1;
    const { min: newMin, max: newMax } = getRangeForSize(nextSize);
    const newTiles = [];

    for (let y = newMin; y <= newMax; y += 1) {
      for (let x = newMin; x <= newMax; x += 1) {
        if (!tiles.has(`${x},${y}`)) {
          const type = ensureCellType(x, y, tileType);
          const tile = createTileElement({ x, y, type, createImage });
          tile.classList.add('island-tile--growing');
          tiles.set(`${x},${y}`, tile);
          newTiles.push({ tile, x, y });
        }
      }
    }

    newTiles.forEach(({ tile, x, y }) => {
      setTilePosition(tile, x, y, size);
      container.append(tile);
    });

    size = nextSize;
    level = nextLevel;
    storage.setJSON(SIZE_KEY, size);
    storage.setJSON(LEVEL_KEY, level);
    syncContainerSize();
    layoutTiles();

    const totalDuration = 3000;
    const orderedNewTiles = [...newTiles].sort((a, b) => {
      if (a.y === b.y) {
        return a.x - b.x;
      }
      return a.y - b.y;
    });
    const step = orderedNewTiles.length
      ? totalDuration / orderedNewTiles.length
      : 0;

    await new Promise((resolve) => {
      orderedNewTiles.forEach(({ tile }, index) => {
        const delay = Math.round(step * index);
        setTimeout(() => tile.classList.remove('island-tile--growing'), delay);
      });
      setTimeout(resolve, totalDuration);
    });
  };

  hydrate();

  return {
    expand,
    getLevel: () => level,
    getSize: () => size,
    refreshLayout: () => {
      syncContainerSize();
      layoutTiles();
    },
  };
};
