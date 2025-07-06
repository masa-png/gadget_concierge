"use client";

import * as React from "react";

const DropdownMenuContext = React.createContext<{
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}>({
  isOpen: false,
  setIsOpen: () => {},
});

// DropdownMenuコンテキストを使用するためのフック
export function useDropdownMenu() {
  return React.useContext(DropdownMenuContext);
}

export { DropdownMenuContext };
