import type { MergeResult } from '../types'

interface ChangeRegion {
  start: number
  end: number
  newLines: string[]
}

const CONFLICT_START = '<<<<<<< yours'
const CONFLICT_SEP = '======='
const CONFLICT_END = '>>>>>>> theirs'

function diffLines(before: string[], after: string[]): ChangeRegion[] {
  const m = before.length
  const n = after.length

  // LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = before[i - 1] === after[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1])
    }
  }

  // Backtrack to find change regions
  const changes: ChangeRegion[] = []
  let i = m
  let j = n

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && before[i - 1] === after[j - 1]) {
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      // Lines added in 'after' — find the extent of this change
      const changeEnd = j
      while (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        j--
      }
      changes.unshift({ start: i, end: i, newLines: after.slice(j, changeEnd) })
    } else {
      // Lines removed from 'before' — find the extent
      const removeEnd = i
      while (i > 0 && (j === 0 || dp[i - 1][j] >= dp[i][j - 1])) {
        i--
      }
      changes.unshift({ start: i, end: removeEnd, newLines: [] })
    }
  }

  return changes
}

export function threeWayMerge(base: string, ours: string, theirs: string): MergeResult {
  // Trivial cases
  if (ours === theirs) return { kind: 'clean', merged: ours }
  if (ours === base) return { kind: 'clean', merged: theirs }
  if (theirs === base) return { kind: 'clean', merged: ours }

  const baseLines = base.split('\n')
  const oursLines = ours.split('\n')
  const theirsLines = theirs.split('\n')

  const oursChanges = diffLines(baseLines, oursLines)
  const theirsChanges = diffLines(baseLines, theirsLines)

  // Merge the two sets of changes
  const merged: string[] = []
  let baseIdx = 0
  let hasConflict = false

  // Convert changes to indexed lists for iteration
  let oi = 0
  let ti = 0

  while (baseIdx < baseLines.length || oi < oursChanges.length || ti < theirsChanges.length) {
    const ourChange = oi < oursChanges.length ? oursChanges[oi] : null
    const theirChange = ti < theirsChanges.length ? theirsChanges[ti] : null

    // Emit unchanged base lines up to the next change
    const nextChangeStart = Math.min(
      ourChange?.start ?? baseLines.length,
      theirChange?.start ?? baseLines.length
    )

    while (baseIdx < nextChangeStart) {
      merged.push(baseLines[baseIdx])
      baseIdx++
    }

    if (!ourChange && !theirChange) break

    // Check for overlapping changes
    if (ourChange && theirChange) {
      const ourOverlap = ourChange.start < theirChange.end && theirChange.start < ourChange.end
      if (ourOverlap) {
        // Overlapping changes — check if identical
        const oursText = ourChange.newLines.join('\n')
        const theirsText = theirChange.newLines.join('\n')

        if (oursText === theirsText) {
          merged.push(...ourChange.newLines)
        } else {
          hasConflict = true
          merged.push(CONFLICT_START)
          merged.push(...ourChange.newLines)
          merged.push(CONFLICT_SEP)
          merged.push(...theirChange.newLines)
          merged.push(CONFLICT_END)
        }

        baseIdx = Math.max(ourChange.end, theirChange.end)
        oi++
        ti++
        continue
      }
    }

    // Non-overlapping — apply whichever comes first
    if (ourChange && (!theirChange || ourChange.start <= theirChange.start)) {
      merged.push(...ourChange.newLines)
      baseIdx = ourChange.end
      oi++
    } else if (theirChange) {
      merged.push(...theirChange.newLines)
      baseIdx = theirChange.end
      ti++
    }
  }

  const mergedText = merged.join('\n')

  if (hasConflict) {
    return { kind: 'conflict', merged: mergedText, ours, theirs, base }
  }

  return { kind: 'clean', merged: mergedText }
}

export function hasConflictMarkers(text: string): boolean {
  return text.includes(CONFLICT_START)
}
