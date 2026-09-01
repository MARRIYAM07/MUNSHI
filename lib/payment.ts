export const receiptExtensions = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "application/pdf": "pdf",
} as const;

export const receiptMaxBytes = 5 * 1024 * 1024;

export type ReceiptContentType = keyof typeof receiptExtensions;

export const receiptAccept = Object.keys(receiptExtensions).join(",");

export function receiptExtension(contentType: string): string | undefined {
  return receiptExtensions[contentType as ReceiptContentType];
}
