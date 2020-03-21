import * as express from 'express';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import * as AppModule from './appModule';
import * as AccountsModule from './accountsModule';
import * as ServiceAdmin from './modules/serviceAdmin';
import * as ServiceModule from './serviceModule';
import * as DepositsModule from './depositsModule';
import * as WithdrawalsModule from './withdrawalsModule';
import * as Analytics from './analyticsModule';
import * as WalletManager from './walletManager';
import * as WebhooksModule from './webhookModule';
import { api as serviceApi } from './serviceApi';
import { ServiceUser } from '../../shared/types';
import { ServiceError } from './serviceError';

export const serviceAdmin = ServiceAdmin;
export const apps         = AppModule;
export const accounts     = AccountsModule;
export const deposits     = DepositsModule;
export const withdrawals  = WithdrawalsModule;

// =============================================================================
//                              Initialization
// =============================================================================


admin.initializeApp();

// Create "main" function to host all other top-level functions
const expressApp = express();
expressApp.use('/api', serviceApi);

export const endpoints = functions.https.onRequest(expressApp);

try {
  const appInsightsApiKey = functions.config().azure.appinsights;

  if (appInsightsApiKey) {
    Analytics.initAppInsights(appInsightsApiKey);
  }
} catch (error) {
  // no app insights API key set
}


// =============================================================================
//                              Auth Triggers
// =============================================================================


exports.onServiceUserCreated = functions.auth.user().onCreate(async (user) => {
  await createServiceUser(user);
});

export async function createServiceUser(userRecord: admin.auth.UserRecord): Promise<void> {
  const id = userRecord.uid;

  let displayName = userRecord.displayName;

  if (!displayName) {
    if (userRecord.email) {
      displayName = userRecord.email;
    } else {
      displayName = 'Service user';
    }
  }

  const serviceUser: ServiceUser = {
    id: id,
    displayName: displayName
  }

  if (userRecord.email) {
    serviceUser.email = userRecord.email;
  }

  await admin.firestore().doc(`serviceUsers/${id}`).set(serviceUser);
}


// =============================================================================
//                              Scheduled functions
// =============================================================================


const runtimeOpts: functions.RuntimeOptions = {
  timeoutSeconds: 300,
  memory: "1GB"
}

exports.updateMasterWallet = functions.runWith(runtimeOpts).pubsub.schedule('every 5 minutes').onRun(async (context) => {
  await ServiceModule.updateMasterWallet();
});

exports.rewindServiceWallet = functions.pubsub.schedule('every 2 hours').onRun(async (context) => {
  const fetchResults = await Promise.all([
    WalletManager.getServiceWallet(false),
    WalletManager.getAppEngineToken()
  ]);

  const [serviceWallet, serviceError] = fetchResults[0];
  const [token, tokenError] = fetchResults[1];

  if (!serviceWallet) {
    console.error(`failed to get service wallet: ${(serviceError as ServiceError).message}`);
    return;
  }

  if (!token) {
    console.error(`failed to get app engine token: ${(tokenError as ServiceError).message}`);
    return;
  }

  const rewindDistance  = 480;
  const [wHeight, ,]    = serviceWallet.wallet.getSyncStatus();
  const rewindHeight    = wHeight - rewindDistance;

  console.log(`rewinding wallet to height: ${rewindHeight}`);
  await serviceWallet.wallet.rewind(rewindHeight);

  const [saveTimestamp, saveError] = await WalletManager.saveMasterWallet(serviceWallet.wallet);
  const appEngineRestarted = await WalletManager.startAppEngineWallet(token, serviceWallet.serviceConfig);

  if (saveTimestamp) {
    console.log(`wallet rewind to height ${rewindHeight} successfully saved at: ${saveTimestamp}`);
  } else {
    console.error((saveError as ServiceError).message);
  }

  console.log(`app engine wallet restart successful: ${appEngineRestarted}`);
});

exports.maintenanceJobs = functions.pubsub.schedule('every 12 hours').onRun(async (context) => {
  const [serviceWallet, serviceError] = await WalletManager.getServiceWallet(false);

  if (!serviceWallet) {
    console.error(`failed to get service wallet: ${(serviceError as ServiceError).message}`);
    return;
  }

  const jobs: Promise<any>[] = [];

  jobs.push(WalletManager.backupMasterWallet());
  // jobs.push(AppModule.runAppAudits(10));
  jobs.push(WithdrawalsModule.processLostWithdrawals(serviceWallet));

  await Promise.all(jobs);
});

exports.heartbeat = functions.pubsub.schedule('every 1 minutes').onRun(async (context) => {
  await ServiceModule.updateServiceNodes();
  await ServiceModule.checkNodeSwap();

  const [serviceWallet, error] = await WalletManager.getServiceWallet();

  if (!serviceWallet) {
    console.error(`failed to get service wallet: ${(error as ServiceError).message}`);
    return;
  }

  const updateDeposits    = DepositsModule.updateDeposits(serviceWallet);
  const updateWithdrawals = WithdrawalsModule.updateWithdrawals(serviceWallet);

  await Promise.all([updateDeposits, updateWithdrawals]).catch(e => {
    console.error(e);
  });

  const retryCallbacks = WebhooksModule.retryCallbacks();
  const processCharges = ServiceModule.processServiceCharges();

  await Promise.all([retryCallbacks, processCharges]).catch(e => {
    console.error(e);
  });
});
