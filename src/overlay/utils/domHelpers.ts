// DOM manipulation utilities

/**
 * Safely get an element by ID with type assertion
 */
export function getElementById<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

/**
 * Get element by ID, throwing if not found
 */
export function requireElementById<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id) as T | null;
  if (!element) {
    throw new Error(`Required element not found: #${id}`);
  }
  return element;
}

/**
 * Set CSS custom property on an element
 */
export function setCssProperty(element: HTMLElement, property: string, value: string): void {
  element.style.setProperty(property, value);
}

/**
 * Set multiple CSS custom properties on an element
 */
export function setCssProperties(element: HTMLElement, properties: Record<string, string>): void {
  for (const [property, value] of Object.entries(properties)) {
    element.style.setProperty(property, value);
  }
}

/**
 * Add multiple classes to an element
 */
export function addClasses(element: HTMLElement, ...classes: string[]): void {
  element.classList.add(...classes);
}

/**
 * Remove multiple classes from an element
 */
export function removeClasses(element: HTMLElement, ...classes: string[]): void {
  element.classList.remove(...classes);
}

/**
 * Replace element classes (remove old, add new)
 */
export function replaceClasses(element: HTMLElement, toRemove: string[], toAdd: string[]): void {
  element.classList.remove(...toRemove);
  element.classList.add(...toAdd);
}

/**
 * Wait for an image to load or decode
 */
export function waitForImageLoad(img: HTMLImageElement): Promise<void> {
  return new Promise((resolve, reject) => {
    if (img.complete && img.naturalWidth > 0) {
      resolve();
      return;
    }

    if (typeof img.decode === 'function') {
      img
        .decode()
        .then(resolve)
        .catch(() => {
          // Fall back to load event
          const onLoad = () => {
            img.removeEventListener('load', onLoad);
            img.removeEventListener('error', onError);
            resolve();
          };
          const onError = () => {
            img.removeEventListener('load', onLoad);
            img.removeEventListener('error', onError);
            reject(new Error(`Failed to load image: ${img.src}`));
          };
          img.addEventListener('load', onLoad);
          img.addEventListener('error', onError);
        });
      return;
    }

    const onLoad = () => {
      img.removeEventListener('load', onLoad);
      img.removeEventListener('error', onError);
      resolve();
    };
    const onError = () => {
      img.removeEventListener('load', onLoad);
      img.removeEventListener('error', onError);
      reject(new Error(`Failed to load image: ${img.src}`));
    };
    img.addEventListener('load', onLoad);
    img.addEventListener('error', onError);
  });
}
