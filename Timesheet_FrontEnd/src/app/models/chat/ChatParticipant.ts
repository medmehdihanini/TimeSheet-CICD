/**
 * Represents a participant in a chat room
 */
export interface Profile {
  idp: number;
  firstname: string;
  lastname: string;
  email: string;
  image?: string;
}
