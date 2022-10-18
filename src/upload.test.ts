import fs from 'fs'
import {S3} from '@aws-sdk/client-s3'
import * as glob from '@actions/glob'
import {uploadGlobToPrefix} from './upload'

jest.mock('fs', () => ({
  readFile: (
    file: string,
    callback: (error: Error | null, buffer: Buffer) => void
  ) => callback(null, Buffer.from('data'))
}))

jest.mock('@actions/glob', () => ({
  create: jest.fn().mockResolvedValue({
    glob: jest.fn().mockResolvedValue(['/fake-root/my-file'])
  })
}))

const getS3Spy = (overrides?: {
  putObject?: jest.SpyInstance
}): {[key in keyof S3]: jest.SpyInstance} =>
  ({
    putObject: overrides?.putObject ?? jest.fn()
  } as unknown as {[key in keyof S3]: jest.SpyInstance})

describe('upload', () => {
  afterEach(() => {
    jest.restoreAllMocks()
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

      jest.spyOn(fs, 'readFile').mockImplementationOnce((file, callback) => {
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
