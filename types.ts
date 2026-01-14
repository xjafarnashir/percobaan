export type AppState = 'IDLE' | 'COUNTDOWN' | 'CAPTURING' | 'PROCESSING' | 'EDITING' | 'RESULT';

export interface PhotoData {
  id: string;
  dataUrl: string;
}

export interface BoothConfig {
  eventName: string;
  countdownDuration: number;
  photoCount: number;
}

export interface Template {
  id: string;
  name: string;
  background: string;
  backgroundImage?: string; // New: Support for custom image background
  textColor: string;
  accentColor: string;
  borderColor?: string;
}

export interface StickerItem {
  id: string;
  src: string;
  x: number;
  y: number;
  scale: number;
  rotation: number; // Added rotation
}

export interface TextItem {
  id: string;
  content: string;
  x: number;
  y: number;
  color: string;
  scale: number;
  rotation: number; // Added rotation
}