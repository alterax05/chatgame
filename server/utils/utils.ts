export function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function levenshteinDistance(a: string, b: string) {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

export function findClosestString(target: string | undefined, strings: string[]) {
  if (!target) {
    return undefined;
  }

  let closest = strings[0];
  let closestDistance = levenshteinDistance(target, closest);

  for (const string of strings.slice(1)) {
    const distance = levenshteinDistance(target, string);
    if (distance < closestDistance) {
      closest = string;
      closestDistance = distance;
    }
  }

  return closest;
}
