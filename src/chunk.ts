export const getChunked = <Item>(
  originalItems: Item[],
  maximumChunkSize: number
): Item[][] => {
  if (maximumChunkSize <= 0 || Number.isNaN(maximumChunkSize)) {
    throw new Error('Chunk size must be a positive number')
  }

  if (!originalItems.length) {
    return []
  }

  return originalItems.reduce(
    (chunks, item) => {
      const lastChunk = chunks[chunks.length - 1]
      const isLastChunkFilled = lastChunk.length >= maximumChunkSize

      if (isLastChunkFilled) {
        chunks.push([item])
      } else {
        lastChunk.push(item)
      }

      return chunks
    },
    [[]] as Item[][]
  )
}
