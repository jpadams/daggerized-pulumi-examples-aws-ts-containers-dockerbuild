// Edited by Jeremy Adams, Dagger (dagger.io)
// Copyright 2024, Pulumi Corporation.  All rights reserved.

// Import required libraries
import * as awsx from "@pulumi/awsx";
import * as pulumi from "@pulumi/pulumi"; // Required for Config and interpolation

// Read the current stack configuration, see Pulumi.ecr.yaml file
const config = new pulumi.Config();

// An ECR repository to store our application's container image.
const ecr = new awsx.ecr.Repository("repo", {
    forceDelete: true,
});

export const repo = ecr.repository.name;