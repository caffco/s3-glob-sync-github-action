import fs from 'fs'
import * as glob from '@actions/glob'
import {S3, ObjectCannedACL} from '@aws-sdk/client-s3'
import {getChunked} from './chunk'

const uploadSingleFile = async ({
  acl,
  absolutePathToFile,
  bucketName,
  prefix,
  s3
}: {
  acl: ObjectCannedACL
  absolutePathToFile: string
  bucketName: string
  prefix: string
  s3: S3
}): Promise<void> => {
  const buffer = await new Promise<Buffer>((resolve, reject) =>
    fs.readFile(absolutePathToFile, (error, data) =>
      error ? reject(error) : resolve(data)
    )
  )

  await s3.putObject({
    Bucket: bucketName,
    Key: `${prefix}${absolutePathToFile}`,
    Body: buffer,
    ACL: acl
  })
}

export const uploadGlobToPrefix = async ({
  acl,
  patterns,
  bucketName,
  prefix,
  s3,
  maxParallelUploads
}: {
  acl: ObjectCannedACL
  patterns: string[]
  bucketName: string
  prefix: string
  s3: S3
  maxParallelUploads: number
}): Promise<string[]> => {
  const globber = await glob.create(patterns.join('\n'))
  const absolutePathsToUpload = await globber.glob()

  const chunks = getChunked(absolutePathsToUpload, maxParallelUploads)

  for (const singleChunk of chunks) {
    await Promise.all(
      singleChunk.map(
        async absolutePathToFile =>
          await uploadSingleFile({
            acl,
            absolutePathToFile,
            bucketName,
            prefix,
            s3
          })
      )
    )
  }

  return absolutePathsToUpload
}
