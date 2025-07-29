import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {S3} from '@aws-sdk/client-s3'
import * as github from './github'
import * as upload from './upload'
import * as download from './download'
import main from './main'

vi.mock('./github')
vi.mock('./upload')
vi.mock('./download')
vi.mock('@aws-sdk/client-s3', () => ({
  S3: vi.fn()
}))

describe('Main', () => {
  const fakeS3Instance = {}

  beforeEach(() => {
    vi.mocked(S3).mockReturnValue(fakeS3Instance as S3)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('#default', () => {
    it('should create S3 instance with proper parameters', async () => {
      vi
        .spyOn(github, 'getOptionsFromGithubActionInput')
        .mockReturnValueOnce({
          prefix: 'the-prefix',
          bucketName: 'the-bucket',
          endpoint: 'the-endpoint',
          region: 'the-region',
          credentials: {
            accessKeyId: 'the-access-key',
            secretAccessKey: 'the-secret-access-key'
          },
          mode: 'download',
          destinationFolder: '/destination-folder',
          maxParallelDownloads: 10
        })

      await main()

      expect(S3).toHaveBeenCalledWith({
        endpoint: 'the-endpoint',
        region: 'the-region',
        credentials: {
          accessKeyId: 'the-access-key',
          secretAccessKey: 'the-secret-access-key'
        }
      })
    })

    describe('upload mode', () => {
      beforeEach(() => {
        vi
          .spyOn(github, 'getOptionsFromGithubActionInput')
          .mockReturnValueOnce({
            prefix: 'the-prefix',
            bucketName: 'the-bucket',
            endpoint: 'the-endpoint',
            region: 'the-region',
            credentials: {
              accessKeyId: 'the-access-key',
              secretAccessKey: 'the-secret-access-key'
            },
            mode: 'upload',
            acl: 'public-read',
            patterns: ['pattern-a', 'pattern-b'],
            maxParallelUploads: 10
          })
      })

      it('should upload files', async () => {
        await main()

        expect(upload.uploadGlobToPrefix).toHaveBeenCalledWith({
          acl: 'public-read',
          bucketName: 'the-bucket',
          credentials: {
            accessKeyId: 'the-access-key',
            secretAccessKey: 'the-secret-access-key'
          },
          endpoint: 'the-endpoint',
          maxParallelUploads: 10,
          mode: 'upload',
          patterns: ['pattern-a', 'pattern-b'],
          prefix: 'the-prefix',
          region: 'the-region',
          s3: expect.anything()
        })
      })

      it('should set uploaded files as output', async () => {
        vi
          .spyOn(upload, 'uploadGlobToPrefix')
          .mockResolvedValueOnce(['/fake-path/file-a'])

        await main()

        expect(github.setGithubActionOutputFromResults).toHaveBeenCalledWith({
          mode: 'upload',
          absolutePathToFiles: ['/fake-path/file-a']
        })
      })
    })

    describe('download mode', () => {
      beforeEach(() => {
        vi
          .spyOn(github, 'getOptionsFromGithubActionInput')
          .mockReturnValueOnce({
            prefix: 'the-prefix',
            bucketName: 'the-bucket',
            endpoint: 'the-endpoint',
            region: 'the-region',
            credentials: {
              accessKeyId: 'the-access-key',
              secretAccessKey: 'the-secret-access-key'
            },
            mode: 'download',
            destinationFolder: '/destination-folder',
            maxParallelDownloads: 10
          })
      })

      it('should download files', async () => {
        await main()

        expect(download.downloadPrefix).toHaveBeenCalledWith({
          bucketName: 'the-bucket',
          credentials: {
            accessKeyId: 'the-access-key',
            secretAccessKey: 'the-secret-access-key'
          },
          destinationFolder: '/destination-folder',
          endpoint: 'the-endpoint',
          maxParallelDownloads: 10,
          mode: 'download',
          prefix: 'the-prefix',
          region: 'the-region',
          s3: expect.anything()
        })
      })

      it('should set downloaded files as output', async () => {
        vi
          .spyOn(download, 'downloadPrefix')
          .mockResolvedValueOnce(['/fake-path/file-a'])

        await main()

        expect(github.setGithubActionOutputFromResults).toHaveBeenCalledWith({
          mode: 'download',
          absolutePathToFiles: ['/fake-path/file-a']
        })
      })
    })
  })
})
