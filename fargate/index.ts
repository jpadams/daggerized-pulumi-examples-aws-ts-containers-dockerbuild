// Copyright 2024, Pulumi Corporation.  All rights reserved.

// Import required libraries
import * as aws from "@pulumi/aws"; // Required for ECS
import * as awsx from "@pulumi/awsx";
import * as pulumi from "@pulumi/pulumi"; // Required for Config and interpolation

// Read the current stack configuration, see Pulumi.fargate.yaml file
const config = new pulumi.Config();
const imageRef = config.require("imageRef");

// An ECS cluster to deploy into.
const cluster = new aws.ecs.Cluster("cluster", {});

// An ALB to serve the container endpoint to the internet.
const loadbalancer = new awsx.lb.ApplicationLoadBalancer("loadbalancer", {});

// Deploy an ECS Service on Fargate to host the application container.
const service = new awsx.ecs.FargateService("service", {
    cluster: cluster.arn,
    assignPublicIp: true,
    taskDefinitionArgs: {
        container: {
            name: "service-container",
            image: imageRef,
            cpu: 128,
            memory: 512,
            essential: true,
            portMappings: [{
                containerPort: 80,
                targetGroup: loadbalancer.defaultTargetGroup,
            }],
        },
    },
});

// The URL at which the container's HTTP endpoint will be available.
export const url = pulumi.interpolate`http://${loadbalancer.loadBalancer.dnsName}`;