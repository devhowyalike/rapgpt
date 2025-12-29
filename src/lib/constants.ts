/**
 * Application-wide constants
 */

export const APP_TITLE = "RapGPT";
export const TAGLINE = "Don't Matter Just Don't Byte It";
export const TAGLINE_2 = "No Byting";
export const TAGLINE_3 = "Don't Byte";
export const MADE_BY = "Good At Coding";
export const YEAR = new Date().getFullYear();

/* When true in environment variables, the app will show the Hoopla personas and allow the user to select any of them. */
export const HOOPLA_MODE = process.env.NEXT_PUBLIC_HOOPLA_MODE === "true";
