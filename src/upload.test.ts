import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'node:fs'
import type {S3} from '@aws-sdk/client-s3'
import * as glob from '@actions/glob'
import {uploadGlobToPrefix} from './upload'

vi.mock('fs', () => ({
  default: {
    readFile: vi.fn(),
    createWriteStream: vi.fn()
  },
  readFile: vi.fn(),
  createWriteStream: vi.fn()
}))

vi.mock('@actions/glob', () => ({
  default: {
    create: vi.fn()
  },
  create: vi.fn()
}))

const getS3Spy = (overrides?: {
  putObject?: ReturnType<typeof vi.fn>
}): Record<string, ReturnType<typeof vi.fn>> =>
  ({
    putObject: overrides?.putObject ?? vi.fn()
  } as unknown as Record<string, ReturnType<typeof vi.fn>>)

describe('upload', () => {
  beforeEach(() => {
    vi.mocked(fs.readFile).mockImplementation(
      (_file, callback: (error: Error | null, buffer: Buffer) => void) =>
        callback(null, Buffer.from('data'))
    )
    vi.mocked(glob.create).mockResolvedValue({
      glob: vi.fn().mockResolvedValue(['/fake-root/my-file']),
      getSearchPaths: vi.fn(),
      globGenerator: vi.fn()
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('#uploadGlobToPrefix', () => {
    it('should convert pattern to files', async () => {
      const s3Spy = getS3Spy()

      await uploadGlobToPrefix({
        acl: 'public-read',
        patterns: ['pattern-a', 'pattern-b'],
        bucketName: 'the-bucket',
        prefix: 'the-prefix',
        s3: s3Spy as unknown as S3,
        maxParallelUploads: 10
      })

      expect(glob.create).toHaveBeenCalledWith('pattern-a\npattern-b')
    })

    it('should upload file with proper prefix', async () => {
      const s3Spy = getS3Spy()

      await uploadGlobToPrefix({
        acl: 'public-read',
        patterns: ['pattern-a', 'pattern-b'],
        bucketName: 'the-bucket',
        prefix: 'the-prefix',
        s3: s3Spy as unknown as S3,
        maxParallelUploads: 10
      })

      expect(s3Spy.putObject).toHaveBeenCalledWith({
        Bucket: 'the-bucket',
        ACL: 'public-read',
        Body: expect.anything(),
        Key: 'the-prefix/fake-root/my-file'
      })
    })

    it('should return uploaded files', async () => {
      const s3Spy = getS3Spy()

      await expect(
        uploadGlobToPrefix({
          acl: 'public-read',
          patterns: ['pattern-a', 'pattern-b'],
          bucketName: 'the-bucket',
          prefix: 'the-prefix',
          s3: s3Spy as unknown as S3,
          maxParallelUploads: 10
        })
      ).resolves.toEqual(['/fake-root/my-file'])
    })

    it('should fail if file cannot be read', async () => {
      const s3Spy = getS3Spy()

      vi.spyOn(fs, 'readFile').mockImplementationOnce((_file, callback) => {
        callback(new Error('Forced error'), Buffer.from(''))
      })

      await expect(
        uploadGlobToPrefix({
          acl: 'public-read',
          patterns: ['pattern-a', 'pattern-b'],
          bucketName: 'the-bucket',
          prefix: 'the-prefix',
          s3: s3Spy as unknown as S3,
          maxParallelUploads: 10
        })
      ).rejects.toThrowError('Forced error')
    })
  })
})
