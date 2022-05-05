# AWS SSO Credentials Helper

[![npm package][npm-img]][npm-url]
[![Build Status][build-img]][build-url]
[![Downloads][downloads-img]][downloads-url]
[![Issues][issues-img]][issues-url]
[![Code Coverage][codecov-img]][codecov-url]
[![Commitizen Friendly][commitizen-img]][commitizen-url]
[![Semantic Release][semantic-release-img]][semantic-release-url]
<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-2-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

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
npm install -g aws-sso-creds-helper
```

## Usage

```sh
Usage: ssocreds [options]

Options:
  -V, --version            output the version number
  -p, --profile <profile>  profile to use for obtaining sso credentials (default: "default")
  -d, --debug              enables verbose logging (default: false)
  -v, --verbose            enables verbose logging (default: false)
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

[build-img]:https://github.com/ryansonshine/aws-sso-creds-helper/actions/workflows/release.yml/badge.svg
[build-url]:https://github.com/ryansonshine/aws-sso-creds-helper/actions/workflows/release.yml
[downloads-img]:https://img.shields.io/npm/dt/aws-sso-creds-helper
[downloads-url]:https://www.npmtrends.com/aws-sso-creds-helper
[npm-img]:https://img.shields.io/npm/v/aws-sso-creds-helper
[npm-url]:https://www.npmjs.com/package/aws-sso-creds-helper
[issues-img]:https://img.shields.io/github/issues/ryansonshine/aws-sso-creds-helper
[issues-url]:https://github.com/ryansonshine/aws-sso-creds-helper/issues
[codecov-img]:https://codecov.io/gh/ryansonshine/aws-sso-creds-helper/branch/master/graph/badge.svg
[codecov-url]:https://codecov.io/gh/ryansonshine/aws-sso-creds-helper
[semantic-release-img]:https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg
[semantic-release-url]:https://github.com/semantic-release/semantic-release
[commitizen-img]:https://img.shields.io/badge/commitizen-friendly-brightgreen.svg
[commitizen-url]:http://commitizen.github.io/cz-cli/

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://ryansonshine.com"><img src="https://avatars.githubusercontent.com/u/9534477?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Ryan Sonshine</b></sub></a><br /><a href="https://github.com/ryansonshine/aws-sso-creds-helper/commits?author=ryansonshine" title="Code">💻</a></td>
    <td align="center"><a href="https://blog.stobias.dev/"><img src="https://avatars.githubusercontent.com/u/590677?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Steven Tobias</b></sub></a><br /><a href="https://github.com/ryansonshine/aws-sso-creds-helper/commits?author=stobias123" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/sclarson"><img src="https://avatars.githubusercontent.com/u/393467?v=4?s=100" width="100px;" alt=""/><br /><sub><b>sclarson</b></sub></a><br /><a href="https://github.com/ryansonshine/aws-sso-creds-helper/commits?author=sclarson" title="Code">💻</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
