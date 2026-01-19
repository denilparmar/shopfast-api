#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ShopfastApiStack } from '../lib/shopfast-api-stack';

const app = new cdk.App();
new ShopfastApiStack(app, 'ShopfastApiStack', {
  env: { region: 'us-east-1' },
});
