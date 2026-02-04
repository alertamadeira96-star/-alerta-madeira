export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
  role: 'user' | 'admin';
}

export type Category = 'ocorrencias' | 'op-stop' | 'anomalias' | 'perdidos' | 'acidentes' | 'alertas';

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  title: string;
  description: string;
  imageUrl: string;
  videoUrl?: string;
  category: Category;
  location: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  reactions: Reactions;
  commentsCount: number;
}

export interface Reactions {
  thumbsUp: string[];
  heart: string[];
  alert: string[];
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: string;
}

export interface Advertisement {
  id: string;
  imageUrl: string;
  linkUrl: string;
  title: string;
  active: boolean;
  createdAt: string;
}

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  sentAt: string;
  sentBy: string;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  'ocorrencias': 'Ocorrências',
  'op-stop': 'Op. Stop',
  'anomalias': 'Anomalias',
  'perdidos': 'Perdidos',
  'acidentes': 'Acidentes',
  'alertas': 'Alertas',
};

export const CATEGORY_ICONS: Record<Category, string> = {
  'ocorrencias': 'AlertTriangle',
  'op-stop': 'ShieldAlert',
  'anomalias': 'Construction',
  'perdidos': 'Search',
  'acidentes': 'Car',
  'alertas': 'Bell',
};
