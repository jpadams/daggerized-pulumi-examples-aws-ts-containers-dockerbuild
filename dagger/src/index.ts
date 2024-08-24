/**
 * Deploy with Pulumi and Dagger
 */
import { dag, Container, Directory, Secret, object, func, Platform } from "@dagger.io/dagger"

@object()
class AwsTsContainersDagger {
  /**
   * Pulumi up ECR repo: uses ESC OIDC for AWS creds & ESC to store repo name
   */
  @func()
  async upEcr(source: Directory, token: Secret): Promise<string> {
    const env = "jeremy-dagger-demo/aws-ecs-demo";
    const stack = "ecr";
    const config = dag.esc().withEnv(env).withToken(token);
    const pul = dag.pulumi().withPulumiToken(token).withEsc(env);

    await pul.up(source, stack);
    const repo = (await pul.output(source, "repo", stack)).trim();
    config.setConfig("ecrRepo", repo);
    return repo;
  }

  /**
   * Pulumi up ECS Fargate resources: uses ESC OIDC for AWS creds & ESC to store app URL
   */
  @func()
  async upFargate(source: Directory, token: Secret): Promise<string> {
    const env = "jeremy-dagger-demo/aws-ecs-demo";
    const stack = "fargate";
    const config = dag.esc().withEnv(env).withToken(token);
    const pul = dag.pulumi().withPulumiToken(token).withEsc(env);
    
    await pul.up(source, stack);
    const url = (await pul.output(source, "url", stack)).trim();
    config.setConfig("url", url);
    return url;
  }

  /**
   * Build the Dagger docs site using Docusaurus and cross-arch Nginx image
   */
  @func()
  build(): Container {
    const docs = dag.git("https://github.com/dagger/dagger").branch("main").tree()
    const site = dag.docusaurus(docs, {dir: "/src/docs"}).build()
    
    return dag.container({platform: "linux/amd64" as Platform})
    .from("nginx")
    .withDirectory("/usr/share/nginx/html", site)
    .withExposedPort(80);
  }

  /**
   * Orchestrate Pulumi and Dagger to deploy the app
   */
  @func()
   async deploy(source: Directory, token: Secret): Promise<string> {
    const env = "jeremy-dagger-demo/aws-ecs-demo";
    const config = dag.esc().withEnv(env).withToken(token); // my ESC module
    const ecrTag = await config.getConfig("ecrTag");
    const awsRegion = await config.getConfig("awsRegion");
    const awsAcctId = await config.getConfig("awsAcctId");

    const opened = config.open(); // Pulumi `esc env ${env} open`
    const awsAccessKey = opened.getSecretEnvVar("AWS_ACCESS_KEY_ID");
    const awsSecretKey = opened.getSecretEnvVar("AWS_SECRET_ACCESS_KEY");
    const awsSessionToken = opened.getSecretEnvVar("AWS_SESSION_TOKEN");

    // pulumi up --stack ecr
    const ecrRepo = await this.upEcr(source.directory("ecr"), token);

    // push image(s) to ECR
    const images = await dag.awsEcr().withCredentials(
      {
        accessKey: awsAccessKey,
        secretKey: awsSecretKey,
        sessionToken: awsSessionToken,
        region: awsRegion,
      })
      .push(
        this.build(), //the container we'll build and push
        awsAcctId,
        ecrRepo, // the ECR repo that Pulumi prepared
        {tags: [ecrTag]}
      );
    config.setConfig("imageRef", images[0]); // saving the imageRef to Pulumi ESC

    // pulumi up --stack fargate
    const url = this.upFargate(source.directory("fargate"), token);
    return url;
  }

  /**
   * Tear down ECR and Fargate resources: uses ESC OIDC for AWS creds
   */
  @func()
  async destroy(source: Directory, token: Secret): Promise<string> {
    const env = "jeremy-dagger-demo/aws-ecs-demo";
    const stacks = ["ecr", "fargate"];
    const pul = dag.pulumi().withPulumiToken(token).withEsc(env);
    let output = "";
    stacks.forEach(async stack => {
      output += await pul.destroy(source.directory(stack), stack)
    });
    return output;
  }

  /**
   * Tear down original all-in-one stack
   */
  @func()
  async destroyOg(source: Directory, token: Secret): Promise<string> {
    const env = "jeremy-dagger-demo/aws-ecs-demo";
    const pul = dag.pulumi().withPulumiToken(token).withEsc(env);
    return await pul.destroy(source, "dev")
  }

  /**
    * Original all-in-one docker build example with Dagger-provided Docker Engine
    */
  @func()
  async og(source: Directory, token: Secret): Promise<string> {
      const env = "jeremy-dagger-demo/aws-ecs-demo";
      const stack = "dev";

      const pul = dag.pulumi().withPulumiToken(token).withEsc(env).withDocker();
      await pul.up(source, stack);
      const url = (await pul.output(source, "url", stack)).trim();
      return url;
  }
}
