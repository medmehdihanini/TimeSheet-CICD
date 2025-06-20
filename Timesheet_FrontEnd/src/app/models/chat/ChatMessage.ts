import { Profile } from './ChatParticipant';

/**
 * Enum for message content types
 */
export enum ContentType {
  TEXT = 'TEXT',
  FILE = 'FILE',
  SYSTEM = 'SYSTEM'
}

/**
 * Represents a message in a chat room
 */
export interface ChatMessage {
  id?: number;
  chatRoom: { id: number };
  sender?: Profile;  // null for system messages
  content: string;
  contentType: ContentType | string;
  createdDate?: string;  // ISO 8601 format
  systemMessage: boolean;
  readBy: Profile[];
  fileUrl?: string;  // only for FILE messages
}
