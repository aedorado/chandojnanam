/**
 * Levenshtein distance & edit operations
 * Implements editops compatible with Python-Levenshtein
 */

export function distance(s, d) {
  const m = s.length;
  const n = d.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s[i - 1] === d[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j - 1], // replace
          dp[i - 1][j],     // delete
          dp[i][j - 1]      // insert
        );
      }
    }
  }

  return dp[m][n];
}

export function editops(s, d) {
  const m = s.length;
  const n = d.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s[i - 1] === d[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j - 1], // replace
          dp[i - 1][j],     // delete
          dp[i][j - 1]      // insert
        );
      }
    }
  }

  const ops = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && s[i - 1] === d[j - 1] && dp[i][j] === dp[i - 1][j - 1]) {
      i--;
      j--;
    } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
      ops.push(['replace', i - 1, j - 1]);
      i--;
      j--;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      ops.push(['delete', i - 1, j]);
      i--;
    } else if (j > 0 && dp[i][j] === dp[i][j - 1] + 1) {
      ops.push(['insert', i, j - 1]);
      j--;
    } else {
      break;
    }
  }

  return ops.reverse();
}
