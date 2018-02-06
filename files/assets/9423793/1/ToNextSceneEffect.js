pc.extend(pc,function(){
    var ToNextScenePostEffect = function(graphicsDevice,vs,fs){
        this.shader = new pc.Shader(graphicsDevice,{
            attributes:{
                aPosition:pc.SEMANTIC_POSITION
            },
            vshader:vs,
            fshader:fs
        });
    };
    ToNextScenePostEffect = pc.inherits(ToNextScenePostEffect,pc.PostEffect);
    
    ToNextScenePostEffect.prototype = pc.extend(ToNextScenePostEffect.prototype,{
        
        render:function(inputTarget,outputTarget,rect){
            var device = this.device;
            var scope = device.scope;
            scope.resolve('timer').setValue(this.timer);
            scope.resolve('uColorBuffer').setValue(inputTarget.colorBuffer);
            pc.drawFullscreenQuad(device,outputTarget,this.vertexBuffer,this.shader,rect);
        }
 
    });
    
    return  {
        ToNextScenePostEffect : ToNextScenePostEffect
    };
}());


var ToNextSceneEffect = pc.createScript('ToNextSceneEffect');
ToNextSceneEffect.attributes.add('timer',{type:'number',default:0});
// initialize code called once per entity
ToNextSceneEffect.prototype.initialize = function() {
    var app = this.app;

    var vshader = [
        "attribute vec2 aPosition;",
        "",
        "varying vec2 vUv0;",
        "",
        "void main(void)",
        "{",
        "    gl_Position = vec4(aPosition, 0.0, 1.0);",
        "    vUv0 = (aPosition.xy + 1.0) * 0.5;",
        "}"

    ].join('\n');
    
    var fshader = [
        'precision '+app.graphicsDevice.precision+' float;',
        'uniform sampler2D uColorBuffer;',
        'uniform float timer;',
        'varying vec2 vUv0;',
        'void main()',
        '{',
            'vec4 color = texture2D(uColorBuffer,vUv0);',
	        'gl_FragColor = color*vec4(1.0-timer,1.0-timer,1.0-timer,1.0-timer);',
        '}'
    ].join('\n');
    this.effect = new pc.ToNextScenePostEffect(app.graphicsDevice,vshader,fshader);
    
    this.effect.timer = this.timer;
    this.on('attr:timer',function(){
         this.effect.timer = this.timer;
    });
    var queue = this.entity.camera.postEffects;
    queue.addEffect(this.effect);
    
    this.on('enable',function(){
        queue.addEffect(this.effect);
    });
    
    this.on('disable',function(){
        queue.removeEffect(this.effect);
    });
    
    this.enabled = false;
    
    
};

// update code called every frame
ToNextSceneEffect.prototype.update = function(dt) {
    
};
