# Deploys a container with an image on AWS Fargate two ways!

Deploys an AWS Fargate service.
1. Method one is the OG. It wraps the original Pulumi IaC code that uses dockerBuild and runs it in Dagger.
2. Method two, breaks up the original IaC into a separate `ecr` stack and a `fargate` stack. Dagger will do a build of Nginx running the Dagger docs site (using Docusaurus) and push the image to ECR. Dagger orchestrates the running of the whole thing including bringing up Pulumi, etc. You don't need to have Pulumi installed already! You just need Dagger installed and a way to run containers (such as Docker Desktop, Rancher Desktop, Lima/Colima/Nerdctl, Podman, etc). ESC is used to store values like `ecrRepo` and `imageURL` to allow both Pulumi and Dagger functions (all orchestrated by Dagger) to work together.

Last revision: August 2024.

## 📋 Pre-requisites

- Dagger CLI: https://docs.dagger.io/install
- Pulumi Token called `PULUMI_TOKEN` available in your environment (local or CI)
- ~~[Pulumi CLI](https://www.pulumi.com/docs/get-started/install/)~~ Not needed, Dagger Pulumi module will provide
- ~~*Recommended*~~ Required since we're using ESC [Pulumi Cloud account](https://app.pulumi.com/signup) Create an ESC environment called `aws-ecs-demo` and setup AWS OIDC integration (see below) as well as put the following under `values: pulumiConfig:` in your ESC Environment definition:
```
ecrTag: latest
awsRegion: us-east-2
awsAcctId: '<your account id number>'
```
- ~~[npm](https://www.npmjs.com/get-npm)~~ Not needed, Dagger will provide
- ~~AWS account and credentials configured~~ Use [Pulumi ESC's AWS OIDC integration](https://www.pulumi.com/docs/pulumi-cloud/oidc/provider/aws/)
- Docker desktop (or similar) ~~with a default builder.~~ (build handled by Dagger)

## 🎬 How to run

To deploy your infrastructure, run:

```bash
$ dagger call deploy --source=. --token=env:PULUMI_TOKEN 
# wait a bit for everything to get deployed
# ...
# confirm your service is up and running
# by navigating to load balancer URL emitted :)
# 🎉 Ta-Da!
```

## 🧹 Clean up

To clean up your infrastructure, run:

For the more complex `deploy()` function
```bash
$ dagger call destroy --source=. --token=env:PULUMI_TOKEN
```

For the all-in-one `og()` function:
```bash
$ dagger call destroy-og --source=. --token=env:PULUMI_TOKEN
```
