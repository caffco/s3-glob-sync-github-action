[![Maintainability](https://api.codeclimate.com/v1/badges/c3e53e2a559017ec4abf/maintainability)](https://codeclimate.com/github/caffco/s3-glob-sync-github-action/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/c3e53e2a559017ec4abf/test_coverage)](https://codeclimate.com/github/caffco/s3-glob-sync-github-action/test_coverage)

# S3 Glob Sync

> Sync globs with AWS S3.

## About

This action works with any S3-compatible service like [Digital Ocean Spaces](https://www.digitalocean.com/products/spaces/) or [AWS S3](https://aws.amazon.com/s3/) and allows you to sync globs with it.

### How it works

This action has 2 modes: `upload` and `download`.

In `upload` mode you should provide a list of patterns and a prefix and all the files matching the patterns will be uploaded to the S3 bucket, with the proper prefix.

In `download` mode you should provide a prefix and a destination folder. All the objects prefixed with that prefix will be downloaded to the desired destination folder.

Note that this action will not delete your objects or files in any case.

## Usage

```yml
name: Test
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: yarn test
      - name: Upload artifacts
        uses: caffco/s3-glob-sync-github-action@v1.0.0
        with:
          prefix: my-prefix
          bucket_name: mybucket
          endpoint: mybucket.s3-us-west-2.amazonaws.com
          region: us-west-2
          access_key_id: ${{ secrets.S3_ACCESS_KEY_ID }}
          secret_access_key: ${{ secrets.S3_SECRET_ACCESS_KEY }}
          mode: upload
          acl: private
          patterns: |
            coverage/**
            reports/**
```

```yml
name: Consume tests
on:
  push:
    branches:
      - main
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Download artifacts
        uses: caffco/s3-glob-sync-github-action@v1.0.0
        with:
          prefix: my-prefix
          bucket_name: mybucket
          endpoint: mybucket.s3-us-west-2.amazonaws.com
          region: us-west-2
          access_key_id: ${{ secrets.S3_ACCESS_KEY_ID }}
          secret_access_key: ${{ secrets.S3_SECRET_ACCESS_KEY }}
          mode: download
          destination_folder: pr-artifacts
      - name: Do something with artifacts
        run: # Do something…
```
