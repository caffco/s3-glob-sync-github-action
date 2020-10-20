import {S3} from '@aws-sdk/client-s3-node'
import {
  getOptionsFromGithubActionInput,
  setGithubActionOutputFromResults
} from './github'
import {uploadGlobToPrefix} from './upload'
import {downloadPrefix} from './download'

const upload = async (
  options: Parameters<typeof uploadGlobToPrefix>[0]
): Promise<void> => {
  const absolutePathToFiles = await uploadGlobToPrefix(options)

  setGithubActionOutputFromResults({
    mode: 'upload',
    absolutePathToFiles
  })
}

const download = async (
  options: Parameters<typeof downloadPrefix>[0]
): Promise<void> => {
  const absolutePathToFiles = await downloadPrefix(options)

  setGithubActionOutputFromResults({
    mode: 'download',
    absolutePathToFiles
  })
}

export default async function main(): Promise<void> {
  const options = getOptionsFromGithubActionInput()

  const s3 = new S3({
    endpoint: options.endpoint,
    region: options.region,
    credentials: {
      accessKeyId: options.credentials.accessKeyId,
      secretAccessKey: options.credentials.secretAccessKey
    }
  })

  switch (options.mode) {
    case 'upload':
      await upload({...options, s3})
      break

    case 'download':
      await download({...options, s3})
      break
  }
}
