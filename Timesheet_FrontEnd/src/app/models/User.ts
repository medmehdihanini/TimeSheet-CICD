enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  PARTNER = 'PARTNER',
  GPS_LEAD = 'GPS_LEAD',
  PR_MANAGER = 'PR_MANAGER',
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  CONSULTANT = 'CONSULTANT'
}


export class User {
  id?: number
  firstname?: string;
  lastname?: string;
  email?: string;
  password?: string;
  role?: Role;
}