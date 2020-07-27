# AWS SSO Credentials Helper

When using `aws sso login` on [AWS CLI v2](https://aws.amazon.com/blogs/developer/aws-cli-v2-is-now-generally-available/)
as of July 27th, 2020, the credentials are stored so they will work with the CLI
itself but are do not work on the AWS SDKs and other tooling that expects credentials
to be readable from `~/.aws/credentials`.

This package aims to streamline updating the AWS credentials file for AWS SSO users by
updating/creating the corresponding profile section in `~/.aws/credentials` with
temporary role credentials. Once a solution is implemented in AWS CLI v2, this
repo will be archived.

## Install

```sh
$ npm install -g aws-sso-creds-helper
```

## Usage

Example usage:

```sh
$ aws-sso-creds-helper --profile my-profile

[aws-sso-creds-helper]: Getting SSO credentials for profile my-profile
[aws-sso-creds-helper]: Successfully loaded SSO credentials for profile my-profile
```

or create an alias in your shell containing

```sh
alias awsmyprofile="aws-sso-creds-helper --profile my-profile"
```

or combine with a [profile switching script](https://github.com/antonbabenko/awsp)
if you use multiple profiles to switch profiles and then grab the credentials in one command

```sh
alias awsmyprofile="awsp my-profile && aws-sso-creds-helper --profile my-profile"
```

## TODOs

- [x] Create cli module
- [x] Add as CLI bin
- [x] Publish npm package
- [ ] Tests
- [ ] Look into using `credential_process`
- [ ] Implement automated headless `aws sso login`
