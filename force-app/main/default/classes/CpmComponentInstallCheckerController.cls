public with sharing class CpmComponentInstallCheckerController {
    
    @AuraEnabled
    public static void runApex(boolean forcedRefresh){ 
        System.debug('Running CPMInstallCheckerController.runApex');
        List<AsyncApexJob> existingJobs;

        Cpm_Server_Settings__c appSetting = new Cpm_Server_Settings__c();
        List<Cpm_Server_Settings__c> appSettings = [SELECT Id, Last_Library_Refresh_Date__c FROM Cpm_Server_Settings__c];

        if(appSettings.size() == 0){
            System.debug('Initializing appSettings');
            insert appSetting;
        }else{
            appSetting = appSettings[0];
        }


        DateTime now = datetime.now();
        DateTime yesterday = now.addDays(-1);

        if(appSetting.Last_Library_Refresh_Date__c == null || appSetting.Last_Library_Refresh_Date__c < yesterday  || forcedRefresh){
            System.debug('Running refresh');
            appSetting.Last_Library_Refresh_Date__c = datetime.now();
            update appSetting;
            
            CpmQGetInstalledPackages queueGetInstalledPackagesJob = new CpmQGetInstalledPackages();
            existingJobs = [SELECT Id, ApexClass.Name, Status FROM AsyncApexJob WHERE Status IN ('Holding','Queued','Preparing','Processing') AND ApexClass.Name = :queueGetInstalledPackagesJob.getJobInfo(CpmAsyncEventHelper.FIELD_APEX_CLASS_NAME) LIMIT 1];
            if (existingJobs.size() == 0){
                System.debug('Running queueGetInstalledPackagesJob');
                System.enqueueJob(queueGetInstalledPackagesJob);
            }
            CpmVersionHelper.getinstalledXTAGs(null);
        }else{
            System.debug('Not Running refresh');
        }
    }

    @AuraEnabled
    public static Cpm_Server_Settings__c getAppSettings(){ 
        System.debug('Running CPMInstallCheckerController.getAppSettings');
        return CpmServerCustomSettingHelper.getAppSettings();
    }    
}