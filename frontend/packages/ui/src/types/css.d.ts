/// <reference types="react" />

// CSS Module declarations for Tailwind classes
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}
