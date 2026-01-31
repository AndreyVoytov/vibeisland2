const DEFAULT_IMAGE_EXTENSIONS = ['svg', 'png'];

const stripExtension = (source) => source.replace(/\.(png|svg)$/i, '');

const resolveSources = (source) => {
  const base = stripExtension(source);
  return DEFAULT_IMAGE_EXTENSIONS.map((extension) => `${base}.${extension}`);
};

const createImageLoader = () => {
  const cache = new Map();

  const load = (source) => {
    if (cache.has(source)) {
      return cache.get(source);
    }

    const promise = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load ${source}`));
      img.src = source;
    });

    cache.set(source, promise);
    return promise;
  };

  const tryLoad = async (sources, index = 0) => {
    if (index >= sources.length) {
      throw new Error('No compatible image sources found.');
    }
    try {
      return await load(sources[index]);
    } catch (error) {
      return tryLoad(sources, index + 1);
    }
  };

  const loadWithFallback = (source) => tryLoad(resolveSources(source));

  return {
    loadWithFallback,
    clear: () => cache.clear(),
  };
};

export const createRenderer = ({ canvas, doc = document } = {}) => {
  const context = canvas?.getContext?.('2d') ?? null;
  const loader = createImageLoader();

  const drawImage = async (source, { x = 0, y = 0, width, height } = {}) => {
    if (!context) {
      throw new Error('Canvas context is not available.');
    }

    const image = await loader.loadWithFallback(source);
    const drawWidth = width ?? image.width;
    const drawHeight = height ?? image.height;
    context.drawImage(image, x, y, drawWidth, drawHeight);
  };

  const createImageElement = ({
    source,
    alt = '',
    className,
    width,
    height,
  } = {}) => {
    if (!doc) {
      throw new Error('Document is not available.');
    }

    const img = doc.createElement('img');
    img.alt = alt;
    img.src = resolveSources(source)[0];
    if (className) {
      img.className = className;
    }
    if (width) {
      img.width = width;
    }
    if (height) {
      img.height = height;
    }
    img.onerror = () => {
      img.onerror = null;
      img.src = resolveSources(source)[1];
    };

    return img;
  };

  return {
    context,
    drawImage,
    createImageElement,
    clearCache: loader.clear,
  };
};
