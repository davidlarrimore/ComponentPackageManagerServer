import { LightningElement, track } from "lwc";
import { subscribe, unsubscribe, onError } from "lightning/empApi";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

export default class cmpAsynchJobMonitor extends LightningElement {
  channelName = "/event/CPM_Async_Event__e";
  isSubscribeDisabled = false;
  isUnsubscribeDisabled = !this.isSubscribeDisabled;
  subscription = {};

  cols = [
    {
        type: 'text',
        fieldName: 'Job_Name__c',
        label: 'Job Name',
    },
    {
        type: 'text',
        label: 'Status',
        cellAttributes: { iconName: { fieldName: 'iconName' }, iconPosition: 'right'},
        initialWidth:75
    },
  ];

  @track jobTracker = [];


  get hasJobs(){
    if(this.jobTracker.length > 0){
      return true;
    }
    return false;
  }

  connectedCallback() {
    console.log(`cmpAsynchJobMonitor Callback`);
    this.registerErrorListener();
    this.handleSubscribe();
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    setInterval(() => {
      console.log(`PING! Interval hit...pruning`);
      this.doPruneJobTracker();
    }, 10000);
  }


  doPruneJobTracker(){
    let newJobTracker = [];
    for (let i = 0; i < this.jobTracker.length; i++) {
      let job = this.jobTracker[i];
      if (job.markedForRemoval === false){
        if(job.Current_Job_Stage__c === 'Completed'){
          job.markedForRemoval = true;
          console.log(`${job.Job_Name__c} is completed and now marked for removal, will remove next round.`);
        }
        newJobTracker.push(job);
      }
    }
    this.jobTracker = newJobTracker;
  }


  // Tracks changes to channelName text field
  handleChannelName(event) {
    this.channelName = event.target.value;
  }

  doProcessPlatformEventCPMAsync(payload) {
    console.log(`Processing CPM Async Event Payload ${payload.Job_Id__c}`);
    if (undefined !== payload.Job_Id__c) {
      console.log(`Current list of CPM Async Events (CPM_Async_Event__e) = ${this.jobTracker.length}`);
      let newJob = payload;
      newJob.icon = {};
      newJob.events = [];

      let newJobEvent = [{
        'Event_Status_Title__c': payload.Event_Status_Title__c,
        'Event_Status_Message__c': payload.Event_Status_Message__c,
        'Event_Level__c': payload.Event_Level__c,
        'Current_Job_Stage__c': payload.Current_Job_Stage__c
      }];

      newJob.markedForRemoval = false;

      switch (newJob.Current_Job_Stage__c) {
        case "Completed":
          newJob.icon.name = "action:approval";
          newJob.iconName = "action:approval";
          newJob.icon.altText = "Completed";
          newJob.icon.title = "Completed";
          newJob.icon.variant = "success";
          break;
        case "Queued":
          newJob.icon.name = "action:refresh";
          newJob.iconName = "action:refresh";
          newJob.icon.altText = "Queued";
          newJob.icon.title = "Queued";
          newJob.icon.variant = "inverse";
          break;
        case "Processing":
          newJob.icon.name = "action:defer";
          newJob.iconName = "action:defer";
          newJob.icon.altText = "Processing";
          newJob.icon.title = "Processing";
          newJob.icon.variant = "warning";
          break;
        case "Failed":
          newJob.icon.name = "action:close";
          newJob.iconName = "action:close";
          newJob.icon.altText = "Failed";
          newJob.icon.title = "Failed";
          newJob.icon.variant = "error";
          break;
        default:
          newJob.icon.name = "action:refresh";
          newJob.iconName = "action:refresh";
          newJob.icon.altText = "Other";
          newJob.icon.title = "Other";
          newJob.icon.variant = "inverse";
          break;
      }
      console.log(`Successfully updated icons for ${newJob.Current_Job_Stage__c}`);

      for (let i = 0; i < this.jobTracker.length; i++) {
        if (this.jobTracker[i].Job_Id__c === newJob.Job_Id__c) {
          console.log(`Found Existing CPM Async Event (CPM_Async_Event__e), updating Events...`);
          newJob.events = this.jobTracker[i].events;

          if (this.jobTracker[i]._children) {
            newJob._children = this.jobTracker[i]._children;
          }

        }
      }

      newJob.events.push(newJobEvent);
      this.doPushJob(newJob);

    }else{
      console.log('TODO: Will need to figure out a way for Job info to propogate, in child jobs');
    }
    console.log("Completed doProcessPlatformEventCPMAsync()");
  }

  doPushJob(newJob){
    console.log(`Pushing Job`);
    //Processing Child Jobs
    if (newJob.Job_Parent_Id__c != null) {
      console.log(`This is a Child Job, adding to child`);
      let newJobTracker = this.jobTracker;
      for (let i = 0; i < newJobTracker.length; i++) {
        if (newJobTracker[i].Job_Id__c === newJob.Job_Parent_Id__c) {
          if (newJobTracker[i]._children) {
            console.log(`Parent job had existing Children, Upserting`);
            let newChildArray = [];
            let newJobFlag = true;
              for (let j = 0; j < newJobTracker[i]._children.length; j++) {
                if (newJobTracker[i]._children[j].Job_Id__c === newJob.Job_Id__c) {
                  console.log(`Found the existing Child Job`);
                  newJobFlag = false;
                  newChildArray.push(newJob);
                }else{
                  newChildArray.push(newJobTracker[i]._children[j]);
                }
              }
              if(newJobFlag){
                console.log(`This was a newly reported child job for this parent Job, adding`);
                newChildArray.push(newJob);
              }
              newJobTracker[i]._children = newChildArray;
          }else{
            console.log(`Parent Job had no children...Congratulations, you are now a father...`);
            newJobTracker[i]._children = [];
            newJobTracker[i]._children.push(newJob);
          }
        }
      }
      this.jobTracker = newJobTracker;
    }else{
      console.log(`This is not a child Job`);
      let newJobFlag = true;
      let newJobTracker = [];
      for (let i = 0; i < this.jobTracker.length; i++) {
        if (this.jobTracker[i].Job_Id__c === newJob.Job_Id__c) {
          console.log(`Found Existing CPM Async Event (CPM_Async_Event__e), updating...`);
          newJobFlag = false;
          newJob.events = this.jobTracker[i].events;

          newJobTracker.push(newJob);
        }else{
          newJobTracker.push(this.jobTracker[i]);
        }
      }
      if(newJobFlag){
        newJobTracker.push(newJob);
      }
      this.jobTracker = newJobTracker;
    }
    console.log(`Completed Pushing Job ${this.jobTracker}`);
  }


  doGetParentStatus(newJob){
    //LOGIC TO SEE IF CHILD JOBS EXISTS, IF SO, WE UPDATE STAGE TO REFLECT TOTAL STATUS
    if(newJob._children){
      for (let j = 0; j < newJob._children.length; j++) {
        let runningJobFlag = false;
        let jobFailedFlag = false;
        //If any child jobs are less than completed, we mark as processing
        if (this.getJobStageNumber(newJob._children[j].Current_Job_Stage__c) < 3){
          newJob.Current_Job_Stage__c = "Processing";
          runningJobFlag = true;
        }else{
          if(newJob.Current_Job_Stage__c === "Failed"){
              jobFailedFlag = true;
          }
        }
        if(!runningJobFlag){
          if(jobFailedFlag){
            newJob.Current_Job_Stage__c = "Completed with Errors";
          }else{
            newJob.Current_Job_Stage__c = "Completed";
          }
        }
      }
      
      switch (newJob.Current_Job_Stage__c) {
        case "Completed":
          newJob.icon.name = "action:approval";
          newJob.iconName = "action:approval";
          newJob.icon.altText = "Completed";
          newJob.icon.title = "Completed";
          newJob.icon.variant = "success";
          break;
          case "Completed with Errors":
            newJob.icon.name = "action:reject";
            newJob.iconName = "action:reject";
            newJob.icon.altText = "Completed with Errors";
            newJob.icon.title = "Completed with Errors";
            newJob.icon.variant = "warning";
            break;                
        case "Queued":
          newJob.icon.name = "action:refresh";
          newJob.iconName = "action:refresh";
          newJob.icon.altText = "Queued";
          newJob.icon.title = "Queued";
          newJob.icon.variant = "inverse";
          break;
        case "Processing":
          newJob.icon.name = "action:defer";
          newJob.iconName = "action:defer";
          newJob.icon.altText = "Processing";
          newJob.icon.title = "Processing";
          newJob.icon.variant = "warning";
          break;
        case "Failed":
          newJob.icon.name = "action:close";
          newJob.iconName = "action:close";
          newJob.icon.altText = "Failed";
          newJob.icon.title = "Failed";
          newJob.icon.variant = "error";
          break;
        default:
          newJob.icon.name = "action:refresh";
          newJob.iconName = "action:refresh";
          newJob.icon.altText = "Other";
          newJob.icon.title = "Other";
          newJob.icon.variant = "inverse";
          break;
      }
      console.log(`Since there are child Jobs, we have updated icons`);

    }
  }


  doToast(payload) {
    console.log("Publishing Toast");
    try {
      const evt = new ShowToastEvent({
        mode: "pester",
        title: payload.Event_Status_Title__c,
        message: payload.Event_Status_Message__c,
        variant: payload.Event_Level__c
      });
      this.dispatchEvent(evt);
    } catch (err) {
      console.log(`Toast error: ${err}`);
    }
  }

  getJobStageNumber(jobStage){

    let retval = 1;
    switch (jobStage) {
      case "Completed":
        retval = 3;
        break;
      case "Queued":
        retval = 1;
        break;
      case "Processing":
        retval = 2;
        break;
      case "Failed":
        retval = 3;
        break;
      default:
        retval = 1;
        break;
    }
    return retval;
  }





  // Handles subscribe button click
  handleSubscribe() {
    // Callback invoked whenever a new event message is received
    const messageCallback = function (response) {
      console.log("New message received: ", JSON.stringify(response));
      this.doProcessPlatformEventCPMAsync(response.data.payload);

      if (response.data.payload.Send_Toast_Flag__c) {
        console.log(`Toast requested`);
        this.doToast(response.data.payload);
      }

      // Response contains the payload of the new message received
    }.bind(this);

    // Invoke subscribe method of empApi. Pass reference to messageCallback
    subscribe(this.channelName, -1, messageCallback).then((response) => {
      // Response contains the subscription information on subscribe call
      console.log(
        "Subscription request sent to: ",
        JSON.stringify(response.channel)
      );
      this.subscription = response;
      this.toggleSubscribeButton(true);
    });
  }

  // Handles unsubscribe button click
  handleUnsubscribe() {
    this.toggleSubscribeButton(false);

    // Invoke unsubscribe method of empApi
    unsubscribe(this.subscription, (response) => {
      console.log("unsubscribe() response: ", JSON.stringify(response));
      // Response is true for successful unsubscribe
    });
  }

  toggleSubscribeButton(enableSubscribe) {
    this.isSubscribeDisabled = enableSubscribe;
    this.isUnsubscribeDisabled = !enableSubscribe;
  }

  registerErrorListener() {
    // Invoke onError empApi method
    onError((error) => {
      console.log("Received error from server: ", JSON.stringify(error));
      // Error contains the server-side error
    });
  }
}
