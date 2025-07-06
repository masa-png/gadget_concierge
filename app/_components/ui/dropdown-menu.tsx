"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { DropdownMenuContext } from "@/hooks/use-dropdown-menu";

interface DropdownMenuProps {
  children: React.ReactNode;
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

interface DropdownMenuContentProps {
  children: React.ReactNode;
  className?: string;
  align?: "start" | "center" | "end";
  forceMount?: boolean;
}

interface DropdownMenuItemProps {
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
  onClick?: () => void;
}

interface DropdownMenuSeparatorProps {
  className?: string;
}

export function DropdownMenu({ children }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Escapeキーでドロップダウンを閉じる
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  return (
    <DropdownMenuContext.Provider value={{ isOpen, setIsOpen }}>
      <div className="relative">{children}</div>
    </DropdownMenuContext.Provider>
  );
}

export function DropdownMenuTrigger({
  children,
  asChild,
}: DropdownMenuTriggerProps) {
  const { isOpen, setIsOpen } = React.useContext(DropdownMenuContext);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  if (asChild) {
    return React.cloneElement(children as React.ReactElement, {
      onClick: handleClick,
    });
  }

  return (
    <button
      onClick={handleClick}
      className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      {children}
    </button>
  );
}

export function DropdownMenuContent({
  children,
  className,
  align = "start",
  forceMount,
}: DropdownMenuContentProps) {
  const { isOpen, setIsOpen } = React.useContext(DropdownMenuContext);

  if (!isOpen && !forceMount) return null;

  const alignClasses = {
    start: "left-0",
    center: "left-1/2 transform -translate-x-1/2",
    end: "right-0",
  };

  return (
    <>
      {/* オーバーレイ */}
      <div
        className="fixed inset-0 z-40"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(false);
        }}
      />

      {/* ドロップダウンコンテンツ */}
      <div
        className={cn(
          "absolute top-full mt-1 z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white p-1 shadow-lg transition-all duration-200 ease-in-out",
          alignClasses[align],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </>
  );
}

export function DropdownMenuItem({
  children,
  className,
  asChild,
  onClick,
}: DropdownMenuItemProps) {
  const { setIsOpen } = React.useContext(DropdownMenuContext);

  const handleClick = (e: React.MouseEvent) => {
    // 親のイベントをstop
    e.stopPropagation();

    // カスタムonClickがある場合は実行
    if (onClick) {
      onClick();
    }

    // ドロップダウンを閉じる
    setIsOpen(false);
  };

  if (asChild) {
    return React.cloneElement(children as React.ReactElement, {
      onClick: handleClick,
      className: cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100",
        (children as React.ReactElement).props.className,
        className
      ),
    });
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100",
        className
      )}
    >
      {children}
    </div>
  );
}

export function DropdownMenuSeparator({
  className,
}: DropdownMenuSeparatorProps) {
  return <div className={cn("my-1 h-px bg-gray-200", className)} />;
}
