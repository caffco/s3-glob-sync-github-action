import {describe, expect, it} from 'vitest'
import {getChunked} from './chunk'

describe('chunk', () => {
  describe('#getChunked', () => {
    it('should throw an error if chunk size is 0', () => {
      expect(() => getChunked([], 0)).toThrowError(
        'Chunk size must be a positive number'
      )
    })

    it('should throw an error if chunk size is negative', () => {
      expect(() => getChunked([], -2)).toThrowError(
        'Chunk size must be a positive number'
      )
    })

    it('should throw an error if chunk size is not a number', () => {
      expect(() => getChunked([], parseInt('not a number'))).toThrowError(
        'Chunk size must be a positive number'
      )
    })

    it('should return an empty array if original array is empty', () => {
      expect(getChunked([], 1)).toEqual([])
    })

    it('should return chunked items when only one chunk is needed', () => {
      expect(getChunked(['hello', 'world'], 2)).toEqual([['hello', 'world']])
    })

    it('should return chunked items when multiple chunks are needed', () => {
      expect(getChunked(['a', 'b', 'c', 'd', 'e'], 2)).toEqual([
        ['a', 'b'],
        ['c', 'd'],
        ['e']
      ])
    })
  })
})
