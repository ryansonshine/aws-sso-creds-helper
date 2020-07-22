# AWS SSO Credentials Helper (WIP)

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
npm start my-profile-name
```

or create an alias in your shell containing

```sh
alias aws_my_profile="node <absolutePathToRepo>/lib/index.js my-profile"
```

## TODOs

- [ ] Add as CLI bin
- [ ] Publish npm package
- [ ] Tests
- [ ] Look into using `credential_process`
- [ ] Refactor types
