"use client";

import type { KeyboardEvent as ReactKeyboardEvent, ReactNode, RefObject } from "react";
import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTORS = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type=\"hidden\"])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "object",
  "embed",
  "[contenteditable]",
  "[tabindex]:not([tabindex='-1'])"
].join(",");

function getFocusableElements(container: HTMLElement | null) {
  if (!container) return [];
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)).filter(
    (element) => !element.hasAttribute("disabled") && element.tabIndex >= 0
  );
}

interface ModalDialogProps {
  isOpen: boolean;
  onClose?: () => void;
  closeOnEscape?: boolean;
  labelledBy?: string;
  describedBy?: string;
  overlayClassName?: string;
  className?: string;
  initialFocusRef?: RefObject<HTMLElement>;
  children: ReactNode;
}

export function ModalDialog({
  isOpen,
  onClose,
  closeOnEscape = true,
  labelledBy,
  describedBy,
  overlayClassName = "",
  className = "",
  initialFocusRef,
  children
}: ModalDialogProps) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    previousActiveElementRef.current = document.activeElement as HTMLElement | null;

    const focusTarget = initialFocusRef?.current ?? getFocusableElements(contentRef.current)[0];
    requestAnimationFrame(() => {
      (focusTarget ?? contentRef.current)?.focus();
    });

    return () => {
      previousActiveElementRef.current?.focus();
    };
  }, [initialFocusRef, isOpen]);

  if (!isOpen) return null;

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape" && closeOnEscape && onClose) {
      event.stopPropagation();
      onClose();
      return;
    }

    if (event.key !== "Tab") return;

    const focusableElements = getFocusableElements(contentRef.current);
    if (focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement as HTMLElement | null;

    if (event.shiftKey && (activeElement === firstElement || !contentRef.current?.contains(activeElement))) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  return (
    <div className={overlayClassName}>
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
        className={className}
        onKeyDown={handleKeyDown}
      >
        {children}
      </div>
    </div>
  );
}
