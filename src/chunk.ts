export const getChunked = <Item>(
  originalItems: Item[],
  maximumChunkSize: number
): Item[][] => {
  if (maximumChunkSize <= 0 || isNaN(maximumChunkSize)) {
    throw new Error('Chunk size must be a positive number')
  }

  if (!originalItems.length) {
    return []
  }

  return originalItems.reduce(
    (chunks, item) => {
      const lastChunk = chunks[chunks.length - 1]
      const isLastChunkFilled = lastChunk.length >= maximumChunkSize

      return isLastChunkFilled
        ? [...chunks, [item]]
        : [...chunks.slice(0, -1), [...lastChunk, item]]
    },
    [[]] as Item[][]
  )
}
