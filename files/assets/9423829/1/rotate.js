var Rotate = pc.createScript('rotate');
Rotate.attributes.add('rotatespeed',{type:'number',default:30});
Rotate.attributes.add('canrotate',{type:'boolean',default:true});
// initialize code called once per entity
Rotate.prototype.initialize = function() {
    
};

// update code called every frame
Rotate.prototype.update = function(dt) {
    if(this.canrotate){
        this.entity.rotate(0,this.rotatespeed*dt,0);
    }
};

// swap method called for script hot-reloading
// inherit your script state here
// Rotate.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// http://developer.playcanvas.com/en/user-manual/scripting/