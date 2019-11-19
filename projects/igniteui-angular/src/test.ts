// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import 'core-js/es7/reflect';
import 'zone.js/dist/zone';
import 'zone.js/dist/zone-testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';
import { HammerModule } from '@angular/platform-browser';

declare const require: any;

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  // D.P. HammerModule required for tests that simulate and expect recognizers to be active (host bound tap, etc)
  [BrowserDynamicTestingModule, HammerModule],
  platformBrowserDynamicTesting()
);
// Then we find all the tests.
const context = require.context('./', true, /\.spec\.ts$/);
// And load the modules.
context.keys().map(context);

// configureTestSuite();

jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
