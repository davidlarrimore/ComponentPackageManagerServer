import { LightningElement, api } from "lwc";

export default class CpmComponentAvailableListView extends LightningElement {
  @api demoComponents;

  get numberOfRecords(){
    if(undefined !== this.demoComponents){
      return this.demoComponents.length;
    } 
    return 0;
  }
  
  get hasRows(){
    if(this.demoComponents && this.demoComponents.length > 0){
      return true;
    }
    return false;
  }

  updateSearch(event) {
    this.progressValue = event.target.value;
    // Creates the event with the data.
    const selectedEvent = new CustomEvent("calvsearchstring", {
      detail: this.progressValue
    });

    // Dispatches the event.
    this.dispatchEvent(selectedEvent);
  }


}