public with sharing class APIHelper {
    public APIHelper() {

    }

    public static Map<String,Object> doRestRequest(String url, Boolean auth){
        system.debug('Running getRestRequest');
        system.debug('URL is ' + url);

        HttpRequest request = new HttpRequest();
        if(auth){
            request.setHeader('Authorization', 'Bearer ' + UserInfo.getSessionID());
        }
        request.setHeader('Content-Type', 'application/json');

        request.setEndpoint(url); 
        request.setMethod('GET');   
          
        try{

            Http http = new Http();
            HttpResponse response = http.send(request);

            if (response.getStatusCode() == 200) {
                // Deserialize the JSON string into collections of primitive data types.
                system.debug('Success!');
                system.debug('Response: ' + response.getBody());
                return (Map<String, Object>) JSON.deserializeUntyped(response.getBody());
            }else{
                system.debug('Request failed. Status Code: ' + response.getStatusCode());
                return null;
            }

        }catch(Exception e){
            system.debug('Error Running HTTP Request: ' + e);
            return null;
        }  
    }


    public static String doRestRequestJSON(String url, Boolean auth){
        system.debug('Running getRestRequest');
        system.debug('URL is ' + url);

        HttpRequest request = new HttpRequest();
        if(auth){
            request.setHeader('Authorization', 'Bearer ' + UserInfo.getSessionID());
        }
        request.setHeader('Content-Type', 'application/json');

        request.setEndpoint(url); 
        request.setMethod('GET');   
          
        try{

            Http http = new Http();
            HttpResponse response = http.send(request);

            if (response.getStatusCode() == 200) {
                // Deserialize the JSON string into collections of primitive data types.
                system.debug('Success!');
                system.debug('Response: ');
                APIHelper.mDebugUntruncated(response.getBody());
                return response.getBody();
            }else{
                system.debug('Request failed. Status Code: ' + response.getStatusCode());
                return null;
            }

        }catch(Exception e){
            system.debug('Error Running HTTP Request: ' + e);
            return null;
        }  
    }

    public static void mDebugUntruncated(String sMsg) {
        for (Integer i = 0; i < sMsg.length(); i=i+300) {
            Integer iEffectiveEnd = (i+300 > (sMsg.length()-1) ? sMsg.length()-1 : i+300);
            System.debug(sMsg.substring(i,iEffectiveEnd));
        }
    }



}