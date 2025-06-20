import { Profile } from './ChatParticipant';
import { IProject } from '../program.models';
import { User } from '../User';

/**
 * Represents a chat room in the system
 */
export interface ChatRoom {
  id: number;
  name: string;
  description: string;
  createdDate: string;  // ISO 8601 format
  creator: User;
  project: IProject;
  members: Profile[];
}

/**
 * Simplified Project model for chat room
 */
export interface Project {
  idproject: number;
  name: string;
}
