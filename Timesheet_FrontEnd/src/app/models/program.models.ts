import { Status } from './Status';

// Interface representing a User (simplified)
export interface IUser {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
    role: string;
    image?: string;
}

// Interface matching backend Program entity
export interface IProgram {
    idprog: number;
    numcontrat: number;
    name: string;
    status: Status;
    Client: string;
    startdate: string;
    enddate: string;
    launchedat: Date;
    image?: string; // Base64 string for frontend
    chefprogram: IUser;
    programProfiles?: any[]; // Can be typed more specifically if needed
    projects?: IProject[];
}

// Interface matching backend Project entity
export interface IProject {
    idproject: number;
    name: string;
    description: string;
    state: boolean;
    image?: string; // Base64 string for frontend
    status: Status;
    chefprojet: IUser;
    program?: IProgram;
    projectProfiles?: any[]; // Can be typed more specifically if needed
}
