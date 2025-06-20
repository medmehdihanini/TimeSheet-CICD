export enum NotificationStatus {
    SUCCESS = 'SUCCESS',
    ERROR = 'ERROR',
    WARNING = 'WARNING',
    INFO = 'INFO'
  }
  
  export interface Notification {
    status: NotificationStatus;
    message: string;
    title: string;
  }
  