export const ALGORITHM_CATEGORIES = [
  'Sorting','Searching','Dynamic Programming','Greedy',
  'Graph','Backtracking','String','Tree','Math'
];

export const ALGORITHM_XP = {
  'Bubble Sort':20,'Selection Sort':20,'Insertion Sort':20,
  'Merge Sort':35,'Quick Sort':35,'Heap Sort':35,'Radix Sort':40,
  'Linear Search':15,'Binary Search':25,'Jump Search':30,
  'Knapsack':45,'LCS':45,'Matrix Chain':50,'Coin Change':40,
  'Kruskal':45,'Prim':45,'Dijkstra':50,'Floyd-Warshall':50,
  'N-Queens':60,'Sudoku':70,'Graph Coloring':55,'Subset Sum':45,
  'KMP':45,'Rabin-Karp':50,'Boyer-Moore':55
};

export const ROLES = { STUDENT:'student', ADMIN:'admin', BANNED:'banned' };

export const COLLECTION = {
  USERS:'users', SESSIONS:'sessions', FEEDBACK:'feedback',
  BUGS:'bug_reports', FEATURES:'feature_requests',
  ANNOUNCEMENTS:'announcements', DONATIONS:'donations',
  STATS:'stats', ANALYTICS:'analytics'
};

export const EVENTS = {
  USER_LOGIN:'ada:userLogin', USER_LOGOUT:'ada:userLogout',
  ALGO_OPEN:'ada:algoOpen', ALGO_COMPLETE:'ada:algoComplete',
  XP_EARNED:'ada:xpEarned', ACHIEVEMENT:'ada:achievement',
  SEARCH:'ada:search', PDF_EXPORT:'ada:pdfExport'
};

export const LIMITS = {
  RECENT_HISTORY:50, SEARCH_HISTORY:100, NOTIFICATIONS:20,
  NOTES_MAX:100, LEADERBOARD:20
};
