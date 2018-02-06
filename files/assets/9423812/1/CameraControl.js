var CameraControl = pc.createScript('CameraControl');

CameraControl.prototype.initialize = function() {
    
    var app = this.app;
   
    this.limitRotX = 30;
    this.limitmindis = 8;
    this.limitmaxdis = 20;
    
    
    this.targetRotY = 0; 
    this.targetRotX = -20;
    this.targetDistance = 12;
    this.targetViewPos = new pc.Vec3(0,4,0); 
    
    this.rotY = this.targetRotY;
    this.rotX = this.targetRotX;
    this.distance = 12;
    this.rotatespeed = 0.5;
    this.viewPos = new pc.Vec3(0,4,0);
    
    this.transformStarted = false;

    var self = this;
    
    app.mouse.disableContextMenu();
    
    var options = {
        recognizers:[
            [Hammer.Pinch],
            [Hammer.Pan]
        ]
    };
    
    this.hammer = new Hammer(pc.platform.ios?document.getElementsByClassName('showpage')[0]:document.body,options);
    var cachedTargetDistance;
    this.hammer.on("pinchstart",function(e){
        if(AppState.curstate === AppState.states.CameraConrol)
        {
            this.transformStarted = true;
            cachedTargetDistance = this.targetDistance;
            this.hammer.get('pan').set({enable:false});
            //e.preventDefault();
        }
    }.bind(this));
    this.hammer.on('pinchend',function(e){
        if(AppState.curstate === AppState.states.CameraConrol)
        {
            this.transformStarted = false;
            this.hammer.get('pan').set({enable:true});
        }
    }.bind(this));
    this.hammer.on('pinch',function(e){
        if(this.transformStarted)
        {
            var scale = e.scale;
            this.targetDistance = cachedTargetDistance/scale;
            this.dolly(0);
        }
    }.bind(this));
    var cachedX,cachedY;
    this.hammer.on('panstart',function(e){

            if(!this.transformStarted)
            {
                cachedX = e.center.x;
                cachedY = e.center.y;
                this.dragStarted = true;
            }
        
    }.bind(this));
    this.hammer.on('panend',function(e){
        if(this.dragStarted)
        {
            this.dragStarted = false;
        }
    }.bind(this));
    this.hammer.on('pan',function(e){
        if(AppState.curstate === AppState.states.CameraConrol)
        {
            if(this.dragStarted)
            {
                var dx = e.center.x - cachedX;
                var dy = e.center.y - cachedY;
                this.orbit(this.rotatespeed*dx,this.rotatespeed*dy);
                cachedX = e.center.x;
                cachedY = e.center.y;
            }
        }

        
    }.bind(this));

    app.mouse.on(pc.EVENT_MOUSEWHEEL,this.onMouseWheel,this);
    app.mouse.on(pc.EVENT_MOUSEMOVE,this.onMouseMove,this);
};

CameraControl.prototype.update = function(dt) {
    
    this.viewPos.lerp(this.viewPos, this.targetViewPos, dt / 0.1);
    this.distance = pc.math.lerp(this.distance, this.targetDistance, dt / 0.2);
    this.rotX = pc.math.lerp(this.rotX, this.targetRotX, dt / 0.2);
    this.rotY = pc.math.lerp(this.rotY, this.targetRotY, dt / 0.2);
    this.localrotY = pc.math.lerp(this.localrotY,this.targetlocalrotY,dt/0.2);
    
    this.entity.setPosition(this.viewPos);
    this.entity.setEulerAngles(this.rotX,this.rotY,0);
    this.entity.translateLocal(0, 0, this.distance);
    
};

CameraControl.prototype.onMouseWheel = function (event) {
    if(AppState.curstate === AppState.states.CameraConrol)
    {
        //event.event.preventDefault();
        this.dolly(event.wheel * -0.02); 
    } 
};

CameraControl.prototype.onMouseMove = function (event) {
    if(AppState.curstate === AppState.states.CameraConrol)
    {
        if (event.buttons[pc.MOUSEBUTTON_LEFT]) {
            this.orbit(event.dx * this.rotatespeed,event.dy*this.rotatespeed);
        }
        /*if (event.buttons[pc.MOUSEBUTTON_RIGHT]) {
            this.targetViewPos.set(event.dx * 0.001,event.dy*0.001,0);
        }*/
        
    }
    
};

CameraControl.prototype.orbit = function(rx,ry){
    this.targetRotY -= rx;
    this.targetRotX -= ry;
    this.targetRotX = pc.math.clamp(this.targetRotX,-this.limitRotX,0);
};

CameraControl.prototype.dolly = function (movez) {
    this.targetDistance += movez;
    this.targetDistance = pc.math.clamp(this.targetDistance,this.limitmindis,this.limitmaxdis);
};

