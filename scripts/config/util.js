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
    CombatTracker.prototype._onCombatantMouseDown = async function(event) {
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

    //Temporarily override panning in setPosition until update provides option to prevent recentering
    Token.prototype.setPosition = async function(x, y, {animate=true}={}) {

        // Create a Ray for the requested movement
        let origin = this._movement ? this.position : this._validPosition,
            target = {x: x, y: y},
            isVisible = this.isVisible;
    
        // Create the movement ray
        let ray = new Ray(origin, target);
    
        // Update the new valid position
        this._validPosition = target;
    
        // Record the Token's new velocity
        this._velocity = this._updateVelocity(ray);
    
        // Update visibility for a non-controlled token which may have moved into the controlled tokens FOV
        this.visible = isVisible;
    
        // Conceal the HUD if it targets this Token
        if ( this.hasActiveHUD ) this.layer.hud.clear();
    
        // Either animate movement to the destination position, or set it directly if animation is disabled
        if ( animate ) await this.animateMovement(new Ray(this.position, ray.B));
        else this.position.set(x, y);
    
        // Removed pan to token logic
        return this;
      }
}