import {S3} from '@aws-sdk/client-s3-node'
import fs from 'fs'
import mkdirp from 'mkdirp'
import {downloadPrefix} from './download'

jest.mock('mkdirp')
jest.mock('fs', () => ({
  createWriteStream: jest.fn().mockReturnValue({
    on: jest.fn().mockImplementation((eventName, callback) => {
      if (eventName === 'finish') {
        callback()
      }
    })
  })
}))

const getS3Spy = (overrides?: {
  listObjectsV2?: jest.SpyInstance
  getObject?: jest.SpyInstance
  bodyStreamOn?: jest.SpyInstance
}): {[key in keyof S3]: jest.SpyInstance} =>
  (({
    listObjectsV2:
      overrides?.listObjectsV2 ??
      jest.fn().mockResolvedValue({
        Contents: [],
        NextContinuationToken: undefined,
        IsTruncated: false
      }),
    getObject:
      overrides?.getObject ??
      jest.fn().mockResolvedValue({
        Body: {
          on: overrides?.bodyStreamOn ?? jest.fn(),
          pipe: jest.fn()
        }
      })
  } as unknown) as {[key in keyof S3]: jest.SpyInstance})

describe('download', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('#downloadPrefix', () => {
    it('should download the file to the proper destination', async () => {
      const s3Spy = getS3Spy({
        listObjectsV2: jest.fn().mockResolvedValueOnce({
          Contents: [
            {
              Key: 'the-prefix-parent-folder/the-key'
            }
          ],
          NextContinuationToken: undefined,
          IsTruncated: false
        })
      })

      await downloadPrefix({
        destinationFolder: '/fake-destination',
        bucketName: 'the-bucket',
        maxParallelDownloads: 10,
        prefix: 'the-prefix-',
        s3: (s3Spy as unknown) as S3
      })

      expect(s3Spy.getObject).toHaveBeenCalledWith({
        Bucket: 'the-bucket',
        Key: 'the-prefix-parent-folder/the-key'
      })

      expect(mkdirp.sync).toHaveBeenCalledWith(
        '/fake-destination/parent-folder'
      )

      expect(fs.createWriteStream).toHaveBeenCalledWith(
        '/fake-destination/parent-folder/the-key'
      )
    })

    it('should download files from all pages', async () => {
      const s3Spy = getS3Spy({
        listObjectsV2: jest
          .fn()
          .mockResolvedValueOnce({
            Contents: [
              {
                Key: 'the-prefix-first-page-key'
              }
            ],
            NextContinuationToken: 'the-continuation-token',
            IsTruncated: true
          })
          .mockResolvedValueOnce({
            Contents: [
              {
                Key: 'the-prefix-second-page-key'
              }
            ],
            NextContinuationToken: undefined,
            IsTruncated: false
          })
      })

      await downloadPrefix({
        destinationFolder: '/fake-destination',
        bucketName: 'the-bucket',
        maxParallelDownloads: 10,
        prefix: 'the-prefix-',
        s3: (s3Spy as unknown) as S3
      })

      expect(s3Spy.listObjectsV2).toHaveBeenCalledWith({
        ContinuationToken: undefined,
        Bucket: 'the-bucket',
        Prefix: 'the-prefix-',
        MaxKeys: 10
      })
      expect(s3Spy.listObjectsV2).toHaveBeenCalledWith({
        ContinuationToken: 'the-continuation-token',
        Bucket: 'the-bucket',
        Prefix: 'the-prefix-',
        MaxKeys: 10
      })

      expect(s3Spy.getObject).toHaveBeenCalledWith({
        Bucket: 'the-bucket',
        Key: 'the-prefix-first-page-key'
      })
      expect(s3Spy.getObject).toHaveBeenCalledWith({
        Bucket: 'the-bucket',
        Key: 'the-prefix-second-page-key'
      })

      expect(fs.createWriteStream).toHaveBeenCalledWith(
        '/fake-destination/first-page-key'
      )
      expect(fs.createWriteStream).toHaveBeenCalledWith(
        '/fake-destination/second-page-key'
      )
    })

    it('should limit page size to maximum concurrency', async () => {
      const s3Spy = getS3Spy()

      await downloadPrefix({
        destinationFolder: '/fake-destination',
        bucketName: 'the-bucket',
        maxParallelDownloads: 42,
        prefix: 'the-prefix-',
        s3: (s3Spy as unknown) as S3
      })

      expect(s3Spy.listObjectsV2).toHaveBeenCalledWith({
        ContinuationToken: undefined,
        Bucket: 'the-bucket',
        Prefix: 'the-prefix-',
        MaxKeys: 42
      })
    })

    it('should return paths to downloaded files', async () => {
      const s3Spy = getS3Spy({
        listObjectsV2: jest.fn().mockResolvedValueOnce({
          Contents: [
            {
              Key: 'the-prefix-the-key'
            }
          ],
          NextContinuationToken: undefined,
          IsTruncated: false
        })
      })

      await expect(
        downloadPrefix({
          destinationFolder: '/fake-destination',
          bucketName: 'the-bucket',
          maxParallelDownloads: 10,
          prefix: 'the-prefix-',
          s3: (s3Spy as unknown) as S3
        })
      ).resolves.toEqual(['/fake-destination/the-key'])
    })

    it('should throw an error if no body is returned from the bucket', async () => {
      const s3Spy = getS3Spy({
        listObjectsV2: jest.fn().mockResolvedValueOnce({
          Contents: [
            {
              Key: 'the-prefix-the-key'
            }
          ],
          NextContinuationToken: undefined,
          IsTruncated: false
        }),
        getObject: jest.fn().mockResolvedValueOnce({
          Body: undefined
        })
      })

      await expect(
        downloadPrefix({
          destinationFolder: '/fake-destination',
          bucketName: 'the-bucket',
          maxParallelDownloads: 10,
          prefix: 'the-prefix-',
          s3: (s3Spy as unknown) as S3
        })
      ).rejects.toThrowError(
        'Attempt to fetch object with key «the-prefix-the-key» on bucket «the-bucket» returned invalid empty body: «undefined»'
      )
    })

    it('should throw an error if no keys have given prefix', async () => {
      const s3Spy = getS3Spy({
        listObjectsV2: jest.fn().mockResolvedValueOnce({
          Contents: undefined,
          NextContinuationToken: undefined,
          IsTruncated: false
        })
      })

      await expect(
        downloadPrefix({
          destinationFolder: '/fake-destination',
          bucketName: 'the-bucket',
          maxParallelDownloads: 10,
          prefix: 'the-prefix-',
          s3: (s3Spy as unknown) as S3
        })
      ).rejects.toThrowError(
        'No objects with prefix «the-prefix-» found in bucket «the-bucket»'
      )
    })

    it('should throw an error if bucket entry has no key', async () => {
      const s3Spy = getS3Spy({
        listObjectsV2: jest.fn().mockResolvedValueOnce({
          Contents: [{}],
          NextContinuationToken: undefined,
          IsTruncated: false
        })
      })

      await expect(
        downloadPrefix({
          destinationFolder: '/fake-destination',
          bucketName: 'the-bucket',
          maxParallelDownloads: 10,
          prefix: 'the-prefix-',
          s3: (s3Spy as unknown) as S3
        })
      ).rejects.toThrowError('No key for remote object: {}')
    })

    it('should throw an error if page is truncated but has no next continuation token', async () => {
      const s3Spy = getS3Spy({
        listObjectsV2: jest.fn().mockResolvedValueOnce({
          Contents: [],
          NextContinuationToken: undefined,
          IsTruncated: true
        })
      })

      await expect(
        downloadPrefix({
          destinationFolder: '/fake-destination',
          bucketName: 'the-bucket',
          maxParallelDownloads: 10,
          prefix: 'the-prefix-',
          s3: (s3Spy as unknown) as S3
        })
      ).rejects.toThrowError(
        'Response has next page but no continuation token was provided'
      )
    })

    it('should forward read errors to write stream', async () => {
      const forcedError = new Error('Forced error')
      const s3Spy = getS3Spy({
        listObjectsV2: jest.fn().mockResolvedValue({
          Contents: [{Key: 'the-key'}],
          NextContinuationToken: undefined,
          IsTruncated: false
        }),
        getObject: jest.fn().mockResolvedValue({
          Body: {
            on: jest.fn().mockImplementation((eventName, callback) => {
              if (eventName === 'error') {
                callback(forcedError)
              }
            }),
            pipe: jest.fn()
          }
        })
      })

      const emitSpy = jest.fn()

      jest.spyOn(fs, 'createWriteStream').mockReturnValue(({
        on: jest.fn().mockImplementation((eventName, callback) => {
          if (eventName === 'finish') {
            callback()
          }
        }),
        emit: emitSpy
      } as unknown) as ReturnType<typeof fs.createWriteStream>)

      await downloadPrefix({
        destinationFolder: '/fake-destination',
        bucketName: 'the-bucket',
        maxParallelDownloads: 10,
        prefix: 'the-prefix-',
        s3: (s3Spy as unknown) as S3
      })

      expect(emitSpy).toHaveBeenCalledWith('error', forcedError)
    })

    it('should forward read data to write stream', async () => {
      const pipeSpy = jest.fn()
      const s3Spy = getS3Spy({
        listObjectsV2: jest.fn().mockResolvedValue({
          Contents: [{Key: 'the-key'}],
          NextContinuationToken: undefined,
          IsTruncated: false
        }),
        getObject: jest.fn().mockResolvedValue({
          Body: {
            on: jest.fn().mockImplementation((eventName, callback) => {
              if (eventName === 'finish') {
                callback()
              }
            }),
            pipe: pipeSpy
          }
        })
      })

      const fakeWriteStream = ({
        on: jest.fn().mockImplementation((eventName, callback) => {
          if (eventName === 'finish') {
            callback()
          }
        }),
        emit: jest.fn()
      } as unknown) as ReturnType<typeof fs.createWriteStream>

      jest.spyOn(fs, 'createWriteStream').mockReturnValue(fakeWriteStream)

      await downloadPrefix({
        destinationFolder: '/fake-destination',
        bucketName: 'the-bucket',
        maxParallelDownloads: 10,
        prefix: 'the-prefix-',
        s3: (s3Spy as unknown) as S3
      })

      expect(pipeSpy).toHaveBeenCalledWith(fakeWriteStream)
    })
  })
})
