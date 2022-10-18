import {resolve as resolvePath, dirname} from 'path'
import fs from 'fs'
import mkdirp from 'mkdirp'
import {S3} from '@aws-sdk/client-s3'
import type {_Object} from '@aws-sdk/client-s3'
import {Readable} from 'stream'

const downloadSingleFile = async ({
  destinationFolder,
  key,
  bucketName,
  prefix,
  s3
}: {
  destinationFolder: string
  key: string
  bucketName: string
  prefix: string
  s3: S3
}): Promise<string> => {
  const absolutePathToFile = resolvePath(
    destinationFolder,
    key.substring(prefix.length)
  )

  mkdirp.sync(dirname(absolutePathToFile))

  const remoteObject = await s3.getObject({
    Bucket: bucketName,
    Key: key
  })

  const readStream = remoteObject.Body as Readable

  if (!readStream) {
    throw new Error(
      `Attempt to fetch object with key «${key}» on bucket «${bucketName}» returned invalid empty body: «${readStream}»`
    )
  }

  const writeStream = fs.createWriteStream(absolutePathToFile)

  return new Promise((resolve, reject) => {
    readStream.on('error', error => writeStream.emit('error', error))
    writeStream.on('error', reject)
    writeStream.on('finish', () => resolve(absolutePathToFile))
    readStream.pipe(writeStream)
  })
}

const downloadObjects = async ({
  objectsInBucket,
  destinationFolder,
  bucketName,
  prefix,
  s3
}: {
  objectsInBucket: _Object[]
  destinationFolder: string
  bucketName: string
  prefix: string
  s3: S3
}): Promise<string[]> =>
  Promise.all(
    objectsInBucket.map(async singleObjectInBucket => {
      if (!singleObjectInBucket.Key) {
        throw new Error(
          `No key for remote object: ${JSON.stringify(singleObjectInBucket)}`
        )
      }

      return downloadSingleFile({
        destinationFolder,
        key: singleObjectInBucket.Key,
        bucketName,
        prefix,
        s3
      })
    })
  )

const downloadObjectsWithPrefixInPage = async ({
  continuationToken,
  destinationFolder,
  bucketName,
  prefix,
  s3,
  maxParallelDownloads
}: {
  continuationToken?: string
  destinationFolder: string
  bucketName: string
  prefix: string
  s3: S3
  maxParallelDownloads: number
}): Promise<
  {absolutePathsToDownloadedFiles: string[]} & (
    | {
        nextContinuationToken: string
        hasNextPage: true
      }
    | {
        nextContinuationToken: undefined
        hasNextPage: false
      }
  )
> => {
  const {
    Contents: objectsInBucket,
    NextContinuationToken: nextContinuationToken,
    IsTruncated: hasNextPage
  } = await s3.listObjectsV2({
    ContinuationToken: continuationToken,
    Bucket: bucketName,
    Prefix: prefix,
    MaxKeys: maxParallelDownloads
  })

  if (!objectsInBucket) {
    throw new Error(
      `No objects with prefix «${prefix}» found in bucket «${bucketName}»`
    )
  }

  const absolutePathsToDownloadedFiles = await downloadObjects({
    objectsInBucket,
    destinationFolder,
    bucketName,
    prefix,
    s3
  })

  if (hasNextPage) {
    if (!nextContinuationToken) {
      throw new Error(
        'Response has next page but no continuation token was provided'
      )
    }

    return {
      hasNextPage: true,
      nextContinuationToken,
      absolutePathsToDownloadedFiles
    }
  }

  return {
    hasNextPage: false,
    nextContinuationToken: undefined,
    absolutePathsToDownloadedFiles
  }
}

export const downloadPrefix = async ({
  destinationFolder,
  bucketName,
  prefix,
  s3,
  maxParallelDownloads
}: {
  destinationFolder: string
  bucketName: string
  prefix: string
  s3: S3
  maxParallelDownloads: number
}): Promise<string[]> => {
  const absolutePathsToDownloadedFiles: string[] = []
  let continuationToken: string | undefined = undefined

  do {
    const currentPageResult: {
      nextContinuationToken: string | undefined
      absolutePathsToDownloadedFiles: string[]
    } = await downloadObjectsWithPrefixInPage({
      continuationToken,
      destinationFolder,
      bucketName,
      prefix,
      s3,
      maxParallelDownloads
    })

    continuationToken = currentPageResult.nextContinuationToken
    absolutePathsToDownloadedFiles.push(
      ...currentPageResult.absolutePathsToDownloadedFiles
    )
  } while (continuationToken)

  return absolutePathsToDownloadedFiles
}
