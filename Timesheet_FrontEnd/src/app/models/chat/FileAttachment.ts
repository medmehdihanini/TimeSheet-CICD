/**
 * Represents a file attachment in a chat message
 */
export interface FileAttachment {
  id?: number;
  filename: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  uploadDate?: string;  // ISO 8601 format
}
