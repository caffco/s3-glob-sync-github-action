import {S3} from '@aws-sdk/client-s3-node'
import {
  Mode,
  getOptionsFromGithubActionInput,
  setGithubActionOutputFromResults
} from './github'
import {uploadGlobToPrefix} from './upload'
import {downloadPrefix} from './download'

const run = async <
  ActionInput,
  Action extends (options: ActionInput) => Promise<string[]>
>({
  mode,
  options,
  action
}: {
  mode: Mode
  options: ActionInput
  action: Action
}): Promise<void> => {
  const absolutePathToFiles = await action(options)

  setGithubActionOutputFromResults({
    mode,
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
      await run({
        mode: options.mode,
        options: {...options, s3},
        action: uploadGlobToPrefix
      })
      break

    case 'download':
      await run({
        mode: options.mode,
        options: {...options, s3},
        action: downloadPrefix
      })
      break
  }
}
