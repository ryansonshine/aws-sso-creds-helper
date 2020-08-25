# AWS SSO Credentials Helper

[![npm package][npm-img]][npm-url]
[![Build Status][build-img]][build-url]
[![Downloads][downloads-img]][downloads-url]
[![Issues][issues-img]][issues-url]
[![Code Coverage][codecov-img]][codecov-url]

When using `aws sso login` on [AWS CLI v2](https://aws.amazon.com/blogs/developer/aws-cli-v2-is-now-generally-available/)
as of July 27th, 2020, the credentials are stored so they will work with the CLI
itself (v2) but don't work on the AWS SDKs and other tools that expect credentials
to be readable from `~/.aws/credentials` (v1).

This package aims to streamline updating the AWS credentials file for AWS SSO users by
updating/creating the corresponding profile section in `~/.aws/credentials` with
temporary role credentials. Once a solution is implemented in AWS CLI v2, this
repo will be archived.

## Install

```sh
$ npm install -g aws-sso-creds-helper
```

## Usage

```sh
Usage: ssocreds [options]

Options:
  -V, --version            output the version number
  -p, --profile <profile>  profile to use for obtaining sso credentials (default: "default")
  -d, --debug              enables verbose logging (default: false)
  -u, --use-proxy          flag for the aws sdk to use HTTPS_PROXY found in env (default: false)
  -h, --help               display help for command
```

Example:

```sh
$ ssocreds -p my-profile

[aws-sso-creds-helper]: Getting SSO credentials for profile my-profile
[aws-sso-creds-helper]: Successfully loaded SSO credentials for profile my-profile
```

or create an alias in your shell containing

```sh
alias awsmyprofile="ssocreds -p my-profile"
```

or combine with a [profile switching script](https://github.com/antonbabenko/awsp)
if you use multiple profiles to switch profiles and then grab the credentials in one command

```sh
alias awsmyprofile="awsp my-profile && ssocreds -p my-profile"
```

[build-img]:https://travis-ci.com/ryansonshine/aws-sso-creds-helper.svg?branch=master
[build-url]:https://travis-ci.com/ryansonshine/aws-sso-creds-helper
[downloads-img]:https://img.shields.io/npm/dw/aws-sso-creds-helper
[downloads-url]:https://www.npmtrends.com/aws-sso-creds-helper
[npm-img]:https://img.shields.io/npm/v/aws-sso-creds-helper
[npm-url]:https://www.npmjs.com/package/aws-sso-creds-helper
[issues-img]:https://img.shields.io/github/issues/ryansonshine/aws-sso-creds-helper
[issues-url]:https://github.com/ryansonshine/aws-sso-creds-helper/issues
[codecov-img]:https://codecov.io/gh/ryansonshine/aws-sso-creds-helper/branch/master/graph/badge.svg
[codecov-url]:https://codecov.io/gh/ryansonshine/aws-sso-creds-helper
