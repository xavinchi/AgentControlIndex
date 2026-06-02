import methodologyWeights from '../../public/data/methodologyWeights.json'

type Methodology = typeof methodologyWeights

type Dimension = Methodology['dimensions'][number]
export type DimensionKey = Dimension['key']

export type DimensionScores = Record<DimensionKey, number>

export type ScoreBand = Methodology['scoreBands'][number]['label']

export type ScoredTool = {
  toolId: string
  name?: string
  vendor?: string
  categoryId?: string
  dimensions: DimensionScores
  overallScore?: number
  band?: ScoreBand
}

export type RankedTool = ScoredTool & {
  overallScore: number
  band: ScoreBand
  rank: number
}

export type ToolFilters = {
  search?: string
  categoryIds?: string[]
  bands?: ScoreBand[]
  minScore?: number
  maxScore?: number
}

function clampScore(value: number): number {
  if (Number.isNaN(value)) return 0
  if (value < 0) return 0
  if (value > 5) return 5
  return value
}

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100
}

export function calculateWeightedScore(
  dimensionScores: Partial<Record<DimensionKey, number>>,
  methodology: Methodology = methodologyWeights
): number {
  const weightedTotal = methodology.dimensions.reduce((acc, dimension) => {
    const raw = dimensionScores[dimension.key] ?? 0
    const normalized = clampScore(raw) / 5
    return acc + normalized * dimension.weight
  }, 0)

  return roundToTwo(weightedTotal)
}

export function getScoreBand(
  score: number,
  methodology: Methodology = methodologyWeights
): ScoreBand {
  const clamped = Math.max(0, Math.min(100, score))
  const band = methodology.scoreBands.find((item) => clamped >= item.min && clamped <= item.max)

  if (!band) {
    return methodology.scoreBands[methodology.scoreBands.length - 1].label
  }

  return band.label
}

export function rankTools(
  tools: ScoredTool[],
  methodology: Methodology = methodologyWeights
): RankedTool[] {
  return tools
    .map((tool) => {
      const overallScore =
        typeof tool.overallScore === 'number'
          ? roundToTwo(tool.overallScore)
          : calculateWeightedScore(tool.dimensions, methodology)

      return {
        ...tool,
        overallScore,
        band: getScoreBand(overallScore, methodology)
      }
    })
    .sort((a, b) => b.overallScore - a.overallScore || a.toolId.localeCompare(b.toolId))
    .map((tool, index) => ({ ...tool, rank: index + 1 }))
}

export function calculateMovement(
  current: RankedTool[],
  previous: RankedTool[]
): Array<
  RankedTool & {
    previousRank: number | null
    movement: number | null
    movementLabel: 'up' | 'down' | 'no-change' | 'new'
  }
> {
  const previousRankMap = new Map(previous.map((item) => [item.toolId, item.rank]))

  return current.map((item) => {
    const previousRank = previousRankMap.get(item.toolId) ?? null

    if (previousRank === null) {
      return {
        ...item,
        previousRank,
        movement: null,
        movementLabel: 'new'
      }
    }

    const movement = previousRank - item.rank

    return {
      ...item,
      previousRank,
      movement,
      movementLabel: movement > 0 ? 'up' : movement < 0 ? 'down' : 'no-change'
    }
  })
}

export function filterTools<T extends { name?: string; vendor?: string; categoryId?: string; band?: ScoreBand; overallScore?: number }>(
  tools: T[],
  filters: ToolFilters
): T[] {
  const search = filters.search?.trim().toLowerCase()

  return tools.filter((tool) => {
    if (search) {
      const haystack = `${tool.name ?? ''} ${tool.vendor ?? ''}`.toLowerCase()
      if (!haystack.includes(search)) {
        return false
      }
    }

    if (filters.categoryIds && filters.categoryIds.length > 0) {
      if (!tool.categoryId || !filters.categoryIds.includes(tool.categoryId)) {
        return false
      }
    }

    if (filters.bands && filters.bands.length > 0) {
      if (!tool.band || !filters.bands.includes(tool.band)) {
        return false
      }
    }

    if (typeof filters.minScore === 'number') {
      if (typeof tool.overallScore !== 'number' || tool.overallScore < filters.minScore) {
        return false
      }
    }

    if (typeof filters.maxScore === 'number') {
      if (typeof tool.overallScore !== 'number' || tool.overallScore > filters.maxScore) {
        return false
      }
    }

    return true
  })
}

export function compareTools(
  left: ScoredTool,
  right: ScoredTool,
  methodology: Methodology = methodologyWeights
) {
  const leftScore =
    typeof left.overallScore === 'number' ? roundToTwo(left.overallScore) : calculateWeightedScore(left.dimensions, methodology)
  const rightScore =
    typeof right.overallScore === 'number'
      ? roundToTwo(right.overallScore)
      : calculateWeightedScore(right.dimensions, methodology)

  const dimensionDeltas = methodology.dimensions.map((dimension) => {
    const leftDimension = clampScore(left.dimensions[dimension.key] ?? 0)
    const rightDimension = clampScore(right.dimensions[dimension.key] ?? 0)

    return {
      key: dimension.key,
      label: dimension.label,
      left: leftDimension,
      right: rightDimension,
      delta: roundToTwo(leftDimension - rightDimension)
    }
  })

  const betterDimensions = dimensionDeltas.filter((item) => item.delta > 0).map((item) => item.key)
  const weakerDimensions = dimensionDeltas.filter((item) => item.delta < 0).map((item) => item.key)

  return {
    left: {
      ...left,
      overallScore: leftScore,
      band: getScoreBand(leftScore, methodology)
    },
    right: {
      ...right,
      overallScore: rightScore,
      band: getScoreBand(rightScore, methodology)
    },
    scoreDelta: roundToTwo(leftScore - rightScore),
    dimensionDeltas,
    betterDimensions,
    weakerDimensions
  }
}

export { methodologyWeights }
