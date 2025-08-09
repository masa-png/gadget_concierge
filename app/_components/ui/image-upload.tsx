"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { Camera, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./button";
import { getProfileImageUrl } from "@/lib/utils/storage";

interface ImageUploadProps {
  currentImageKey?: string | null;
  onImageSelect: (file: File) => void;
  onImageRemove: () => void;
  isUploading?: boolean;
  className?: string;
}

export function ImageUpload({
  currentImageKey,
  onImageSelect,
  onImageRemove,
  isUploading = false,
  className = "",
}: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentImageUrl = currentImageKey
    ? getProfileImageUrl(currentImageKey)
    : null;
  const displayImageUrl = previewUrl || currentImageUrl;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // ファイルサイズチェック（5MB制限）
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("ファイルサイズは5MB以下にしてください");
      return;
    }

    // ファイル形式チェック
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("JPEG、PNG、WebP形式の画像をアップロードしてください");
      return;
    }

    // プレビュー用のURLを作成
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // 親コンポーネントに通知
    onImageSelect(file);

    // ファイル入力をリセット
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onImageRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col items-center space-y-4">
        {/* 画像プレビューエリア */}
        <div className="relative">
          <div className="w-32 h-32 rounded-full border-4 border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
            {displayImageUrl ? (
              <Image
                src={displayImageUrl}
                alt="プロフィール画像"
                width={128}
                height={128}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              <Camera className="w-12 h-12 text-gray-400" />
            )}
          </div>

          {/* 削除ボタン */}
          {displayImageUrl && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={isUploading}
              className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* アップロードボタン */}
        <Button
          type="button"
          variant="outline"
          onClick={handleButtonClick}
          disabled={isUploading}
          className="flex items-center gap-2"
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" />
              アップロード中...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              画像を選択
            </>
          )}
        </Button>

        {/* ファイル入力（非表示） */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />

        {/* ヘルプテキスト */}
        <p className="text-sm text-gray-500 text-center">
          JPEG、PNG、WebP形式
          <br />
          最大5MBまで
        </p>
      </div>
    </div>
  );
}
