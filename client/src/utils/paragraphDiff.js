const levenshteinDistance = (a, b) => {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) == a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
};

const isSimilar = (a, b, threshold = 0.2) => {
  const distance = levenshteinDistance(a, b);
  const maxLength = Math.max(a.length, b.length);
  const similarity = 1 - distance / maxLength;
  return similarity >= threshold;
};

export const computeDiff = (original, edited) => {
  const originalSentences = original.split(/(?<=[.!?])\s+/);
  const editedSentences = edited.split(/(?<=[.!?])\s+/);
  let diff = [];
  let i = 0,
    j = 0;

  while (i < originalSentences.length || j < editedSentences.length) {
    if (i >= originalSentences.length) {
      diff.push({
        type: "addition",
        content: editedSentences[j],
        status: "pending",
      });
      j++;
    } else if (j >= editedSentences.length) {
      diff.push({
        type: "deletion",
        content: originalSentences[i],
        status: "pending",
      });
      i++;
    } else if (originalSentences[i] === editedSentences[j]) {
      diff.push({ type: "unchanged", content: originalSentences[i] });
      i++;
      j++;
    } else if (isSimilar(originalSentences[i], editedSentences[j])) {
      diff.push({
        type: "modification",
        original: originalSentences[i],
        modified: editedSentences[j],
        status: "pending",
      });
      i++;
      j++;
    } else {
      // Look ahead to find potential matches or modifications
      let foundMatch = false;
      for (
        let k = 1;
        k < 3 &&
        i + k < originalSentences.length &&
        j + k < editedSentences.length;
        k++
      ) {
        if (
          originalSentences[i + k] === editedSentences[j] ||
          isSimilar(originalSentences[i + k], editedSentences[j])
        ) {
          // Sentences before the match are considered deletions
          for (let m = 0; m < k; m++) {
            diff.push({
              type: "deletion",
              content: originalSentences[i + m],
              status: "pending",
            });
          }
          i += k;
          foundMatch = true;
          break;
        } else if (
          originalSentences[i] === editedSentences[j + k] ||
          isSimilar(originalSentences[i], editedSentences[j + k])
        ) {
          // Sentences before the match are considered additions
          for (let m = 0; m < k; m++) {
            diff.push({
              type: "addition",
              content: editedSentences[j + m],
              status: "pending",
            });
          }
          j += k;
          foundMatch = true;
          break;
        }
      }
      if (!foundMatch) {
        // If no match found, consider it as a deletion and an addition
        diff.push({
          type: "deletion",
          content: originalSentences[i],
          status: "pending",
        });
        diff.push({
          type: "addition",
          content: editedSentences[j],
          status: "pending",
        });
        i++;
        j++;
      }
    }
  }

  return diff;
};
