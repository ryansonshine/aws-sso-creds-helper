# AWS SSO Credentials Helper

When using `aws sso login` on AWS CLI v2 the credentials are stored in `~/.aws/cli/cache`.
This works fine with the CLI itself but is not picked up by other libraries expecting them
to be in `~/.aws/credentials` (ie: aws-sdk and Terraform).

This script aims to streamline updating the AWS credentials file for AWS SSO users by
updating/creating the corresponding profile section in `~/.aws/credentials` containing
the `aws_access_key_id`, `aws_secret_access_key`, and `aws_session_token`.

## Requirements

## Quick Start

```sh
npm install
```

## Usage

Example usage:

```sh
node ./lib/index.js my-profile
```

or create an alias in your shell containing

```sh
alias awsmyprofile="node <absolutePathToRepo>/aws-sso-creds-helper/lib/index.js my-profile"
```

or combine with a [profile switching script](https://github.com/antonbabenko/awsp)
if you use multiple profiles to switch profiles and then grab the credentials in one command

```sh
alias awsmyprofile="_awsSetProfile my-profile && node <absolutePathToRepo>/aws-sso-creds-helper/lib/index.js my-profile"
```

## TODOs

- [ ] Create cli module
- [ ] Add as CLI bin
- [ ] Publish npm package
- [ ] Tests
- [ ] Look into using `credential_process`
- [ ] Refactor types
