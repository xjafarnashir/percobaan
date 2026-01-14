import { Template } from '../types';

export const TEMPLATES: Template[] = [
  {
    id: 'classic',
    name: 'Classic',
    background: '#ffffff',
    textColor: '#1e293b', // Slate 800
    accentColor: '#334155', // Slate 700
    borderColor: '#cbd5e1'  // Slate 300
  },
  {
    id: 'midnight',
    name: 'Midnight',
    background: '#0f172a', // Slate 900
    textColor: '#f8fafc', // Slate 50
    accentColor: '#ec4899', // Pink 500
    borderColor: '#334155'  // Slate 700
  },
  {
    id: 'vintage',
    name: 'Vintage',
    background: '#fffbeb', // Amber 50
    textColor: '#78350f', // Amber 900
    accentColor: '#b45309', // Amber 700
    borderColor: '#d6d3d1' // Stone 300
  },
  {
    id: 'pop',
    name: 'Pop Art',
    background: '#fef08a', // Yellow 200
    textColor: '#1e40af', // Blue 800
    accentColor: '#ef4444', // Red 500
    borderColor: '#1e40af' // Blue 800
  },
  {
    id: 'bw',
    name: 'Mono',
    background: '#171717', // Neutral 900
    textColor: '#ffffff',
    accentColor: '#525252', // Neutral 600
    borderColor: '#404040'
  }
];