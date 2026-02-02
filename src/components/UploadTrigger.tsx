"use client";

import { ReactNode, useRef } from "react";

type UploadTriggerRenderProps = {
  openFileDialog: () => void;
  handleSelectedFile: (file: File) => void;
  isUploading: boolean;
};

type UploadTriggerProps = {
  accept?: string;
  isUploading?: boolean;
  onFileSelected: (file: File) => void;
  onError: (message: string) => void;
  children: (props: UploadTriggerRenderProps) => ReactNode;
};

export function UploadTrigger({
  accept = "application/pdf,image/*",
  isUploading = false,
  onFileSelected,
  onError,
  children,
}: UploadTriggerProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function openFileDialog() {
    if (isUploading) return;
    fileInputRef.current?.click();
  }

  function isSupportedUpload(file: File) {
    return file.type === "application/pdf" || file.type.startsWith("image/");
  }

  function handleSelectedFile(file: File) {
    if (!isSupportedUpload(file)) {
      onError("PDF 또는 이미지 파일만 업로드할 수 있습니다");
      return;
    }

    if (file.size === 0) {
      onError("빈 파일입니다. 내용이 있는 문서를 업로드해주세요");
      return;
    }

    onFileSelected(file);
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) handleSelectedFile(file);
          event.target.value = "";
        }}
      />
      {children({ openFileDialog, handleSelectedFile, isUploading })}
    </>
  );
}
