import { useState } from 'react';

export function useSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleOpen = () => setIsOpen((prev) => !prev);
  const toggleCollapse = () => setIsCollapsed((prev) => !prev);
  const close = () => setIsOpen(false);

  return {
    isOpen,
    isCollapsed,
    toggleOpen,
    toggleCollapse,
    close,
  };
}
