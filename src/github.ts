import {getInput, setOutput} from '@actions/core'

type Mode = 'upload' | 'download'

interface S3BucketConfig {
  prefix: string
  bucketName: string
  endpoint: string
  region: string
  credentials: {
    accessKeyId: string
    secretAccessKey: string
  }
}

export type ACL =
  | 'private'
  | 'public-read'
  | 'public-read-write'
  | 'aws-exec-read'
  | 'authenticated-read'
  | 'bucket-owner-read'
  | 'bucket-owner-full-control'
  | 'log-delivery-write'

export function getOptionsFromGithubActionInput(): S3BucketConfig &
  (
    | {
        mode: 'upload'
        patterns: string[]
        maxParallelUploads: number
        acl: ACL
      }
    | {
        mode: 'download'
        destinationFolder: string
        maxParallelDownloads: number
      }
  ) {
  const mode = getInput('mode') as Mode

  const s3BucketConfig: S3BucketConfig = {
    prefix: getInput('prefix'),
    bucketName: getInput('bucket_name'),
    endpoint: getInput('endpoint'),
    region: getInput('region'),
    credentials: {
      accessKeyId: getInput('access_key_id'),
      secretAccessKey: getInput('secret_access_key')
    }
  }

  switch (mode) {
    case 'upload':
      return {
        ...s3BucketConfig,
        mode,
        acl: (getInput('acl') as ACL | '') || 'private',
        patterns: getInput('patterns').split('\n'),
        maxParallelUploads: parseInt(getInput('max_parallel_uploads')) || 10
      }
    case 'download':
      return {
        ...s3BucketConfig,
        mode,
        destinationFolder: getInput('destination_folder'),
        maxParallelDownloads: parseInt(getInput('max_parallel_downloads')) || 10
      }
  }
}

export function setGithubActionOutputFromResults({
  mode,
  absolutePathToFiles
}: {
  mode: Mode
  absolutePathToFiles: string[]
}): void {
  switch (mode) {
    case 'upload':
      setOutput('uploaded_files', absolutePathToFiles)
      break
    case 'download':
      setOutput('downloaded_files', absolutePathToFiles)
      break
  }
}
