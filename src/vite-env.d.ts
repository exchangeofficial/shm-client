/// <reference types="vite/client" />

declare module '*.css' {
  const content: string;
  export default content;
}

declare module '@mantine/core/styles.css';
declare module '@mantine/notifications/styles.css';
