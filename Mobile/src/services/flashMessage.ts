import { showMessage, type MessageType } from 'react-native-flash-message';

export type NoticeLevel = Extract<MessageType, 'info' | 'success' | 'warning' | 'danger'>;

export const notify = (message: string, type: NoticeLevel = 'info'): void => {
  showMessage({ message, type, icon: 'auto', floating: true, duration: 3000 });
};

export const notifySuccess = (message: string): void => notify(message, 'success');
export const notifyWarning = (message: string): void => notify(message, 'warning');
export const notifyError = (message: string): void => notify(message, 'danger');
