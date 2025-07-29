import * as core from '@actions/core'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {
  getOptionsFromGithubActionInput,
  setGithubActionOutputFromResults
} from './github'

vi.mock('@actions/core')

describe('Github', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('#getOptionsFromGithubActionInput', () => {
    const mockGetInput = (overridenKeys: Record<string, string> = {}) =>
      vi.spyOn(core, 'getInput').mockImplementation(
        key =>
          (
            ({
              prefix: 'the-prefix',
              bucket_name: 'my-bucket',
              endpoint: 'custom-endpoint',
              region: 'the-region',
              access_key_id: 'my access key id',
              secret_access_key: 'my secret access key',
              ...overridenKeys
            }) as Record<string, string>
          )[key]
      )

    beforeEach(() => {
      mockGetInput()
    })

    it('should return proper values in `upload` mode', () => {
      mockGetInput({
        mode: 'upload',
        acl: 'public-read',
        patterns: 'my patterns',
        max_parallel_uploads: '42'
      })

      expect(getOptionsFromGithubActionInput()).toEqual({
        prefix: 'the-prefix',
        bucketName: 'my-bucket',
        endpoint: 'custom-endpoint',
        region: 'the-region',
        credentials: {
          accessKeyId: 'my access key id',
          secretAccessKey: 'my secret access key'
        },
        mode: 'upload',
        acl: 'public-read',
        patterns: ['my patterns'],
        maxParallelUploads: 42
      })
    })

    it('should default ACL to private in `upload` mode', () => {
      mockGetInput({
        mode: 'upload',
        patterns: 'my patterns',
        max_parallel_uploads: '42'
      })

      expect(getOptionsFromGithubActionInput()).toEqual({
        prefix: 'the-prefix',
        bucketName: 'my-bucket',
        endpoint: 'custom-endpoint',
        region: 'the-region',
        credentials: {
          accessKeyId: 'my access key id',
          secretAccessKey: 'my secret access key'
        },
        mode: 'upload',
        acl: 'private',
        patterns: ['my patterns'],
        maxParallelUploads: 42
      })
    })

    it('should default max parallel uploads to 10', () => {
      mockGetInput({
        mode: 'upload',
        patterns: 'my patterns'
      })

      expect(getOptionsFromGithubActionInput()).toEqual({
        prefix: 'the-prefix',
        bucketName: 'my-bucket',
        endpoint: 'custom-endpoint',
        region: 'the-region',
        credentials: {
          accessKeyId: 'my access key id',
          secretAccessKey: 'my secret access key'
        },
        mode: 'upload',
        acl: 'private',
        patterns: ['my patterns'],
        maxParallelUploads: 10
      })
    })

    it('should return proper values in `download` mode', () => {
      mockGetInput({
        mode: 'download',
        destination_folder: '/destination-folder',
        max_parallel_downloads: '100'
      })

      expect(getOptionsFromGithubActionInput()).toEqual({
        prefix: 'the-prefix',
        bucketName: 'my-bucket',
        endpoint: 'custom-endpoint',
        region: 'the-region',
        credentials: {
          accessKeyId: 'my access key id',
          secretAccessKey: 'my secret access key'
        },
        mode: 'download',
        destinationFolder: '/destination-folder',
        maxParallelDownloads: 100
      })
    })

    it('should default max parallel downloads to 10 in `download` mode', () => {
      mockGetInput({
        mode: 'download',
        destination_folder: '/destination-folder'
      })

      expect(getOptionsFromGithubActionInput()).toEqual({
        prefix: 'the-prefix',
        bucketName: 'my-bucket',
        endpoint: 'custom-endpoint',
        region: 'the-region',
        credentials: {
          accessKeyId: 'my access key id',
          secretAccessKey: 'my secret access key'
        },
        mode: 'download',
        destinationFolder: '/destination-folder',
        maxParallelDownloads: 10
      })
    })
  })

  describe('#setGithubActionOutputFromResults', () => {
    it('should set proper output in `upload` mode', async () => {
      setGithubActionOutputFromResults({
        mode: 'upload',
        absolutePathToFiles: ['file-a']
      })

      expect(core.setOutput).toHaveBeenCalledWith('uploaded_files', ['file-a'])
    })

    it('should set proper output in `download` mode', async () => {
      setGithubActionOutputFromResults({
        mode: 'download',
        absolutePathToFiles: ['file-a']
      })

      expect(core.setOutput).toHaveBeenCalledWith('downloaded_files', [
        'file-a'
      ])
    })
  })
})
