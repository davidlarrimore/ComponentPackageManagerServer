public with sharing class CpmServerCustomSettingHelper {


    public static Cpm_Server_Settings__c getAppSettings(){ 
        System.debug('Running CpmServerCustomSettingHelper.getAppSettings');
        Cpm_Server_Settings__c appSetting = new Cpm_Server_Settings__c();
        List<Cpm_Server_Settings__c> appSettings = [SELECT Id, Last_Library_Refresh_Date__c, Initial_Config_Flag__c, Sandbox_Flag__c, App_Deployer_URL__c FROM Cpm_Server_Settings__c];

        if(appSettings.size() == 0){
            System.debug('No Cpm_Server_Settings__c Found. Initializing');
            appSetting = CpmServerCustomSettingHelper.initializeAppSettings();
        }else{
            appSetting = appSettings[0];
        }

        return appSetting;
    }    

    public static Cpm_Server_Settings__c initializeAppSettings(){ 
        System.debug('Running CpmServerCustomSettingHelper.initializeAppSettings');
        List<Cpm_Server_Settings__c> appSettings = [SELECT Id, Last_Library_Refresh_Date__c, Initial_Config_Flag__c, Sandbox_Flag__c, App_Deployer_URL__c FROM Cpm_Server_Settings__c];

        if(appSettings.size() != 0){
            delete appSettings;
        }

        Cpm_Server_Settings__c appSetting = new Cpm_Server_Settings__c();
        System.debug('Initializing appSettings');
        Organization organization = [SELECT IsSandbox FROM Organization LIMIT 1];
        if(organization.IsSandbox){
            appSetting.Sandbox_Flag__c = true; 
            appSetting.App_Deployer_URL__c = 'http://localhost:8443/byoo';
        }else{
            appSetting.Sandbox_Flag__c = false;
            appSetting.App_Deployer_URL__c = 'https://gpbu-deployer.herokuapp.com/byoo';           
        }   


        insert appSetting;

        return appSetting;
    }    



}
