import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  App,
  Stack,
  CfnResource,
  CfnOutput,
  Duration,
  RemovalPolicy,
  Aspects,
  type IAspect,
} from 'aws-cdk-lib';
import type { IConstruct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cf from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as db from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as apigw from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import {
  DynamoEventSource,
  SqsDlq,
} from 'aws-cdk-lib/aws-lambda-event-sources';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cw from 'aws-cdk-lib/aws-cloudwatch';

class Requirements implements IAspect {
  visit(node: IConstruct): void {
    if (node instanceof CfnResource)
      node.addMetadata('RequirementIds', ['BR-AWS-001']);
  }
}
const app = new App({
  analyticsReporting: false,
  outdir: 'cdk.out',
  context: JSON.parse(readFileSync('cdk.json', 'utf8')).context,
});
const stack = new Stack(app, 'BiribiriMultiplayer', {
  env: { region: 'ap-northeast-1' },
});
const table = new db.Table(stack, 'Rooms', {
  partitionKey: { name: 'code', type: db.AttributeType.STRING },
  billingMode: db.BillingMode.PAY_PER_REQUEST,
  maxReadRequestUnits: 2000,
  maxWriteRequestUnits: 2000,
  timeToLiveAttribute: 'ttl',
  stream: db.StreamViewType.NEW_IMAGE,
  encryption: db.TableEncryption.AWS_MANAGED,
  pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
  deletionProtection: true,
  removalPolicy: RemovalPolicy.RETAIN,
});
// Bind deployment identity to every source byte, locked dependency and packaging rule.
// Installed console-script shebangs contain workstation-specific paths.
const digest = createHash('sha256');
function hashDirectory(directory: string): void {
  for (const entry of readdirSync(directory, { withFileTypes: true }).sort(
    (a, b) => a.name.localeCompare(b.name, 'en'),
  )) {
    if (entry.name === '__pycache__') continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) hashDirectory(path);
    else {
      digest.update(path);
      digest.update(readFileSync(path));
    }
  }
}
hashDirectory('backend/src/app');
for (const path of ['backend/uv.lock', 'scripts/package-lambda.sh']) {
  digest.update(path);
  digest.update(readFileSync(path));
}
digest.update('python3.12-x86_64-manylinux2014-uv0.11.33');
const code = lambda.Code.fromAsset('.build/lambda', {
  assetHash: digest.digest('hex'),
});
function fn(id: string, handler: string): lambda.Function {
  return new lambda.Function(stack, id, {
    runtime: lambda.Runtime.PYTHON_3_12,
    architecture: lambda.Architecture.X86_64,
    handler,
    code,
    memorySize: 512,
    timeout: Duration.seconds(15),
    reservedConcurrentExecutions: id === 'ApiHandler' ? 50 : 10,
    environment: { ROOMS_TABLE: table.tableName, PYTHONHASHSEED: '0' },
    logGroup: new logs.LogGroup(stack, `${id}Logs`, {
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY,
    }),
  });
}
const apiHandler = fn('ApiHandler', 'app.main.handler');
const authorizer = fn('Authorizer', 'app.authorizer.handler');
apiHandler.addToRolePolicy(
  new iam.PolicyStatement({
    actions: ['dynamodb:GetItem', 'dynamodb:PutItem', 'dynamodb:UpdateItem'],
    resources: [table.tableArn],
  }),
);
authorizer.addToRolePolicy(
  new iam.PolicyStatement({
    actions: ['dynamodb:GetItem'],
    resources: [table.tableArn],
  }),
);
const events = new appsync.EventApi(stack, 'Events', {
  apiName: 'biribiri-rooms',
  authorizationConfig: {
    authProviders: [
      {
        authorizationType: appsync.AppSyncAuthorizationType.LAMBDA,
        lambdaAuthorizerConfig: {
          handler: authorizer,
          resultsCacheTtl: Duration.seconds(0),
          validationRegex: '^[A-HJ-NP-Z2-9]{6}:[A-Za-z0-9_-]{43}$',
        },
      },
      { authorizationType: appsync.AppSyncAuthorizationType.IAM },
    ],
    connectionAuthModeTypes: [appsync.AppSyncAuthorizationType.LAMBDA],
    defaultSubscribeAuthModeTypes: [appsync.AppSyncAuthorizationType.LAMBDA],
    defaultPublishAuthModeTypes: [appsync.AppSyncAuthorizationType.IAM],
  },
});
const namespace = events.addChannelNamespace('rooms');
const publisher = fn('Publisher', 'app.publisher.handler');
publisher.addEnvironment('EVENT_HTTP_URL', `https://${events.httpDns}/event`);
publisher.addToRolePolicy(
  new iam.PolicyStatement({
    actions: ['appsync:EventPublish'],
    resources: [namespace.channelNamespaceArn],
  }),
);
const failed = new sqs.Queue(stack, 'FailedEvents', {
  encryption: sqs.QueueEncryption.SQS_MANAGED,
  enforceSSL: true,
  retentionPeriod: Duration.days(14),
});
publisher.addEventSource(
  new DynamoEventSource(table, {
    startingPosition: lambda.StartingPosition.LATEST,
    batchSize: 100,
    retryAttempts: 3,
    bisectBatchOnError: true,
    maxRecordAge: Duration.hours(1),
    onFailure: new SqsDlq(failed),
    filters: [
      lambda.FilterCriteria.filter({
        dynamodb: { NewImage: { state: { B: lambda.FilterRule.exists() } } },
      }),
    ],
  }),
);
new cw.Alarm(stack, 'FailedEventAlarm', {
  metric: failed.metricApproximateNumberOfMessagesVisible(),
  threshold: 1,
  evaluationPeriods: 1,
});
new cw.Alarm(stack, 'ApiErrorAlarm', {
  metric: apiHandler.metricErrors(),
  threshold: 5,
  evaluationPeriods: 1,
});
const http = new apigw.HttpApi(stack, 'HttpApi');
const integration = new HttpLambdaIntegration('FastApi', apiHandler);
for (const [method, path] of [
  [apigw.HttpMethod.GET, '/api/health'],
  [apigw.HttpMethod.GET, '/api/config'],
  [apigw.HttpMethod.POST, '/api/rooms'],
  [apigw.HttpMethod.POST, '/api/rooms/{code}/join'],
  [apigw.HttpMethod.GET, '/api/rooms/{code}'],
  [apigw.HttpMethod.POST, '/api/rooms/{code}/commands'],
] as const)
  http.addRoutes({ path, methods: [method], integration });
const stage = http.defaultStage!.node.defaultChild as apigw.CfnStage;
stage.defaultRouteSettings = {
  throttlingBurstLimit: 500,
  throttlingRateLimit: 300,
};
const bucket = new s3.Bucket(stack, 'Frontend', {
  blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
  enforceSSL: true,
  encryption: s3.BucketEncryption.S3_MANAGED,
  versioned: true,
  removalPolicy: RemovalPolicy.RETAIN,
});
const dynamic = {
  allowedMethods: cf.AllowedMethods.ALLOW_ALL,
  viewerProtocolPolicy: cf.ViewerProtocolPolicy.HTTPS_ONLY,
  cachePolicy: cf.CachePolicy.CACHING_DISABLED,
  originRequestPolicy: cf.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
};
const distribution = new cf.Distribution(stack, 'Distribution', {
  defaultRootObject: 'index.html',
  defaultBehavior: {
    origin: origins.S3BucketOrigin.withOriginAccessControl(bucket),
    viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    responseHeadersPolicy: cf.ResponseHeadersPolicy.SECURITY_HEADERS,
  },
  additionalBehaviors: {
    '/api/*': {
      ...dynamic,
      origin: new origins.HttpOrigin(
        `${http.httpApiId}.execute-api.${stack.region}.${stack.urlSuffix}`,
      ),
    },
    '/event/realtime': {
      ...dynamic,
      origin: new origins.HttpOrigin(events.realtimeDns),
    },
    '/event': { ...dynamic, origin: new origins.HttpOrigin(events.httpDns) },
  },
});
// Relative same-origin WS avoids a CloudFormation cycle between Lambda and CloudFront.
apiHandler.addEnvironment('WEBSOCKET_URL', '/event/realtime');
apiHandler.addEnvironment('EVENT_HTTP_HOST', events.httpDns);
new CfnOutput(stack, 'SiteUrl', {
  value: `https://${distribution.distributionDomainName}`,
});
new CfnOutput(stack, 'FrontendBucket', { value: bucket.bucketName });
new CfnOutput(stack, 'DistributionId', { value: distribution.distributionId });
Aspects.of(stack).add(new Requirements());
app.synth();
