export function sleep(milliseconds: number): Promise<null> {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

// replaceLast where pattern is a string
export function strReplaceLast(str, pattern, replacement) {
  const i = str.lastIndexOf(pattern);
  if (i < 0) return str;
  return replaceAtIndex(str, pattern, replacement, i);
}

// Replace pattern by replacement at index
function replaceAtIndex(str, pattern, replacement, i) {
  const lhs = str.substring(0, i);
  const rhs = str.substring(i + pattern.length, str.length);
  return lhs + replacement + rhs;
}

export function sortObjectEntries(obj) {
  return Object.entries(obj).sort((a, b) => {
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
  }).reduce((acc, curr) => {
      acc[curr[0]] = curr[1];
      return acc;
   }, {})
}