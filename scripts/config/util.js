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

    //Disabled drag/drop
    SidebarDirectory.prototype._canDragStart = function() {
        return false;
    }

    //Override and remove panning to token logic
    CombatTracker.prototype._onCombatantMouseDown = function(event) {
        event.preventDefault();
    
        const li = event.currentTarget;
        const combatant = this.viewed.combatants.get(li.dataset.combatantId);
        const token = combatant.token;
        if ( !combatant.actor?.testUserPermission(game.user, "OBSERVED") ) return;
        const now = Date.now();
    
        // Handle double-left click to open sheet
        const dt = now - this._clickTime;
        this._clickTime = now;
        if ( dt <= 250 ) return combatant.actor?.sheet.render(true);
    }
}