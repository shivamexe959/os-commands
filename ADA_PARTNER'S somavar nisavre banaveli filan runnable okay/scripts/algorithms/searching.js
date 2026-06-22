/**
 * searching.js — Algorithm category module
 * All algorithm logic lives in /scripts/algorithms.js (legacy global bundle).
 * This module tracks algorithm-category opens via the XP/analytics system.
 */
export const CATEGORY = 'searching';

// Category algorithms are called via window.showTool() in algorithms.js.
// The app.js bridge intercepts showTool and reports opens to Firestore.
