import { ReactNode } from 'react';

export interface Alert {
  id: string;
  title: string;
  message?: ReactNode;
  link?: string;
  linkTitle?: string;
  severity?: string;
}
