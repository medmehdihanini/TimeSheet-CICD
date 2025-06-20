import { IProgram, IProject } from './program.models';

export enum LogType {
  SYSTEM = 'SYSTEM',
  PROGRAM = 'PROGRAM',
  PROJECT = 'PROJECT'
}

export interface Log {
  id: number;
  username: string;
  email: string | null;
  action: string;
  logType: LogType;
  timestamp: string;
  program?: IProgram;
  project?: IProject;
}
