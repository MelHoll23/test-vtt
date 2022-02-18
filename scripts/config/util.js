export function throttle (callback, limit) {
    var waiting = false;                      
    return function () {                      
        if (!waiting) {                       
            callback.apply(this, arguments);  
            waiting = true;                   
            setTimeout(function () {          
                waiting = false;              
            }, limit);
        }
    }
}

export function overrideMethods(){
    // Prevent opening character sheet on double click
    Token.prototype._onClickLeft2 = function(event) {} 

    //Make character sheets readonly
    TokenHUD.prototype._onTokenConfig = function(event){
        event.preventDefault();
        const actor = this.object.document.actor;

        actor.sheet.render(true, {editable: false});
    }

    SidebarDirectory.prototype._onClickDocumentName = function(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const documentId = element.parentElement.dataset.documentId;
        const document = this.constructor.collection.get(documentId);
        const sheet = document.sheet;
    
        // If the sheet is already rendered:
        if ( sheet.rendered ) {
            sheet.bringToTop();
            return sheet.maximize();
        }
    
        // Otherwise render the sheet
        else sheet.render(true, {editable: false});
    }
}