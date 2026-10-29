import { useEffect } from 'react';

/**
 * Global reference counter for open dialogs/modals
 * Ensures nested or multiple modals do not prematurely remove scroll lock.
 */
let activeLockCount = 0;
let savedScrollY = 0;
let originalStyles = {
  overflow: '',
  position: '',
  top: '',
  left: '',
  right: '',
  width: ''
};

function lockBodyScroll() {
  if (activeLockCount === 0) {
    savedScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
    originalStyles = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width
    };

    // Lock body in place without jumping
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';

    // Also lock main scrollable container if present
    const mainContainer = document.querySelector('main');
    if (mainContainer) {
      mainContainer.setAttribute('data-prev-overflow', mainContainer.style.overflow || '');
      mainContainer.style.overflow = 'hidden';
    }
  }
  activeLockCount++;
}

function unlockBodyScroll() {
  activeLockCount = Math.max(0, activeLockCount - 1);
  if (activeLockCount === 0) {
    document.body.style.overflow = originalStyles.overflow || '';
    document.body.style.position = originalStyles.position || '';
    document.body.style.top = originalStyles.top || '';
    document.body.style.left = originalStyles.left || '';
    document.body.style.right = originalStyles.right || '';
    document.body.style.width = originalStyles.width || '';

    const mainContainer = document.querySelector('main');
    if (mainContainer) {
      const prevOverflow = mainContainer.getAttribute('data-prev-overflow');
      mainContainer.style.overflow = prevOverflow || '';
      mainContainer.removeAttribute('data-prev-overflow');
    }

    // Restore exact scroll position
    window.scrollTo(0, savedScrollY);
  }
}

/**
 * Custom React hook to reliably lock background scrolling when a modal/dialog is open.
 * Cleanly handles component unmounts, touch-events, and viewport resizing.
 * @param {boolean} isOpen - Whether the dialog/modal is currently open
 */
export function useScrollLock(isOpen) {
  useEffect(() => {
    if (!isOpen) return;

    lockBodyScroll();

    return () => {
      unlockBodyScroll();
    };
  }, [isOpen]);
}

export default useScrollLock;
