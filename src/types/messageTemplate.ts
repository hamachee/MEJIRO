/** A saved webhook message, reusable from the message panel's template list. */
export interface MessageTemplate {
  id: string;
  title: string;
  content: string;
  /** Hex color for the embed's left border, e.g. "#5B4B8A". Empty falls back to the identity color, then the app default. */
  color: string;
}
