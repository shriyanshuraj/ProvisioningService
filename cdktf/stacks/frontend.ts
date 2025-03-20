import { AwsProvider } from '@cdktf/provider-aws';
import { AcmCertificate } from '@cdktf/provider-aws/lib/acm';
import { CloudfrontDistribution, CloudfrontOriginAccessIdentity } from '@cdktf/provider-aws/lib/cloudfront';
import { Route53Record, Route53Zone } from '@cdktf/provider-aws/lib/route53';
import { S3Bucket, S3BucketPolicy } from '@cdktf/provider-aws/lib/s3';
import { TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

export class FrontendStack extends TerraformStack {
  constructor(scope: Construct, id: string, appName: string, envName: string) {
    super(scope, id);

    new AwsProvider(this, 'AWS', {
      region: process.env.AWS_REGION,
    });

    const bucketName = `s3-bucket-${appName}-${envName}`;
    const domainName = `${envName}.${process.env.DOMAIN_NAME}`;

    // S3 Bucket for Static Website
    const s3Bucket = new S3Bucket(this, 'FrontendBucket', {
      bucket: bucketName,
      // Remove public-read ACL
      website: {
        indexDocument: 'index.html',
        errorDocument: 'index.html'
      },
    });

    // Create CloudFront OAI
    const originAccessIdentity = new CloudfrontOriginAccessIdentity(this, 'OAI', {
      comment: `OAI for ${domainName}`,
    });

    // Update Bucket Policy to only allow CloudFront access
    new S3BucketPolicy(this, 'BucketPolicy', {
      bucket: s3Bucket.getStringAttribute("bucket"),
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'AllowCloudFrontAccess',
            Effect: 'Allow',
            Principal: {
              AWS: originAccessIdentity.iamArn,
            },
            Action: ['s3:GetObject'],
            Resource: [`${s3Bucket.arn}/*`],
          },
        ],
      }),
    });

    // ACM Certificate for HTTPS
    const certificate = new AcmCertificate(this, 'Certificate', {
      domainName,
      validationMethod: 'DNS',
    });

    // Route 53 - DNS Validation for ACM
    const zone = new Route53Zone(this, 'HostedZone', {
      name: process.env.DOMAIN_NAME!,
    });

    new Route53Record(this, 'DnsValidation', {
      zoneId: zone.zoneId,
      name: domainName,
      type: 'CNAME',
      records: [certificate.domainValidationOptions.get(0).resourceRecordName],
      ttl: 300,
    });

    // CloudFront Distribution
    const distribution = new CloudfrontDistribution(this, 'CloudFront', {
      enabled: true,
      defaultRootObject: 'index.html',
      aliases: [domainName],
      priceClass: 'PriceClass_100',
      origin: [
        {
          domainName: s3Bucket.bucketRegionalDomainName,
          originId: 'S3Origin',
          s3OriginConfig: {
            originAccessIdentity: originAccessIdentity.cloudfrontAccessIdentityPath,
          },
        },
      ],
      viewerCertificate: {
        acmCertificateArn: certificate.arn,
        sslSupportMethod: 'sni-only',
        minimumProtocolVersion: 'TLSv1.2_2021',
      },
      defaultCacheBehavior: {
        targetOriginId: 'S3Origin',
        viewerProtocolPolicy: 'redirect-to-https',
        allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
        cachedMethods: ['GET', 'HEAD', 'OPTIONS'],
        forwardedValues: {
          queryString: false,
          cookies: { forward: 'none' },
        },
        minTtl: 0,
        defaultTtl: 3600,
        maxTtl: 86400,
        compress: true,
      },
      restrictions: {
        geoRestriction: {
          restrictionType: 'none',
          locations: [],
        },
      },
      customErrorResponse: [
        {
          errorCode: 403,
          responseCode: 200,
          responsePagePath: '/index.html',
        },
        {
          errorCode: 404,
          responseCode: 200,
          responsePagePath: '/index.html',
        },
      ],
    });

    // DNS Record to Point to CloudFront
    new Route53Record(this, 'AliasRecord', {
      zoneId: zone.zoneId,
      name: domainName,
      type: 'A',
      alias: [
        {
          name: distribution.domainName,
          zoneId: distribution.hostedZoneId,
          evaluateTargetHealth: false,
        },
      ],
    });
  }
}
